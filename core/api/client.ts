import type {
  MobileSettings, MobileSettingsAction, MobileSettingsResult,
  ActivityEvent,
  AppliableChatAction,
  ArtifactConversation,
  ArtifactKind,
  BooksStatus,
  FinancialReview,
  BusinessSetup,
  BusinessSetupAction,
  BusinessSetupResult,
  RegistryCandidate,
  ChatMessage,
  Decision,
  DecisionResult,
  Doc,
  ParseStatus,
  OnboardingProfileConfirmation,
  OnboardingProfileConfirmationResult,
  QueueCard,
  QueueResponse,
  Receipt,
  Session,
  UploadIntent,
  VoiceOnboardingDraft
} from './types';

/**
 * The thin typed client over contract/mobile-api.yaml. Behavior mirrors
 * the reference backend's own client seam: bearer token on every call,
 * one refresh-and-retry on 401 (single-flight), typed error envelope.
 * Platform-agnostic on purpose — token persistence is injected (the app
 * wires SecureStore; tests wire memory).
 */
export type TokenPair = { access_token: string; refresh_token: string };

export type TokenStore = {
  get: () => Promise<TokenPair | null>;
  set: (tokens: TokenPair) => Promise<void>;
  clear: () => Promise<void>;
};

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Builds a URL path from a template, encoding EVERY interpolated value as
 * exactly one path segment. Ids are opaque backend values (`outbound_action:x`,
 * anything the server mints), so none of them may be able to add a segment,
 * a query or a fragment. Query strings are appended outside this helper.
 * Every JSON API method builds its path through here.
 */
export const path = (strings: TemplateStringsArray, ...segments: string[]): string =>
  strings.reduce((out, literal, index) =>
    out + literal + (index < segments.length ? encodeURIComponent(segments[index]) : ''), '');

export class ApiClient {
  private baseUrl: string;
  private store: TokenStore;
  private refreshing: Promise<boolean> | null = null;
  private onSessionExpired?: () => void;

