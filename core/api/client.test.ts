import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiClient, ApiError, type TokenPair, type TokenStore } from './client';

const memoryTokens = (initial: TokenPair | null) => {
  let current = initial;
  const store: TokenStore = {
    get: async () => current,
    set: async (tokens) => {
      current = tokens;
    },
    clear: async () => {
      current = null;
    }
  };
  return { store, current: () => current };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

test('a 401 refreshes once, persists the new tokens, and retries with the new bearer', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const tokens = memoryTokens({ access_token: 'old-access', refresh_token: 'old-refresh' });
  const authorizations: string[] = [];
  let refreshes = 0;

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const authorization = new Headers(init?.headers).get('Authorization') ?? '';
    if (url.endsWith('/auth/sessions/refresh')) {
      refreshes += 1;
      assert.equal(init?.body, JSON.stringify({ refresh_token: 'old-refresh' }));
      return json({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        principal: { id: 'owner-neutral', email: 'owner@example.test' },
        entities: [],
        default_entity_id: 'entity-neutral'
      });
    }
    authorizations.push(authorization);
    if (authorization === 'Bearer old-access') {
      return json({ error: 'Expired', code: 'UNAUTHORIZED' }, 401);
    }
    return json({
      principal: { id: 'owner-neutral', email: 'owner@example.test' },
      entities: [],
      default_entity_id: 'entity-neutral'
    });
  };

  const client = new ApiClient('https://mobile.example.test/', tokens.store);
  const me = await client.getMe();

  assert.equal(me.default_entity_id, 'entity-neutral');
  assert.equal(refreshes, 1);
  assert.deepEqual(authorizations, ['Bearer old-access', 'Bearer new-access']);
  assert.deepEqual(tokens.current(), {
    access_token: 'new-access',
    refresh_token: 'new-refresh'
  });
});

test('concurrent 401 responses share one refresh request', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const tokens = memoryTokens({ access_token: 'old-access', refresh_token: 'old-refresh' });
  let refreshes = 0;

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const authorization = new Headers(init?.headers).get('Authorization');
    if (url.endsWith('/auth/sessions/refresh')) {
      refreshes += 1;
      await Promise.resolve();
      return json({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        principal: { id: 'owner-neutral' },
        entities: [],
        default_entity_id: 'entity-neutral'
      });
    }
    if (authorization === 'Bearer old-access') {
      return json({ error: 'Expired', code: 'UNAUTHORIZED' }, 401);
    }
    return json({ generated_at: '2026-08-27T10:00:00Z', needs_you_count: 0, cards: [] });
  };

  const client = new ApiClient('https://mobile.example.test', tokens.store);
  await Promise.all([client.getQueue('entity-neutral'), client.getQueue('entity-neutral')]);

  assert.equal(refreshes, 1);
});

test('typed backend errors survive the client boundary', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const tokens = memoryTokens(null);
  globalThis.fetch = async () =>
    json({ error: 'That decision is not valid for this card.', code: 'DECISION_INVALID' }, 409);

  const client = new ApiClient('https://mobile.example.test', tokens.store);

  await assert.rejects(client.getQueueCard('entity-neutral', 'ask:neutral'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 409);
    assert.equal(error.code, 'DECISION_INVALID');
    assert.equal(error.message, 'That decision is not valid for this card.');
    return true;
  });
});

test('artifact conversation stays bound to the encoded item identity', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const tokens = memoryTokens({ access_token: 'access', refresh_token: 'refresh' });
  const calls: Array<{ url: string; method: string; body: string | null }> = [];

  globalThis.fetch = async (input, init) => {
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? init.body : null
    });
    if (init?.method === 'POST') {
      return json({
        message: { id: 'owner-turn', author: 'owner', text: 'Why?', at: '2026-09-02T20:00:00Z' },
        reply: null
      });
    }
    return json({
      artifact_kind: 'queue_card',
      artifact_id: 'outbound_action:neutral item',
      messages: [],
      receipts: []
    });
  };

  const client = new ApiClient('https://mobile.example.test', tokens.store);
  await client.listArtifactMessages('entity-neutral', 'queue_card', 'outbound_action:neutral item');
  await client.sendArtifactMessage('entity-neutral', 'queue_card', 'outbound_action:neutral item', 'Why?');

  assert.deepEqual(calls, [
    {
      url:
        'https://mobile.example.test/entities/entity-neutral/artifacts/queue_card/outbound_action%3Aneutral%20item/messages?limit=50',
      method: 'GET',
      body: null
    },
    {
      url:
        'https://mobile.example.test/entities/entity-neutral/artifacts/queue_card/outbound_action%3Aneutral%20item/messages',
      method: 'POST',
      body: JSON.stringify({ text: 'Why?' })
    }
  ]);
});

