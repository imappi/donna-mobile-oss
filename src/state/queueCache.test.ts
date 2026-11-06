import assert from 'node:assert/strict';
import test from 'node:test';
import type { DecisionResult, QueueCard, QueueResponse } from '@core/api';
import { applyDecisionResultToQueue } from './queueCache';

const card = (id: string, state: QueueCard['state']): QueueCard =>
  ({
    id,
    entity_id: 'entity-neutral',
    class: 'ask',
    state,
    title: 'What was this for?',
    created_at: '2026-08-27T10:00:00Z',
    source: { kind: 'evidence_request', id },
    blocks_close: true
  }) as QueueCard;

test('a decision result updates the returned card without deriving a new badge count', () => {
  const previous: QueueResponse = {
    generated_at: '2026-08-27T10:00:00Z',
    needs_you_count: 7,
    cards: [card('ask:one', 'open'), card('ask:two', 'open')]
  };
  const result = {
    applied: true,
    already: null,
    card: card('ask:one', 'answered')
  } as DecisionResult;

  const next = applyDecisionResultToQueue(previous, result);

  assert.equal(next?.needs_you_count, 7);
  assert.equal(next?.cards[0]?.state, 'answered');
  assert.equal(next?.cards[1], previous.cards[1]);
});

test('a decision result does not invent queue state before the first backend read', () => {
  const result = { applied: true, card: card('ask:one', 'answered') } as DecisionResult;
  assert.equal(applyDecisionResultToQueue(undefined, result), undefined);
});
