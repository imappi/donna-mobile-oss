import type { Doc, QueueCard } from '../api';
import type { QueuedCapture } from '../capture/queue';

export type HomeItemState = 'needs_input' | 'processing' | 'handled' | 'stalled';
export const homeFeedState = ({ loading, failed, hasEntries }: {
  loading: boolean; failed: boolean; hasEntries: boolean;
}) => hasEntries ? 'ready' : loading ? 'loading' : failed ? 'unavailable' : 'empty';

export type HomeStreamEntry =
  | {
      key: string;
      kind: 'card';
      card: QueueCard;
      day: string;
      timestamp: string;
      monthKey: string;
      state: HomeItemState;
    }
  | {
      key: string;
      kind: 'document';
      document: Doc;
      day: string;
      timestamp: string;
      monthKey: string;
      state: HomeItemState;
    }
  | {
      key: string;
      kind: 'queued_capture';
      capture: QueuedCapture;
      day: string;
      timestamp: string;
      monthKey: string;
      state: HomeItemState;
    };

export type HomeStreamSection = {
  key: string;
  data: HomeStreamEntry[];
};

const isoDay = (value: string | null | undefined): string => {
  const candidate = String(value ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : '';
};

export const stateForCard = (card: QueueCard): HomeItemState => {
  if (card.state === 'open') {
    return card.class === 'ask' || card.class === 'approval' ? 'needs_input' : 'stalled';
  }
  if (card.state === 'answered' || card.state === 'flagged') return 'processing';
  return 'handled';
};

export const stateForDocument = (document: Doc): HomeItemState => {
  if (document.capture_state === 'needs_info' || document.capture_state === 'duplicate') return 'needs_input';
  if (document.capture_state === 'failed') return 'stalled';
  if (document.capture_state === 'attached' || document.capture_state === 'stored') return 'handled';
  return 'processing';
};

export const stateForQueuedCapture = (capture: QueuedCapture): HomeItemState =>
  capture.state === 'blocked' ? 'stalled' : 'processing';

type IndexedEntry = HomeStreamEntry & { sourceIndex: number };

/**
 * Join persisted mobile reads into one presentation stream. This uses only
 * explicit identities and persisted dates/states: no merchant matching,
 * accounting inference, or locally-derived owner count.
 */
export const buildHomeStream = ({
  cards,
  documents,
  queued
}: {
  cards: QueueCard[];
  documents: Doc[];
  queued: QueuedCapture[];
}): HomeStreamEntry[] => {
  const liveCardIds = new Set(cards.map((card) => card.id));
  const cardDocumentIds = new Set(
    cards.flatMap((card) => (card.document_id ? [card.document_id] : []))
  );
  const entries: IndexedEntry[] = [];

  for (const card of cards) {
    const day = isoDay(card.occurred_on) || isoDay(card.created_at);
    entries.push({
      key: `card:${card.id}`,
      kind: 'card',
      card,
      day,
      timestamp: card.created_at,
      monthKey: day.slice(0, 7) || 'undated',
      state: stateForCard(card),
      sourceIndex: entries.length
    });
  }

  for (const document of documents) {
    const representedByCard =
      cardDocumentIds.has(document.id) ||
      Boolean(document.needs_info_card_id && liveCardIds.has(document.needs_info_card_id));
    if (representedByCard) continue;
    const timestamp = document.captured_at || document.uploaded_at;
    const day = isoDay(document.document_date) || isoDay(timestamp);
    entries.push({
      key: `document:${document.id}`,
      kind: 'document',
      document,
      day,
      timestamp,
      monthKey: day.slice(0, 7) || 'undated',
      state: stateForDocument(document),
      sourceIndex: entries.length
    });
  }

  for (const capture of queued) {
    const day = isoDay(capture.capturedAt);
    entries.push({
      key: `queued:${capture.id}`,
      kind: 'queued_capture',
      capture,
      day,
      timestamp: capture.capturedAt,
      monthKey: day.slice(0, 7) || 'undated',
      state: stateForQueuedCapture(capture),
      sourceIndex: entries.length
    });
  }

  return entries
    .sort((a, b) => {
      const byDay = b.day.localeCompare(a.day);
      if (byDay) return byDay;
      const byTimestamp = b.timestamp.localeCompare(a.timestamp);
      return byTimestamp || a.sourceIndex - b.sourceIndex;
    })
    .map(({ sourceIndex: _sourceIndex, ...entry }) => entry);
};

export const buildHomeSections = (entries: HomeStreamEntry[]): HomeStreamSection[] => {
  const sections: HomeStreamSection[] = [];
  for (const entry of entries) {
    const previous = sections.at(-1);
    if (!previous || previous.key !== entry.monthKey) {
      sections.push({ key: entry.monthKey, data: [entry] });
    } else {
      previous.data.push(entry);
    }
  }
  return sections;
};
