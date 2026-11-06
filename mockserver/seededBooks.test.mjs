import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { buildCards, buildDocuments, buildSecondBook, buildOnboardingBook, buildStatus, monthDay, isoDate } from './fixtures.mjs';
import { localizeSeedCards, localizeSeedDocuments } from './finnishFixtures.mjs';

test('calendar-anchored seed history covers two prior months at month and year boundaries', () => {
  assert.equal(isoDate(monthDay(-1, 31, new Date(2026, 2, 31))), '2026-02-28');
  assert.equal(isoDate(monthDay(-2, 22, new Date(2026, 0, 1))), '2025-11-22');
  const history = buildDocuments().filter(document => document.id.startsWith('doc-history-'));
  assert.equal(history.length, 6);
  assert.equal(new Set(history.map(document => document.document_date.slice(0, 7))).size, 2);
  assert.ok(history.every(document => document.capture_state === 'attached'));
  assert.deepEqual(buildOnboardingBook().documents, []);
  assert.deepEqual(buildOnboardingBook().cards, []);
});

test('linked seed cards reference the same document facts rather than duplicating a receipt', () => {
  const second = buildSecondBook();
  const documents = [...buildDocuments(), ...second.documents];
  const linked = [...buildCards(), ...second.cards].filter(card => card.document_id);
  assert.ok(linked.length >= 6);
  for (const card of linked) {
    const document = documents.find(item => item.id === card.document_id);
    assert.ok(document, card.id);
    assert.equal(card.amount, document.total_amount, card.id);
    assert.equal(card.occurred_on, document.document_date, card.id);
  }
});

test('prior-period status follows its persisted blocker and clears when answered', () => {
  const cards = buildCards();
  const invoice = cards.find(card => card.id === 'client_evidence_request:ask-inv2041');
  const before = buildStatus(10, cards).periods[1];
  assert.equal(before.state, 'blocked');
  assert.ok(before.blockers.some(blocker => blocker.card_ids.includes(invoice.id)));
  for (const card of cards) if ((card.occurred_on || card.created_at).slice(0, 7) === before.period_start.slice(0, 7)) card.state = 'answered';
  const after = buildStatus(5, cards).periods[1];
  assert.equal(after.state, 'ready');
  assert.equal(after.blockers.length, 0);
});

test('Finnish fixture copy preserves all business facts, identifiers and decision choices', () => {
  const original = [...buildCards(), ...buildSecondBook().cards];
  const localized = localizeSeedCards(original, 'fi');
  for (const [index, card] of localized.entries()) {
    const source = original[index];
    for (const key of ['id', 'entity_id', 'class', 'state', 'amount', 'currency', 'counterparty', 'occurred_on', 'created_at', 'document_id', 'blocks_close']) {
      assert.deepEqual(card[key], source[key], key);
    }
    assert.deepEqual(card.ask?.choices?.map(choice => choice.id), source.ask?.choices?.map(choice => choice.id));
    assert.notEqual(card.title, source.title);
  }
  assert.equal(localizeSeedCards(original, 'en'), original);
  const docs = buildDocuments();
  assert.equal(localizeSeedDocuments(docs, 'fi').length, docs.length);
});

test('sample answer updates the real queue and badge without moving its business date or touching onboarding', async (t) => {
  const server = spawn(process.execPath, ['mockserver/server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: '0', DEMO_LOCALE: 'fi', OPENAI_API_KEY: '' }, stdio: ['ignore', 'pipe', 'pipe']
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
  const request = async (path, token, body) => {
    const response = await fetch(root + path, { method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.equal(response.status, 200);
    return response.json();
  };
  const session = await request('/auth/sessions', null, { email: 'demo@example.test', password: 'receipts' });
  const token = session.access_token;
  const path = `/entities/${session.default_entity_id}/queue`;
  const before = await request(path, token);
  const card = before.cards.find(card => card.id === 'client_evidence_request:ask-cafe');
  assert.equal(card.ask.choices[0].label, 'Työateria');
  const result = await request(path + '/cards/' + encodeURIComponent(card.id) + '/decision', token,
    { type: 'answer', answer: { choice_id: 'business_meal' } });
  assert.equal(result.applied, true);
  assert.equal(result.card.state, 'answered');
  assert.equal(result.card.occurred_on, card.occurred_on);
  assert.equal(result.card.created_at, card.created_at);
  assert.ok(result.receipt);
  assert.equal((await request(path, token)).needs_you_count, before.needs_you_count - 1);
  const invalid = await fetch(root + path + '/cards/' + encodeURIComponent('reconciliation_batch:fyi-july-recon') + '/decision',
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'approve' }) });
  assert.equal(invalid.status, 409, 'already-handled FYIs are not approvals');
  const authority = await request(path + '/cards/' + encodeURIComponent('authority_grant:grant-receipt-chase') + '/decision', token,
    { type: 'approve' });
  assert.equal(authority.applied, true);
  const updated = await request(path, token);
  const authorityResult = updated.cards.find(item => item.title === 'Jatkuva valtuutus tallennettu');
  assert.equal(authorityResult?.class, 'fyi', 'recording authority does not claim that a reminder was sent');
  assert.equal(updated.needs_you_count, before.needs_you_count - 2);
  const onboarding = await request('/auth/sessions', null, { email: 'onboarding@preview.test', password: 'finland-preview' });
  assert.equal((await request(`/entities/${onboarding.default_entity_id}/queue`, onboarding.access_token)).cards.length, 0);
});
