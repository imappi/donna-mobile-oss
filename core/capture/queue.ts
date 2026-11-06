import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { ApiError, type ApiClient, type Doc } from '../api';
import { mintCaptureId, performCaptureUpload, type PickedFile } from './upload';

/**
 * The offline capture outbox. Every capture lands here FIRST — persisted
 * to app-owned storage with a client-minted document id — and a drain
 * loop replays it against the contract's idempotent register until it
 * gets through. Online this is invisible (the entry uploads immediately);
 * offline the receipt survives dead connections, app restarts, and
 * entity switches, and uploads when the connection returns.
 *
 * Terminal-rule note: a queued entry is TRANSPORT state — "this capture
 * has not reached the backend yet" — the one thing the backend cannot
 * know. No verdict, no accounting state, ever lives here.
 *
 * Error policy, deliberately two-lane (the two-terminal shape on-device):
 * - transport/network failures, 401 (mid-refresh), 408/429/5xx → the
 *   entry stays 'waiting' and the drain stops (the rest would fail too);
 *   retried automatically on the next drain trigger.
 * - any other 4xx (too big, unsupported type…) → 'blocked' with the
 *   server's message: auto-retry would loop forever, so it waits for the
 *   owner to retry or remove it. Nothing is ever dropped silently.
 */
export type QueuedCaptureState = 'waiting' | 'blocked';

export type QueuedCapture = {
  id: string;
  entityId: string;
  file: PickedFile;
  capturedAt: string;
  answersCardId: string | null;
  state: QueuedCaptureState;
  /** The server's safe message when blocked; null while waiting. */
  error: string | null;
  attempts: number;
};

export type CaptureQueueEvent =
  | { type: 'queued'; entry: QueuedCapture }
  | { type: 'uploaded'; entry: QueuedCapture; doc: Doc }
  | { type: 'blocked'; entry: QueuedCapture }
  | { type: 'removed'; entry: QueuedCapture }
  /** The persisted file copy vanished (OS cleared storage) — data loss, surfaced loudly. */
  | { type: 'lost'; entry: QueuedCapture };

export type CaptureAddResult =
  | { status: 'uploaded'; doc: Doc }
  | { status: 'queued' }
  | { status: 'blocked'; error: string | null }
  | { status: 'lost' };

type Listener = (event: CaptureQueueEvent) => void;

const QUEUE_DIR = 'capture-queue/';
const INDEX_FILE = 'index.json';

const isTransient = (e: unknown): boolean => {
  if (!(e instanceof ApiError)) return true; // fetch TypeError et al. = no connection
  return e.status === 401 || e.status === 408 || e.status === 429 || e.status >= 500;
};

export class CaptureQueue {
  private api: ApiClient;
  private entries: QueuedCapture[] = [];
  private listeners = new Set<Listener>();
  private drainPromise: Promise<void> | null = null;
  private loaded = false;
  private persistent = Platform.OS !== 'web' && FileSystem.documentDirectory != null;

  constructor(api: ApiClient) {
    this.api = api;
  }

  private dir() {
    return `${FileSystem.documentDirectory}${QUEUE_DIR}`;
  }

  getEntries(): QueuedCapture[] {
    return [...this.entries];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: CaptureQueueEvent) {
    for (const listener of this.listeners) listener(event);
  }

  /** Restore persisted entries (native). Corrupt index = start empty, loudly. */
  async load(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    if (!this.persistent) return;
    try {
      const info = await FileSystem.getInfoAsync(`${this.dir()}${INDEX_FILE}`);
      if (!info.exists) return;
      const raw = await FileSystem.readAsStringAsync(`${this.dir()}${INDEX_FILE}`);
      const parsed = JSON.parse(raw) as { version: number; entries: QueuedCapture[] };
      if (parsed.version === 1 && Array.isArray(parsed.entries)) {
        // Blocked state survives restart; a restart is not a retry decision.
        this.entries = parsed.entries;
      }
    } catch (e) {
      console.warn('[capture-queue] could not restore the queue index', e);
    }
  }

