import type { DecisionResult, QueueResponse } from '@core/api';

/**
 * Render the card state returned by the mutation while preserving the last
 * backend-authored badge count. DecisionResult deliberately does not contain
 * a replacement `needs_you_count`, so only the queue refetch may change it.
 */
export const applyDecisionResultToQueue = (
  previous: QueueResponse | undefined,
  result: DecisionResult
): QueueResponse | undefined =>
  previous
    ? {
        ...previous,
        cards: previous.cards.map((card) => (card.id === result.card.id ? result.card : card))
      }
    : previous;
