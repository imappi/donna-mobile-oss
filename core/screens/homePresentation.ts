import type { Doc, QueueCard } from '../api';
import type { QueuedCapture } from '../capture/queue';

const MAX_CONTEXT_WORDS = 3;

const TITLE_FILLER = new Set([
  'a',
  'an',
  'are',
  'as',
  'automatically',
  'be',
  'can',
  'could',
  'did',
  'do',
  'does',
  'donna',
  'filed',
  'for',
  'how',
  'in',
  'is',
  'issue',
  'let',
  'matched',
  'of',
  'on',
  'please',
  'reconciled',
  'send',
  'sent',
  'should',
  'that',
  'the',
  'this',
  'to',
  'under',
  'usual',
  'was',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'would',
  'you',
  'your'
]);

const FILE_FILLER = new Set([
  'bank',
  'bill',
  'document',
  'file',
  'image',
  'inv',
  'invoice',
  'photo',
  'receipt',
  'scan',
  'statement',
  'today',
  'upload',
  'yesterday',
  'partial', 'password', 'blurry', 'crumpled',
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
  'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december'
]);

const words = (value: string): string[] =>
  value
    .trim()
    .replace(/[^\p{L}\p{N}&'’-]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

const firstContextWords = (value: string): string => words(value).slice(0, MAX_CONTEXT_WORDS).join(' ');

const titleCase = (value: string): string =>
  value ? `${value.charAt(0).toLocaleUpperCase()}${value.slice(1).toLocaleLowerCase()}` : value;

const sentenceCase = (value: string): string =>
  value ? `${value.charAt(0).toLocaleUpperCase()}${value.slice(1)}` : value;

/**
 * Compact list copy is deliberately descriptive, not a second explanation.
 * The full backend-authored title still lives on the detail surface.
 */
export const queueCardContext = (card: QueueCard): string => {
  if (card.context_label) return card.context_label;
  const namedParty = (card.counterparty || card.approval?.party_name || '').trim();
  if (namedParty) return namedParty;

  const meaningful = words(card.title).filter((word) => !TITLE_FILLER.has(word.toLocaleLowerCase()));
  return sentenceCase(
    meaningful.slice(0, MAX_CONTEXT_WORDS).join(' ') || firstContextWords(card.title)
  );
};

/**
 * A filename can provide context without becoming UI copy. Strip transport,
 * file-family and date/version noise, then expose at most three human words.
 */
export const filenameContext = (filename: string, fallback: string): string => {
  const basename = filename.split(/[\\/]/).at(-1) ?? '';
  const withoutExtension = basename.replace(/\.[^.]+$/, '');
  const meaningful = withoutExtension
    .split(/[\s._-]+/)
    .filter(Boolean)
    .filter((word) => !FILE_FILLER.has(word.toLocaleLowerCase()))
    .filter((word) => !/^\d+$/.test(word))
    .filter((word) => !/^\d{1,2}(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)$/i.test(word))
    .slice(0, MAX_CONTEXT_WORDS)
    .map(titleCase);

  return meaningful.join(' ') || fallback;
};

export const documentContext = (document: Doc, fallback: string): string => {
  if (document.context_label) return document.context_label;
  const namedParty = (document.counterparty || '').trim();
  return namedParty || filenameContext(document.filename, fallback);
};

export const queuedCaptureContext = (capture: QueuedCapture, fallback: string): string =>
  filenameContext(capture.file.filename, fallback);