  private async persist(): Promise<void> {
    if (!this.persistent) return;
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.dir());
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(this.dir(), { intermediates: true });
      await FileSystem.writeAsStringAsync(
        `${this.dir()}${INDEX_FILE}`,
        JSON.stringify({ version: 1, entries: this.entries })
      );
    } catch (e) {
      console.warn('[capture-queue] could not persist the queue index', e);
    }
  }

  /**
   * Enqueue a capture and try to send it right away. Resolves once THIS
   * entry has settled for now: uploaded, resting in the queue (offline),
   * blocked by a server rejection, or lost — so callers toast the truth
   * instead of guessing.
   */
  async add(
    entityId: string,
    file: PickedFile,
    { answersCardId }: { answersCardId?: string | null } = {}
  ): Promise<CaptureAddResult> {
    const id = mintCaptureId();
    const stored = await this.copyIntoQueueDir(id, file);
    const entry: QueuedCapture = {
      id,
      entityId,
      file: stored,
      capturedAt: new Date().toISOString(),
      answersCardId: answersCardId ?? null,
      state: 'waiting',
      error: null,
      attempts: 0
    };
    this.entries.push(entry);
    await this.persist();
    this.emit({ type: 'queued', entry });
    let uploaded: Doc | null = null;
    const unsubscribe = this.subscribe((event) => {
      if (event.type === 'uploaded' && event.entry.id === id) uploaded = event.doc;
    });
    try {
      await this.drain();
      // A drain already in flight may have passed this entry — one more pass.
      if (this.find(id)?.attempts === 0) await this.drain();
    } finally {
      unsubscribe();
    }
    if (uploaded) return { status: 'uploaded', doc: uploaded };
    const resting = this.find(id);
    if (!resting) return { status: 'lost' };
    if (resting.state === 'blocked') return { status: 'blocked', error: resting.error };
    return { status: 'queued' };
  }

  /**
   * Own the bytes: picker/camera URIs live in cache the OS may clear, so
   * the queue keeps its own copy under documentDirectory (native). On web
   * the blob URI stays valid for the session — the queue is session-only
   * there anyway.
   */
  private async copyIntoQueueDir(id: string, file: PickedFile): Promise<PickedFile> {
    if (!this.persistent) return file;
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.dir());
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(this.dir(), { intermediates: true });
      const ext = /\.\w{1,8}$/.exec(file.filename)?.[0] ?? '';
      const dest = `${this.dir()}${id}${ext}`;
      await FileSystem.copyAsync({ from: file.uri, to: dest });
      const info = await FileSystem.getInfoAsync(dest);
      const size = info.exists && 'size' in info && info.size ? info.size : file.size;
      return { ...file, uri: dest, size };
    } catch (e) {
      // Keep the original URI rather than fail the capture; it merely
      // loses restart-survival for this one entry.
      console.warn('[capture-queue] could not copy the capture into the queue dir', e);
      return file;
    }
  }

  private find(id: string): QueuedCapture | undefined {
    return this.entries.find((e) => e.id === id);
  }

  private async removeEntry(entry: QueuedCapture): Promise<void> {
    this.entries = this.entries.filter((e) => e.id !== entry.id);
    await this.persist();
    if (this.persistent && entry.file.uri.startsWith(this.dir())) {
      FileSystem.deleteAsync(entry.file.uri, { idempotent: true }).catch(() => {});
    }
  }

  /** Owner-initiated: clear a blocked entry back to waiting and try again. */
  async retry(id: string): Promise<void> {
    const entry = this.find(id);
    if (!entry) return;
    entry.state = 'waiting';
    entry.error = null;
    await this.persist();
    this.emit({ type: 'queued', entry });
    await this.drain();
  }

  /** Owner-initiated: discard a queued capture (its file copy included). */
  async remove(id: string): Promise<void> {
    const entry = this.find(id);
    if (!entry) return;
    await this.removeEntry(entry);
    this.emit({ type: 'removed', entry });
  }

  /** Single-flight; concurrent calls share the in-flight pass. */
  drain(): Promise<void> {
    if (!this.drainPromise) {
      this.drainPromise = this.drainLoop().finally(() => {
        this.drainPromise = null;
      });
    }
    return this.drainPromise;
  }

  private async drainLoop(): Promise<void> {
    // Reads live state each round so entries added mid-drain are seen.
    for (;;) {
      const entry = this.entries.find((e) => e.state === 'waiting');
      if (!entry) return;
      if (this.persistent) {
        const info = await FileSystem.getInfoAsync(entry.file.uri).catch(() => null);
        if (info && !info.exists) {
          await this.removeEntry(entry);
          this.emit({ type: 'lost', entry });
          continue;
        }
      }
      entry.attempts += 1;
      try {
        const doc = await performCaptureUpload(this.api, entry.entityId, {
          id: entry.id,
          file: entry.file,
          capturedAt: entry.capturedAt,
          answersCardId: entry.answersCardId
        });
        await this.removeEntry(entry);
        this.emit({ type: 'uploaded', entry, doc });
      } catch (e) {
        if (isTransient(e)) {
          // Offline (or the backend is): stop — the rest would fail too.
          await this.persist();
          return;
        }
        entry.state = 'blocked';
        entry.error = e instanceof ApiError ? e.message : String(e);
        await this.persist();
        this.emit({ type: 'blocked', entry });
      }
    }
  }
}