test('voice onboarding uploads completed audio and profile confirmation is a separate write', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const tokens = memoryTokens({ access_token: 'access', refresh_token: 'refresh' });
  const calls: Array<{ url: string; method: string; headers: Headers; body: BodyInit | null | undefined }> = [];

  globalThis.fetch = async (input, init) => {
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      body: init?.body
    });
    if (init?.method === 'PUT') {
      return json({
        principal: { id: 'owner-neutral', display_name: 'Alex' },
        entity: { id: 'entity-neutral', display_name: 'Blue Fern Repairs', currency: 'EUR', country: 'FI' },
        receipt: { summary: 'Confirmed', changes: [], audit_event_ids: [], actor: { type: 'owner', terminal: 'mobile' } }
      });
    }
    return json({
      processing_mode: 'live_transcription',
      transcript: 'A neutral transcript.',
      owner_name: { value: 'Alex', state: 'confident', requires_exact_confirmation: true },
      business_name: { value: 'Blue Fern Repairs', state: 'confident', requires_exact_confirmation: true },
      description: { value: '', state: 'missing', requires_exact_confirmation: false },
      operating_area: { value: '', state: 'missing', requires_exact_confirmation: false },
      people_involved: { value: '', state: 'missing', requires_exact_confirmation: false },
      payment_methods: { value: '', state: 'missing', requires_exact_confirmation: false },
      spending_categories: { value: '', state: 'missing', requires_exact_confirmation: false }
    });
  };

  const client = new ApiClient('https://mobile.example.test', tokens.store);
  const audio = new Blob(['finished-audio'], { type: 'audio/mp4' });
  await client.createVoiceOnboardingDraft(
    'entity-neutral',
    audio,
    'introduction.m4a',
    'audio/mp4',
    12.5
  );
  await client.confirmOnboardingProfile('entity-neutral', {
    owner_name: 'Alex',
    business_name: 'Blue Fern Repairs',
    description: '',
    operating_area: '',
    people_involved: [],
    payment_methods: [],
    spending_categories: [],
    confirmed_exact_fields: ['owner_name', 'business_name']
  });

  assert.equal(calls[0].url, 'https://mobile.example.test/entities/entity-neutral/onboarding/voice-draft');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].headers.get('Content-Type'), 'audio/mp4');
  assert.equal(calls[0].headers.get('X-Audio-Filename'), 'introduction.m4a');
  assert.equal(calls[0].headers.get('X-Audio-Duration-Seconds'), '12.5');
  assert.equal(calls[0].body, audio);
  assert.equal(calls[1].url, 'https://mobile.example.test/entities/entity-neutral/onboarding/profile');
  assert.equal(calls[1].method, 'PUT');
  assert.match(String(calls[1].body), /"confirmed_exact_fields":\["owner_name","business_name"\]/);
});

test('unregisterFromPush URL-encodes the registration id into one path segment', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const urls: string[] = [];
  globalThis.fetch = async (input, init) => {
    urls.push(`${init?.method} ${String(input)}`);
    return new Response(null, { status: 204 });
  };
  const api = new ApiClient('https://api.example.test', memoryTokens({ access_token: 'a', refresh_token: 'r' }).store);
  await api.unregisterFromPush('reg/1 ?x#y');
  assert.deepEqual(urls, ['DELETE https://api.example.test/notifications/registrations/reg%2F1%20%3Fx%23y']);
});

test('every method puts caller-supplied ids into the path as single encoded segments', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  // A slash, a dot-dot, a space and a percent: each one changes the route
  // (or fails to parse) if it reaches the path unencoded.
  const HOSTILE = 'id/../sub %x';
  const ENCODED = encodeURIComponent(HOSTILE);
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return json({ access_token: 'a', refresh_token: 'r', documents: [] });
  };
  const api = new ApiClient('https://api.example.test', memoryTokens({ access_token: 'a', refresh_token: 'r' }).store);
  // Methods whose arguments are not ids get typed arguments of their own.
  const argsFor: Record<string, unknown[]> = {
    getParseStatus: [HOSTILE, [HOSTILE]],
    listDocuments: [HOSTILE, 30],
    listChatMessages: [HOSTILE, 50],
    listActivity: [HOSTILE, 50],
    listArtifactMessages: [HOSTILE, HOSTILE, HOSTILE, 50],
    getFinancialReview: [HOSTILE, 'month']
  };
  // Not part of the JSON API: internals, and the signed upload URL the backend hands out whole.
  const skip = new Set(['constructor', 'request', 'requestAudio', 'refreshOnce', 'putUpload']);
  const methods = Object.getOwnPropertyNames(ApiClient.prototype).filter((name) => !skip.has(name));
  assert.ok(methods.length > 25, 'the client surface was enumerated');
  const callable = api as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
  const problems: string[] = [];
  for (const name of methods) {
    urls.length = 0;
    await callable[name](...(argsFor[name] ?? [HOSTILE, HOSTILE, HOSTILE, HOSTILE, HOSTILE, HOSTILE]));
    for (const url of urls) {
      const path = url.slice('https://api.example.test'.length).split('?')[0];
      if (path.includes(HOSTILE) || path.includes('id/') || path.includes(' ')) {
        problems.push(`${name}: ${path}`);
      }
      if (/\/entities\//.test(path) && !path.startsWith(`/entities/${ENCODED}/`)) {
        problems.push(`${name}: entity id not encoded in ${path}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});
