import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';

test('optional setup survives login and earlier records stay separate from receipt processing', async (t) => {
  const server = spawn(process.execPath, ['mockserver/server.mjs'], {
    cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: '0', OPENAI_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => {
    server.kill();
    await new Promise(resolve => server.exitCode !== null ? resolve() : server.once('exit', resolve));
  });
  const root = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Server did not start')), 5000);
    server.once('error', reject);
    server.stdout.on('data', chunk => {
      output += chunk;
      const url = output.match(/http:\/\/localhost:\d+/)?.[0];
      if (url) { clearTimeout(timeout); resolve(url); }
    });
  });
  const request = (path, body, token, method = 'POST') => fetch(root + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const login = () => request('/auth/sessions', { email: 'onboarding@preview.test', password: 'finland-preview' }).then(r => r.json());
  const { access_token: token, default_entity_id: entity } = await login();
  const path = `/entities/${entity}/business-setup`;
  const read = async (auth = token) => (await request(path, undefined, auth, 'GET')).json();
  assert.equal((await request(path, undefined, undefined, 'GET')).status, 401);
  assert.equal((await request('/entities/not-mine/business-setup', undefined, token, 'GET')).status, 404);
  assert.equal((await read()).next_step, 'identify_business');
  assert.equal((await request(path + '/lookup', { business_id: '1234567-9' }, token)).status, 400);
  assert.equal((await read()).identity, null);
  assert.equal((await request(path, { type: 'unknown' }, token)).status, 400);
  const deferred = await (await request(path, { type: 'defer' }, token)).json();
  assert.ok(deferred.receipt);
  assert.equal((await read((await login()).access_token)).suggestion_dismissed, true);
  const before = await (await request('/me', undefined, token, 'GET')).json();
  const manual = { type: 'confirm_manual', business_id: '1234567-1', legal_name: 'Metsäpolun Huolto', legal_form: 'sole_trader' };
  const saved = await (await request(path, { ...manual, source: 'prh_ytj', authority_verified: true }, token)).json();
  assert.ok(saved.receipt);
  assert.equal(saved.setup.identity.source, 'owner');
  assert.equal(saved.setup.identity.authority_verified, false);
  assert.equal(saved.setup.suggestion_dismissed, false);
  assert.deepEqual(await (await request('/me', undefined, token, 'GET')).json(), before);
  assert.equal((await request(path, { ...manual, business_id: '7654321-2' }, token)).status, 409);
  assert.equal((await request(path, { ...manual, legal_name: 'Metsäpolun Korjaus' }, token)).status, 200);
  await request(path, { type: 'set_stage', business_stage: 'new' }, token);
  assert.equal((await read()).next_step, 'first_receipt');
  await request(path, { type: 'set_stage', business_stage: 'existing' }, token);
  assert.equal((await read()).next_step, 'prior_records');

  const docPath = `/entities/${entity}/documents`;
  const bytes = 'account,amount\nSynthetic test,0\n';
  const intent = await (await request(docPath + '/upload-intent', {
    filename: 'synthetic-records.csv', mime_type: 'text/csv', size: bytes.length, checksum_sha256: 'test-checksum'
  }, token)).json();
  const registration = { id: 'synthetic-background', filename: 'synthetic-records.csv', mime_type: 'text/csv',
    checksum_sha256: 'test-checksum', storage_bucket: intent.storage_bucket, storage_object_key: intent.storage_object_key,
    purpose: 'prior_records' };
  const register = reg => request(docPath + '/register', { documents: [reg] }, token);
  assert.equal((await register(registration)).status, 400, 'registration requires uploaded bytes');
  assert.equal((await fetch(intent.upload_url, { method: 'PUT', body: bytes })).status, 200);
  assert.equal((await register({ ...registration, storage_object_key: 'not-owned' })).status, 400);
  assert.equal((await register({ ...registration, checksum_sha256: 'wrong' })).status, 400);
  assert.equal((await register({ ...registration, answers_card_id: 'unrelated-question' })).status, 400);
  const response = await register(registration);
  assert.equal(response.status, 200);
  const doc = (await response.json()).documents[0];
  assert.equal(doc.capture_state, 'stored');
  assert.equal(doc.total_amount, null);
  assert.equal(doc.purpose, 'prior_records');
  assert.deepEqual((await (await register(registration)).json()).documents[0], doc, 'retry is idempotent');
  const snapshot = await read();
  assert.equal(snapshot.next_step, 'done');
  assert.deepEqual(snapshot.prior_record_ids, [doc.id]);
  assert.equal(snapshot.capabilities.tax_preparation, 'not_configured');
  assert.equal(snapshot.capabilities.external_actions, 'not_authorized');
  const documents = await (await request(docPath, undefined, token, 'GET')).json();
  assert.equal(documents.documents.length, 1);
  assert.equal(documents.documents[0].capture_state, 'stored');
});
