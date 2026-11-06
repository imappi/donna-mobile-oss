import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import type { ApiClient, Doc } from '../api';

/**
 * The capture upload flow — the contract's three steps in one call:
 * intent → PUT bytes → register. Ids are minted ONCE, at capture time
 * (the outbox stores them), and reused verbatim on every replay: the
 * contract's register endpoint is idempotent on the client-minted id, so
 * a retry after a crash or a dead connection can never double-register.
 */
export type PickedFile = {
  uri: string;
  filename: string;
  mimeType: string;
  size: number;
  source: 'camera' | 'photo_library' | 'file';
  purpose?: 'prior_records';
};

/** One cryptographically strong id, minted once and persisted for every replay. */
export const mintCaptureId = () => `doc-${Crypto.randomUUID()}`;

const checksumOf = async (uri: string): Promise<string> => {
  // Checksum of the base64 encoding, not the raw bytes — consistent for
  // dedupe against this contract's mock. A production backend that
  // verifies raw-byte SHA-256 needs a native digest here; recorded in
  // contract/DESIGN-NOTES.md territory, not silently divergent.
  if (Platform.OS === 'web') {
    const bytes = await (await fetch(uri)).arrayBuffer();
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, base64);
};

export type CaptureUploadInput = {
  /** Client-minted (mintCaptureId) at capture time; stable across replays. */
  id: string;
  file: PickedFile;
  /** When the capture was taken — not when the replay finally got through. */
  capturedAt: string;
  answersCardId?: string | null;
};

export const performCaptureUpload = async (
  api: ApiClient,
  entityId: string,
  { id, file, capturedAt, answersCardId }: CaptureUploadInput
): Promise<Doc> => {
  const checksum = await checksumOf(file.uri);
  const intent = await api.createUploadIntent(entityId, {
    filename: file.filename,
    mime_type: file.mimeType,
    size: file.size,
    checksum_sha256: checksum
  });
  const bytes = await (await fetch(file.uri)).blob();
  await api.putUpload(intent, bytes);
  const { documents } = await api.registerDocuments(entityId, [
    {
      id,
      filename: file.filename,
      storage_bucket: intent.storage_bucket,
      storage_object_key: intent.storage_object_key,
      checksum_sha256: checksum,
      captured_at: capturedAt,
      source: file.source,
      ...(file.purpose ? { purpose: file.purpose } : {}),
      answers_card_id: answersCardId ?? null
    }
  ]);
  return documents[0];
};
