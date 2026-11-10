import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';

// DEMO_LOCALE=fi must give a Finnish demo everywhere the backend speaks:
// activity rows, close-status labels and chat. Only text changes; every id,
// count, link and field stays as the English response has it, so the
// Finnish mock answers with the same contract shapes as the English one.

const TEXT = new Set(['title', 'body', 'label', 'text', 'headline', 'summary']);
const CLOCK = new Set(['at', 'as_of', 'applied_at']);

const start = async (t, locale) => {
  const server = spawn(process.execPath, ['mockserver/server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: '0', DEMO_LOCALE: locale, DEMO_REFINEMENT: '', OPENAI_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => {
    server.kill();
    await new Promise(resolve => server.exitCode !== null ? resolve() : server.once('exit', resolve));
  });
  const root = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Server did not start')), 5000);
    server.once('error', reject);
    server.stdout.on('data', chunk => {
      output += chunk;
      const url = output.match(/http:\/\/localhost:\d+/)?.[0];
      if (url) { clearTimeout(timer); resolve(url); }
    });
  });
  const call = async (method, path, token, body) => {
    const response = await fetch(root + path, { method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  const request = async (path, token, body) => {
    const response = await fetch(root + path, { method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.equal(response.status, 200, path);
    return response.json();
  };
  const session = await request('/auth/sessions', null, { email: 'demo@example.test', password: 'receipts' });
  return { call, request, token: session.access_token, entities: session.entities.map(entity => entity.id) };
};

/** Same shape and facts; every human-readable string translated. */
const compare = (en, fi, path, problems) => {
  if (Array.isArray(en)) {
    if (!Array.isArray(fi) || fi.length !== en.length) return problems.push(`${path}: length`);
    en.forEach((item, index) => compare(item, fi[index], `${path}.${index}`, problems));
    return;
  }
  if (en && typeof en === 'object') {
    if (!fi || typeof fi !== 'object') return problems.push(`${path}: shape`);
    const keys = Object.keys(en).sort().join();
    if (Object.keys(fi).sort().join() !== keys) return problems.push(`${path}: keys ${keys} vs ${Object.keys(fi).sort()}`);
    for (const key of Object.keys(en)) compare(en[key], fi[key], `${path}.${key}`, problems);
    return;
  }
  const key = path.split('.').pop();
  if (key === 'id' && /^(msg|act)-[0-9a-f]+$/.test(en)) return en.split('-')[0] === String(fi).split('-')[0] || problems.push(`${path}: id`);
  if (CLOCK.has(key)) return typeof en === typeof fi || problems.push(`${path}: clock`);
  if (TEXT.has(key) && typeof en === 'string') return en !== fi || problems.push(`${path}: still English “${fi}”`);
  if (en !== fi) problems.push(`${path}: ${JSON.stringify(en)} became ${JSON.stringify(fi)}`);
};

test('a Finnish demo reads activity, status and chat in Finnish with unchanged facts', async (t) => {
  const [en, fi] = await Promise.all([start(t, 'en'), start(t, 'fi')]);
  assert.deepEqual(fi.entities, en.entities);
  const problems = [];
  for (const entity of en.entities) {
    for (const read of ['activity', 'status', 'chat']) {
      const path = `/entities/${entity}/${read}`;
      compare(await en.request(path, en.token), await fi.request(path, fi.token), `${entity}/${read}`, problems);
    }
    // Live replies and the typed actions they carry (mileage, generic, tax).
    for (const text of ['Drove 12 km to the timber yard', 'Kiitos!', 'ALV / VAT?']) {
      const path = `/entities/${entity}/chat/messages`;
      const [a, b] = [await en.request(path, en.token, { text }), await fi.request(path, fi.token, { text })];
      compare(a.reply, b.reply, `${entity}/chat “${text}”`, problems);
    }
  }
  assert.deepEqual(problems, []);
});

test('Finnish status keeps the backend’s period facts and labels months in Finnish', async (t) => {
  const fi = await start(t, 'fi');
  const status = await fi.request(`/entities/${fi.entities[0]}/status`, fi.token);
  const month = (iso) => {
    const text = new Date(`${iso}T12:00:00`).toLocaleDateString('fi-FI', { month: 'long' });
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  assert.deepEqual(status.periods.map(period => period.label), status.periods.map(period => month(period.period_start)));
  assert.ok(status.periods[0].blockers.every(blocker => !/\b(the|you|is)\b/i.test(blocker.label)));
});

/** Every human-readable string the owner sees after acting: receipts, checks, notices, errors. */
const SPOKEN = new Set(['summary', 'detail', 'error', 'title', 'description', 'question', 'label', 'result_label']);
const ENGLISH = /\b(the|your|you|is|was|in|no|only|such|for|it|and|are|required|logged|declined|flagged)\b/i;
const OWNER_WORDS = ['Not this week', 'Timber yard', 'Drove 12 km to the timber yard'];
const spoken = (en, fi, path, problems) => {
  if (en && typeof en === 'object') {
    for (const key of Object.keys(en)) spoken(en[key], fi?.[key], `${path}.${key}`, problems);
    return;
  }
  if (!SPOKEN.has(path.split('.').pop()) || typeof en !== 'string') return;
  // The owner's own words (a note, a journey purpose) stay as typed.
  const own = OWNER_WORDS.reduce((text, words) => text.replaceAll(words, ''), String(fi));
  if (fi === en || ENGLISH.test(own)) problems.push(`${path}: “${fi}”`);
};

test('a Finnish demo answers decisions, mileage and errors in Finnish', async (t) => {
  const [en, fi] = await Promise.all([start(t, 'en'), start(t, 'fi')]);
  const entity = en.entities[0];
  const card = (id) => `/entities/${entity}/queue/cards/${encodeURIComponent(id)}/decision`;
  const steps = [
    ['decline', 'POST', card('outbound_action:act-reminder-harbour'), { type: 'reject', note: 'Not this week' }],
    ['this was wrong', 'POST', card('outbound_action:fyi-cloudbill'), { type: 'veto_flag' }],
    ['mileage', 'POST', `/entities/${entity}/mileage`, { date: '2026-11-03', distance: 12.5, unit: 'km', purpose: 'Timber yard' }],
    ['wrong decision', 'POST', card('outbound_action:act-issue-kestrel'), { type: 'veto_flag' }],
    ['missing card', 'GET', `/entities/${entity}/queue/cards/nope`],
    ['empty chat', 'POST', `/entities/${entity}/chat/messages`, { text: ' ' }],
    ['incomplete mileage', 'POST', `/entities/${entity}/mileage`, { distance: 3 }],
    ['missing document', 'POST', `/entities/${entity}/documents/nope/retry`, {}],
    ['foreign registration', 'DELETE', '/notifications/registrations/reg-nope'],
    ['unknown route', 'GET', '/nowhere'],
    ['bad sign-in', 'POST', '/auth/sessions', { email: 'nobody@example.test', password: 'x' }]
  ];
  const problems = [];
  for (const [name, method, path, body] of steps) {
    const [a, b] = [await en.call(method, path, en.token, body), await fi.call(method, path, fi.token, body)];
    assert.equal(b.status, a.status, name);
    spoken(a.body, b.body, name, problems);
  }
  // The mileage a chat message proposes, applied from the chat.
  for (const client of [en, fi]) {
    const { reply } = await client.request(`/entities/${entity}/chat/messages`, client.token, { text: 'Drove 12 km to the timber yard' });
    client.applied = await client.request(`/entities/${entity}/chat/actions/${reply.actions[0].id}/apply`, client.token, {});
  }
  spoken(en.applied, fi.applied, 'chat mileage', problems);
  assert.deepEqual(problems, []);
});

test('every error message the mock writes has its own Finnish line', async () => {
  const { readFileSync } = await import('node:fs');
  const { errorMessages, localizeError } = await import('./finnishFixtures.mjs');
  const known = new Set(errorMessages());
  const missing = [];
  for (const file of ['server.mjs', 'onboardingVoice.mjs']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    const written = [
      ...source.matchAll(/error: '([^']+)'/g),
      ...source.matchAll(/VoiceOnboardingError\(\s*\d+,\s*'\w+',\s*(?:cause instanceof Error \? cause\.message : )?'([^']+)'/g),
      ...source.matchAll(/error: \w+ \? '([^']+)' : '([^']+)'/g)
    ].flatMap(match => match.slice(1)).filter(Boolean);
    for (const message of written) if (!known.has(message)) missing.push(`${file}: ${message}`);
  }
  assert.deepEqual(missing, []);
  assert.equal(localizeError("Unknown decision type 'shrug'.", 'fi'), 'Tuntematon päätös: shrug.');
  assert.equal(localizeError('No such card.', 'en'), 'No such card.');
});