  constructor(baseUrl: string, store: TokenStore, onSessionExpired?: () => void) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.store = store;
    this.onSessionExpired = onSessionExpired;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    { retry = true }: { retry?: boolean } = {}
  ): Promise<T> {
    const tokens = await this.store.get();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(tokens ? { Authorization: `Bearer ${tokens.access_token}` } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    if (response.status === 401 && retry) {
      const refreshed = await this.refreshOnce();
      if (refreshed) return this.request<T>(method, path, body, { retry: false });
      this.onSessionExpired?.();
    }
    if (response.status === 204) return undefined as T;
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const err = (json ?? {}) as { error?: string; code?: string };
      throw new ApiError(response.status, err.code ?? 'UNKNOWN', err.error ?? `Request failed with ${response.status}`);
    }
    return json as T;
  }

  private refreshOnce(): Promise<boolean> {
    if (!this.refreshing) {
      this.refreshing = (async () => {
        const tokens = await this.store.get();
        if (!tokens) return false;
        try {
          const session = await this.request<Session>(
            'POST',
            '/auth/sessions/refresh',
            { refresh_token: tokens.refresh_token },
            { retry: false }
          );
          await this.store.set({ access_token: session.access_token, refresh_token: session.refresh_token });
          return true;
        } catch {
          await this.store.clear();
          return false;
        }
      })().finally(() => {
        this.refreshing = null;
      });
    }
    return this.refreshing;
  }

  private async requestAudio<T>(
    path: string,
    audio: Blob,
    filename: string,
    mimeType: string,
    durationSeconds: number,
    { retry = true, signal }: { retry?: boolean; signal?: AbortSignal } = {}
  ): Promise<T> {
    const tokens = await this.store.get();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(tokens ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
        'Content-Type': mimeType,
        'X-Audio-Filename': encodeURIComponent(filename),
        'X-Audio-Duration-Seconds': String(durationSeconds)
      },
      body: audio,
      signal
    });
    if (response.status === 401 && retry) {
      const refreshed = await this.refreshOnce();
      if (refreshed) {
        return this.requestAudio<T>(path, audio, filename, mimeType, durationSeconds, {
          retry: false,
          signal
        });
      }
      this.onSessionExpired?.();
    }
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const err = (json ?? {}) as { error?: string; code?: string };
      throw new ApiError(response.status, err.code ?? 'UNKNOWN', err.error ?? `Request failed with ${response.status}`);
    }
    return json as T;
  }

  // ── settings ──────────────────────────────────────────────────────────
  getSettings(entityId: string): Promise<MobileSettings> {
    return this.request('GET', path`/entities/${entityId}/settings`);
  }

  updateSettings(entityId: string, action: MobileSettingsAction): Promise<MobileSettingsResult> {
    return this.request('POST', path`/entities/${entityId}/settings`, action);
  }

  // ── auth ──────────────────────────────────────────────────────────────
  async signIn(email: string, password: string): Promise<Session> {
    const session = await this.request<Session>('POST', '/auth/sessions', { email, password }, { retry: false });
    await this.store.set({ access_token: session.access_token, refresh_token: session.refresh_token });
    return session;
  }

  async signOut(): Promise<void> {
    try {
      await this.request<void>('DELETE', '/auth/sessions/current');
    } finally {
      await this.store.clear();
    }
  }

  getFinancialReview(entityId: string, kind: 'taxes' | 'month', period?: string) {
    return this.request<FinancialReview>('GET',
      path`/entities/${entityId}/reviews/${kind}` + (period ? `?period=${encodeURIComponent(period)}` : ''));
  }

  getMe() {
    return this.request<{ principal: Session['principal']; entities: Session['entities']; default_entity_id: string }>(
      'GET',
      '/me'
    );
  }

  requestAccountDeletion() {
    return this.request<{ requested_at: string; message: string }>('POST', '/me/deletion-request');
  }

  // ── onboarding profile ────────────────────────────────────────────────
  createTextOnboardingDraft(entityId: string, text: string) {
    return this.request<VoiceOnboardingDraft>('POST', path`/entities/${entityId}/onboarding/text-draft`, { text });
  }

  createVoiceOnboardingDraft(
    entityId: string,
    audio: Blob,
    filename: string,
    mimeType: string,
    durationSeconds: number,
    signal?: AbortSignal
  ) {
    return this.requestAudio<VoiceOnboardingDraft>(
      path`/entities/${entityId}/onboarding/voice-draft`,
      audio,
      filename,
      mimeType,
      durationSeconds,
      { signal }
    );
  }

  confirmOnboardingProfile(entityId: string, input: OnboardingProfileConfirmation) {
    return this.request<OnboardingProfileConfirmationResult>(
      'PUT',
      path`/entities/${entityId}/onboarding/profile`,
      input
    );
  }

  // ── queue ─────────────────────────────────────────────────────────────
  getBusinessSetup(entityId: string) {
    return this.request<BusinessSetup>('GET', path`/entities/${entityId}/business-setup`);
  }

  lookupBusiness(entityId: string, businessId: string) {
    return this.request<{ candidate: RegistryCandidate | null }>('POST', path`/entities/${entityId}/business-setup/lookup`, { business_id: businessId });
  }

  updateBusinessSetup(entityId: string, action: BusinessSetupAction) {
    return this.request<BusinessSetupResult>('POST', path`/entities/${entityId}/business-setup`, action);
  }

  getQueue(entityId: string) {
    return this.request<QueueResponse>('GET', path`/entities/${entityId}/queue`);
  }

  getQueueCard(entityId: string, cardId: string) {
    return this.request<QueueCard>('GET', path`/entities/${entityId}/queue/cards/${cardId}`);
  }

  decideQueueCard(entityId: string, cardId: string, decision: Decision) {
    return this.request<DecisionResult>(
      'POST',
      path`/entities/${entityId}/queue/cards/${cardId}/decision`,
      decision
    );
  }

  // ── status ────────────────────────────────────────────────────────────
  getBooksStatus(entityId: string) {
    return this.request<BooksStatus>('GET', path`/entities/${entityId}/status`);
  }

  // ── documents ─────────────────────────────────────────────────────────
  listDocuments(entityId: string, limit = 30) {
    return this.request<{ documents: Doc[]; next_cursor?: string | null }>(
      'GET',
      path`/entities/${entityId}/documents` + `?limit=${limit}`
    );
  }

  getDocument(entityId: string, documentId: string) {
    return this.request<Doc>('GET', path`/entities/${entityId}/documents/${documentId}`);
  }

  createUploadIntent(
    entityId: string,
    input: { filename: string; mime_type: string; size: number; checksum_sha256: string }
  ) {
    return this.request<UploadIntent>('POST', path`/entities/${entityId}/documents/upload-intent`, input);
  }

  /** Step 2 — raw bytes to the signed URL, outside the JSON API. */
  async putUpload(intent: UploadIntent, bytes: Blob | ArrayBuffer): Promise<void> {
    const response = await fetch(intent.upload_url, {
      method: 'PUT',
      headers: intent.headers ?? {},
      body: bytes as BodyInit
    });
    if (!response.ok) throw new ApiError(response.status, 'UPLOAD_PUT_FAILED', 'Upload failed.');
  }

  registerDocuments(
    entityId: string,
    documents: {
      id: string;
      filename: string;
      storage_bucket: string;
      storage_object_key: string;
      checksum_sha256: string;
      captured_at?: string;
      source?: 'camera' | 'photo_library' | 'file';
      answers_card_id?: string | null;
      purpose?: 'prior_records';
    }[]
  ) {
    return this.request<{ documents: Doc[] }>('POST', path`/entities/${entityId}/documents/register`, { documents });
  }

  getParseStatus(entityId: string, ids: string[]) {
    return this.request<{ documents: ParseStatus[] }>(
      'GET',
      path`/entities/${entityId}/documents/parse-status` + `?ids=${encodeURIComponent(ids.join(','))}`
    );
  }

  retryDocument(entityId: string, documentId: string) {
    return this.request<Doc>('POST', path`/entities/${entityId}/documents/${documentId}/retry`);
  }

  resolveDuplicate(entityId: string, documentId: string, action: 'create' | 'replace' | 'cancel') {
    return this.request<Doc>('POST', path`/entities/${entityId}/documents/${documentId}/resolve-duplicate`, { action });
  }

  // ── chat ──────────────────────────────────────────────────────────────
  listChatMessages(entityId: string, limit = 50) {
    return this.request<{ messages: ChatMessage[] }>('GET', path`/entities/${entityId}/chat` + `?limit=${limit}`);
  }

  sendChatMessage(entityId: string, text: string) {
    return this.request<{ message: ChatMessage; reply?: ChatMessage | null }>(
      'POST',
      path`/entities/${entityId}/chat/messages`,
      { text }
    );
  }

  applyChatAction(entityId: string, actionId: string) {
    return this.request<{
      applied: boolean;
      already: string | null;
      action: AppliableChatAction;
      receipt?: Receipt | null;
      card?: QueueCard | null;
    }>('POST', path`/entities/${entityId}/chat/actions/${actionId}/apply`);
  }

  // ── artifact conversation ─────────────────────────────────────────────
  listArtifactMessages(entityId: string, kind: ArtifactKind, artifactId: string, limit = 50) {
    return this.request<ArtifactConversation>(
      'GET',
      path`/entities/${entityId}/artifacts/${kind}/${artifactId}/messages` + `?limit=${limit}`
    );
  }

  sendArtifactMessage(entityId: string, kind: ArtifactKind, artifactId: string, text: string) {
    return this.request<{ message: ChatMessage; reply?: ChatMessage | null }>(
      'POST',
      path`/entities/${entityId}/artifacts/${kind}/${artifactId}/messages`,
      { text }
    );
  }

  // ── mileage ───────────────────────────────────────────────────────────
  recordMileage(
    entityId: string,
    input: { date: string; distance: number; unit: 'km' | 'mi'; purpose: string }
  ) {
    return this.request<{ receipt: Receipt; card?: QueueCard | null }>(
      'POST',
      path`/entities/${entityId}/mileage`,
      input
    );
  }

  // ── activity ──────────────────────────────────────────────────────────
  listActivity(entityId: string, limit = 50) {
    return this.request<{ events: ActivityEvent[]; next_cursor?: string | null }>(
      'GET',
      path`/entities/${entityId}/activity` + `?limit=${limit}`
    );
  }

  // ── notifications ─────────────────────────────────────────────────────
  registerForPush(input: { platform: 'ios' | 'android'; expo_push_token: string; locale?: 'en' | 'fi' }) {
    return this.request<{ id: string }>('POST', '/notifications/registrations', input);
  }

  unregisterFromPush(registrationId: string) {
    return this.request<void>('DELETE', path`/notifications/registrations/${registrationId}`);
  }
}
