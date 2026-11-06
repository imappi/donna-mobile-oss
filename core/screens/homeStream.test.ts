import assert from 'node:assert/strict';
import test from 'node:test';
import type { Doc, QueueCard } from '../api';
import type { QueuedCapture } from '../capture/queue';
import {
  buildHomeSections,
  buildHomeStream,
  homeFeedState,
  stateForCard,
  stateForDocument,
  stateForQueuedCapture
} from './homeStream';

test('failed or partial reads cannot masquerade as first-run empty Books', () => {
  assert.equal(homeFeedState({ loading: false, failed: true, hasEntries: false }), 'unavailable');
  assert.equal(homeFeedState({ loading: true, failed: false, hasEntries: false }), 'loading');
  assert.equal(homeFeedState({ loading: false, failed: false, hasEntries: false }), 'empty');
  assert.equal(homeFeedState({ loading: false, failed: true, hasEntries: true }), 'ready');
});

const card = ({ id, ...partial }: Partial<QueueCard> & Pick<QueueCard, 'id'>): QueueCard => ({
  id,
  entity_id: 'entity-neutral',
  class: 'ask',
  state: 'open',
  title: id,
  created_at: '2026-09-02T09:00:00Z',
  source: { kind: 'evidence_request', id },
  blocks_close: false,
  ...partial
});

const document = ({ id, ...partial }: Partial<Doc> & Pick<Doc, 'id'>): Doc => ({
  id,
  entity_id: 'entity-neutral',
  filename: `${id}.pdf`,
  capture_state: 'processing',
  uploaded_at: '2026-09-02T08:00:00Z',
  ...partial
});

const capture = ({ id, ...partial }: Partial<QueuedCapture> & Pick<QueuedCapture, 'id'>): QueuedCapture => ({
  id,
  entityId: 'entity-neutral',
  file: { uri: 'file:///neutral.pdf', filename: 'neutral.pdf', mimeType: 'application/pdf', size: 10, source: 'file' },
  capturedAt: '2026-09-02T10:00:00Z',
  answersCardId: null,
  state: 'waiting',
  error: null,
  attempts: 0,
  ...partial
});

test('home state vocabulary renders backend and transport verdicts without accounting inference', () => {
  assert.equal(stateForCard(card({ id: 'ask-open' })), 'needs_input');
  assert.equal(stateForCard(card({ id: 'ask-answered', state: 'answered' })), 'processing');
  assert.equal(stateForCard(card({ id: 'fyi-done', class: 'fyi', state: 'done' })), 'handled');
  assert.equal(stateForCard(card({ id: 'fyi-invalid-open', class: 'fyi', state: 'open' })), 'stalled');

  assert.equal(stateForDocument(document({ id: 'doc-needs', capture_state: 'needs_info' })), 'needs_input');
  assert.equal(stateForDocument(document({ id: 'doc-reading' })), 'processing');
  assert.equal(stateForDocument(document({ id: 'doc-filed', capture_state: 'attached' })), 'handled');
  assert.equal(stateForDocument(document({ id: 'doc-failed', capture_state: 'failed' })), 'stalled');

  assert.equal(stateForQueuedCapture(capture({ id: 'queued' })), 'processing');
  assert.equal(stateForQueuedCapture(capture({ id: 'blocked', state: 'blocked' })), 'stalled');
});

test('explicit document identity suppresses duplicate work while unrelated documents remain', () => {
  const linked = document({ id: 'doc-linked', needs_info_card_id: 'ask-linked' });
  const result = buildHomeStream({
    cards: [card({ id: 'ask-linked', document_id: 'doc-linked' })],
    documents: [linked, document({ id: 'doc-other' })],
    queued: []
  });

  assert.deepEqual(result.map((entry) => entry.key), ['card:ask-linked', 'document:doc-other']);
});

test('the stream is newest business day first, stable on ties, with factual month boundaries', () => {
  const result = buildHomeStream({
    cards: [
      card({ id: 'older', occurred_on: '2026-08-31', created_at: '2026-09-02T12:00:00Z' }),
      card({ id: 'same-day-first', occurred_on: '2026-09-02', created_at: '2026-09-02T09:00:00Z' }),
      card({ id: 'same-day-second', occurred_on: '2026-09-02', created_at: '2026-09-02T09:00:00Z' })
    ],
    documents: [],
    queued: [capture({ id: 'newest', capturedAt: '2026-09-03T07:00:00Z' })]
  });

  assert.deepEqual(result.map((entry) => entry.key), [
    'queued:newest',
    'card:same-day-first',
    'card:same-day-second',
    'card:older'
  ]);
  assert.deepEqual(buildHomeSections(result).map((section) => section.key), ['2026-09', '2026-08']);
});
