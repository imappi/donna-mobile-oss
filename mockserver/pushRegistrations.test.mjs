import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { createPushRegistrations } from './pushRegistrations.mjs';

test('registering the same token again returns the same id and writes nothing', () => {
  let n = 0;
  const regs = createPushRegistrations(() => `reg-${++n}`);
  const body = { platform: 'ios', expo_push_token: 'ExponentPushToken[a]', locale: 'fi' };
  const first = regs.upsert('p1', body);
  const writes = regs.writes;
  assert.equal(regs.upsert('p1', { ...body }), first);
  assert.equal(regs.writes, writes);
  assert.equal(regs.size, 1);

  // A locale change updates the same registration in place.
  assert.equal(regs.upsert('p1', { ...body, locale: 'en' }), first);
  assert.equal(regs.get(first).locale, 'en');
  assert.equal(regs.size, 1);

  // Another principal on the same device, or a new token, is a new registration.
  assert.notEqual(regs.upsert('p2', body), first);
  assert.notEqual(regs.upsert('p1', { ...body, expo_push_token: 'ExponentPushToken[b]' }), first);
  assert.equal(regs.size, 3);

  // Only the owning principal can delete.
  assert.equal(regs.remove('p2', first), false);
  assert.equal(regs.remove('p1', first), true);
  assert.equal(regs.get(first), null);
});

test('mock HTTP: repeat registration on sign-in answers the same id; DELETE decodes the id and refuses a foreign one', async (t) => {
  const server = spawn(process.execPath, ['mockserver/server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: '0', OPENAI_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => {
    server.kill();
    await new Promise((resolve) => (server.exitCode !== null ? resolve() : server.once('exit', resolve)));
  });
  const root = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(Error('Startup timeout')), 5000);
    server.once('error', reject);
    server.stdout.on('data', (chunk) => {
      output += chunk;
      const url = output.match(/http:\/\/localhost:\d+/)?.[0];
      if (url) {
        clearTimeout(timer);
        resolve(url);
      }
    });
  });
  const call = async (method, path, token, body) => {
    const response = await fetch(root + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  };
  const signIn = async () =>
    (await call('POST', '/auth/sessions', null, { email: 'demo@example.test', password: 'receipts' })).body
      .access_token;
  const reg = { platform: 'android', expo_push_token: 'ExponentPushToken[device-1]', locale: 'en' };

  const first = await call('POST', '/notifications/registrations', await signIn(), reg);
  assert.equal(first.status, 201);
  const again = await call('POST', '/notifications/registrations', await signIn(), reg);
  assert.equal(again.status, 201);
  assert.equal(again.body.id, first.body.id);

  // Someone else's registration (or one that does not exist) is a 404, as on
  // the real server, and stays in place.
  const stranger = (await call('POST', '/auth/sessions', null, { email: 'onboarding@preview.test', password: 'finland-preview' }))
    .body.access_token;
  const foreign = await call('DELETE', `/notifications/registrations/${encodeURIComponent(first.body.id)}`, stranger);
  assert.equal(foreign.status, 404);
  assert.equal(foreign.body.code, 'REGISTRATION_NOT_FOUND');
  assert.equal((await call('DELETE', '/notifications/registrations/reg-missing', stranger)).status, 404);
  assert.equal((await call('POST', '/notifications/registrations', await signIn(), reg)).body.id, first.body.id);

  const token = await signIn();
  assert.equal(
    (await call('DELETE', `/notifications/registrations/${encodeURIComponent(first.body.id)}`, token)).status,
    204
  );
  const fresh = await call('POST', '/notifications/registrations', token, reg);
  assert.notEqual(fresh.body.id, first.body.id);
});
