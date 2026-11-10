import type { ApiClient } from '@core/api';

/**
 * Kept only so the device can DELETE its server registrations by id: the
 * current one at sign-out, and `replaced_ids` — registrations an earlier
 * device token left behind whose removal has not succeeded yet.
 */
export type StoredRegistration = { id: string; token: string; replaced_ids?: string[] };

export type RegistrationDeps = {
  api: Pick<ApiClient, 'registerForPush' | 'unregisterFromPush'>;
  readStored: () => Promise<StoredRegistration | null>;
  writeStored: (registration: StoredRegistration) => Promise<void>;
};

const stored = (id: string, token: string, replaced: string[]): StoredRegistration =>
  replaced.length ? { id, token, replaced_ids: replaced } : { id, token };

/** A 404 means the server no longer has it (or it is not this principal's): nothing left to remove. */
const isGone = (error: unknown) => (error as { status?: unknown } | null)?.status === 404;

/**
 * Best-effort DELETE of each id; answers the ids still on the server.
 * Never throws: a failure leaves the id for the next attempt.
 */
export const removeRegistrations = async (
  api: Pick<ApiClient, 'unregisterFromPush'>,
  ids: string[]
): Promise<string[]> => {
  const remaining: string[] = [];
  for (const id of ids) {
    try {
      await api.unregisterFromPush(id);
    } catch (error) {
      if (!isGone(error)) remaining.push(id);
    }
  }
  return remaining;
};

/**
 * Registers on every call (every sign-in and session restore), even when the
 * device token is unchanged: the backend upserts on (principal, token),
 * answers the same id and writes nothing when nothing changed. Skipping on an
 * unchanged token would leave the server unaware of businesses the owner
 * gained access to since the last registration.
 *
 * When the operating system has rotated the token, the server answers a new
 * id and the previous registration would keep pointing at a dead token. The
 * new registration is stored FIRST, with the old id marked as replaced; only
 * then is the old one deleted. A failed delete keeps the new registration and
 * leaves the old id in `replaced_ids` for the next sign-in to retry.
 */
export const submitRegistration = async (
  { api, readStored, writeStored }: RegistrationDeps,
  input: { platform: 'ios' | 'android'; expo_push_token: string; locale: 'en' | 'fi' }
): Promise<void> => {
  const previous = await readStored();
  const { id } = await api.registerForPush(input);
  const token = input.expo_push_token;
  const replaced = [...new Set([...(previous?.replaced_ids ?? []), ...(previous ? [previous.id] : [])])]
    .filter((old) => old !== id);
  await writeStored(stored(id, token, replaced));
  if (!replaced.length) return;
  const remaining = await removeRegistrations(api, replaced);
  if (remaining.length !== replaced.length) await writeStored(stored(id, token, remaining));
};

/** The Android notification channel is named for the active shell's brand. */
export const androidChannelName = (shell: { brandName: string }): string => shell.brandName;
