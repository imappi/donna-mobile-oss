import type { ApiClient } from '@core/api';

/** Kept only so sign-out can DELETE the server's registration by id. */
export type StoredRegistration = { id: string; token: string };

export type RegistrationDeps = {
  api: Pick<ApiClient, 'registerForPush'>;
  writeStored: (registration: StoredRegistration) => Promise<void>;
};

/**
 * Registers on every call (every sign-in and session restore), even when the
 * device token is unchanged: the backend upserts on (principal, token),
 * answers the same id and writes nothing when nothing changed. Skipping on an
 * unchanged token would leave the server unaware of businesses the owner
 * gained access to since the last registration.
 */
export const submitRegistration = async (
  { api, writeStored }: RegistrationDeps,
  input: { platform: 'ios' | 'android'; expo_push_token: string; locale: 'en' | 'fi' }
): Promise<void> => {
  const { id } = await api.registerForPush(input);
  await writeStored({ id, token: input.expo_push_token });
};

/** The Android notification channel is named for the active shell's brand. */
export const androidChannelName = (shell: { brandName: string }): string => shell.brandName;
