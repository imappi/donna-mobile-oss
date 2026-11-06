import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('typed introduction traverses the real server and saves only explicitly confirmed corrections', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'onboarding-route-test-'));
  const runner = join(directory, 'cleanup.mjs');
  const field = (value) => ({ value, state: value ? 'uncertain' : 'missing' });
  const extraction = {
    owner_name: field('Alix'), business_name: field('Blue Fern Repairs'),
    description: field('Polkupyörien korjaus'), operating_area: field(''),
    people_involved: field(''), payment_methods: field(''), spending_categories: field(''),
    profession: field('Pyörämekaanikko'), billing_basis: field('65 euroa / tunti + varaosat'),
    experience: field('Pari vuotta alalla'), business_address: field('')
  };
  await writeFile(runner, `#!${process.execPath}\nimport {writeFileSync} from 'node:fs';
let input=''; process.stdin.on('data', chunk => input+=chunk);
process.stdin.on('end', () => {
  if (input.includes('force-cleanup-failure')) process.exit(1);
  writeFileSync(process.argv[process.argv.indexOf('--output-last-message')+1], ${JSON.stringify(JSON.stringify(extraction))});
});`, { mode: 0o700 });
  const server = spawn(process.execPath, ['mockserver/server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: '0', OPENAI_API_KEY: '', CODEX_CLI: runner },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => {
    server.kill();
    await new Promise((resolve) => server.exitCode !== null ? resolve() : server.once('exit', resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const root = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Mock server did not start')), 5000);
    server.once('error', reject);
    server.stdout.on('data', (chunk) => {
      output += chunk;
      const url = output.match(/http:\/\/localhost:\d+/)?.[0];
      if (url) { clearTimeout(timeout); resolve(url); }
    });
  });
  const request = (path, body, token, method = 'POST') => fetch(root + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const login = await (await request('/auth/sessions', { email: 'onboarding@preview.test', password: 'finland-preview' })).json();
  const { access_token: token, default_entity_id: entity } = login;
  const route = `/entities/${entity}/onboarding/text-draft`;
  assert.equal((await request(route, { text: 'Introduction' })).status, 401);
  assert.equal((await request(route, { text: '' }, token)).status, 400);
  assert.equal((await request(route, { text: 'x'.repeat(12001) }, token)).status, 400);
  assert.equal((await request('/entities/not-mine/onboarding/text-draft', { text: 'Introduction' }, token)).status, 404);
  const before = await (await request('/me', undefined, token, 'GET')).json();
  const response = await request(route, { text: 'Synthetic Finnish introduction' }, token);
  assert.equal(response.status, 200);
  const draft = await response.json();
  assert.equal(draft.processing_mode, 'typed_introduction');
  assert.equal(draft.cleanup_mode, 'model_cleanup');
  assert.equal(draft.raw_transcript, 'Synthetic Finnish introduction');
  assert.equal(draft.transcript, extraction.description.value);
  assert.equal(draft.billing_basis.value, extraction.billing_basis.value);
  assert.deepEqual(await (await request('/me', undefined, token, 'GET')).json(), before);
  const failed = await request(route, { text: 'force-cleanup-failure' }, token);
  assert.equal(failed.status, 422);
  assert.equal((await failed.json()).code, 'VOICE_EXTRACTION_FAILED');
  const profile = Object.fromEntries(Object.entries(draft).filter(([, value]) => value && typeof value === 'object').map(([key, value]) => [key, value.value]));
  Object.assign(profile, { owner_name: 'Alex', people_involved: [], payment_methods: [], spending_categories: [], confirmed_exact_fields: [] });
  profile.billing_basis = '70 euroa / tunti + varaosat';
  const saveRoute = `/entities/${entity}/onboarding/profile`;
  assert.equal((await request(saveRoute, profile, token, 'PUT')).status, 400);
  profile.confirmed_exact_fields = ['owner_name', 'business_name'];
  const saved = await (await request(saveRoute, profile, token, 'PUT')).json();
  assert.equal(saved.principal.display_name, 'Alex');
  assert.equal(saved.entity.display_name, 'Blue Fern Repairs');
  assert.equal(saved.entity.business_profile.billing_basis, '70 euroa / tunti + varaosat');
  assert.equal(saved.entity.business_profile.profession, 'Pyörämekaanikko');
  assert.equal(saved.entity.business_profile.experience, 'Pari vuotta alalla');
  const persisted = await (await request('/me', undefined, token, 'GET')).json();
  assert.ok(JSON.stringify(persisted).includes('70 euroa / tunti + varaosat'));
  assert.ok(saved.receipt);
});
