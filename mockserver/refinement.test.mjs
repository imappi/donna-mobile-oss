import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { buildCards, buildDocuments } from './fixtures.mjs';
import { buildFinancialReview, enrichRefinementBook, reviewPeriod } from './refinementFixtures.mjs';

const sampleBook = () => ({ cards: buildCards(), documents: buildDocuments(),
  artifactThreads: new Map(), artifactReceipts: new Map(), chatActions: new Map() });

test('presentation enrichment preserves identity, dates, balances and decision authority', () => {
  const book = sampleBook();
  const before = structuredClone(book.cards);
  enrichRefinementBook(book);
  for (const [index, card] of book.cards.entries()) {
    for (const key of ['id', 'entity_id', 'class', 'state', 'amount', 'occurred_on', 'created_at', 'approval'])
      assert.deepEqual(card[key], before[index][key]);
  }
  const invoice = book.cards.find(card => card.presentation?.invoice);
  assert.equal(invoice.presentation.invoice.lines.reduce((sum, line) => sum + line.amount, 0), invoice.amount);
  assert.equal(invoice.presentation.invoice.total, invoice.amount);
  const evidence = book.chat.find(message => message.attachment).attachment;
  assert.ok(book.documents.some(document => document.id === evidence.document_id));
});

test('financial previews are explicit sample read models, never a fallback for real books or arbitrary dates', () => {
  const book = sampleBook();
  assert.equal(buildFinancialReview(book, 'taxes').source, 'not_configured');
  enrichRefinementBook(book);
  for (const kind of ['taxes', 'month']) {
    const model = buildFinancialReview(book, kind);
    assert.equal(model.source, 'sample');
    assert.ok(model.blocks.length);
    assert.ok(model.footnote);
    assert.equal(buildFinancialReview(book, kind, '1998-01').source, 'not_configured');
    assert.ok(model.blocks.every(block => !block.action || ['chat', 'queue_card'].includes(block.action.kind)));
  }
  assert.match(reviewPeriod(), /^\d{4}-\d{2}$/);
});

test('sample UI requests preserve authority, entity scoping, idempotency and audit history end to end', async t => {
  const server = spawn(process.execPath, ['mockserver/server.mjs'], {
    cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: '0', DEMO_LOCALE: 'fi', DEMO_REFINEMENT: 'true', OPENAI_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => { server.kill(); await new Promise(resolve => server.exitCode !== null ? resolve() : server.once('exit', resolve)); });
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
  const request = async (path, token, body, expected = 200) => {
    const response = await fetch(root + path, { method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.equal(response.status, expected, path);
    return response.json();
  };
  const session = await request('/auth/sessions', null, { email: 'demo@example.test', password: 'receipts' });
  const token = session.access_token;
  const path = '/entities/' + session.default_entity_id;
  await request(path + '/reviews/taxes', null, undefined, 401);
  await request(path + '/reviews/month?period=2026-13', token, undefined, 400);
  const before = await request(path + '/queue', token);
  const chat = await request(path + '/chat', token);
  assert.equal((await request(path + '/reviews/taxes', token)).source, 'sample');
  assert.equal((await request(path + '/status', token)).review_navigation, true);
  assert.equal((await request(path + '/reviews/month?period=1998-01', token)).source, 'not_configured');
  const card = before.cards.find(card => card.id === 'outbound_action:act-issue-kestrel');
  const artifactPath = path + '/artifacts/queue_card/' + encodeURIComponent(card.id) + '/messages';
  await request(artifactPath, token, { text: 'Please confirm what is included.' });
  assert.equal((await request(path + '/queue', token)).needs_you_count, before.needs_you_count, 'comment never approves');
  const action = chat.messages.flatMap(message => message.actions ?? []).find(action => action.kind === 'approve_card');
  const applied = await request(path + '/chat/actions/' + action.id + '/apply', token, {});
  assert.equal(applied.applied, true);
  assert.equal(applied.action.result_label, 'lasku lähetetty');
  assert.equal(applied.card.state, 'approved');
  assert.equal(applied.card.occurred_on, card.occurred_on);
  assert.ok(applied.receipt.at);
  const repeat = await request(path + '/chat/actions/' + action.id + '/apply', token, {});
  assert.equal(repeat.applied, false);
  assert.equal((await request(path + '/queue', token)).needs_you_count, before.needs_you_count - 1);
  const history = await request(artifactPath, token);
  assert.equal(history.receipts.length, 1);
  assert.deepEqual(history.receipts[0].audit_event_ids, applied.receipt.audit_event_ids);
  const month = await request(path + '/reviews/month', token);
  assert.ok(month.blocks.find(block => block.id === 'invoices').rows.every(row => row.card_id !== card.id));
  const onboarding = await request('/auth/sessions', null, { email: 'onboarding@preview.test', password: 'finland-preview' });
  const onboardPath = '/entities/' + onboarding.default_entity_id;
  assert.equal((await request(onboardPath + '/reviews/taxes', onboarding.access_token)).source, 'not_configured');
  assert.equal((await request(onboardPath + '/queue', onboarding.access_token)).cards.length, 0);
  await request(path + '/reviews/taxes', onboarding.access_token, undefined, 404);
});
