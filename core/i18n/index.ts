import { en, type Dictionary } from './en';
import { fi } from './fi';

/**
 * Tiny i18n: typed lookup with `en` fallback and {token} interpolation.
 * No library — v1 needs two locales and Intl does the number/date work.
 * Locale is module-level state set once at startup (and by the settings
 * screen later); screens re-render via their own state, not via i18n.
 */
export type Locale = 'en' | 'fi';

let activeLocale: Locale = 'en';
let activeBrand = 'Donna';
/** Every locale is a complete `Dictionary`; the `en` fallback in t() stays for keys a future locale has not typed yet. */
export const dictionaries: Record<Locale, Dictionary> = { en, fi };

export const setLocale = (locale: Locale) => {
  activeLocale = locale;
};
export const getLocale = (): Locale => activeLocale;
/** The shell sets this once at startup; `{brand}` interpolates everywhere. */
export const setBrandName = (name: string) => {
  activeBrand = name;
};
export const getBrandName = (): string => activeBrand;

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type StringKey = Leaves<Dictionary>;

const lookup = (dict: unknown, path: string): string | undefined => {
  let node: unknown = dict;
  for (const part of path.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
};

export const t = (key: StringKey, tokens?: Record<string, string | number>): string => {
  const raw = lookup(dictionaries[activeLocale], key) ?? lookup(en, key) ?? key;
  const merged: Record<string, string | number> = { brand: activeBrand, ...tokens };
  return raw.replace(/\{(\w+)\}/g, (m, name) => (merged[name] != null ? String(merged[name]) : m));
};

/**
 * Money formatting by locale via Intl. `amount` is a signed decimal number;
 * the contract serializes amounts as JSON numbers in major units.
 * The minus sign renders as U+2212 per the design language.
 */
export const formatMoney = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat(activeLocale === 'fi' ? 'fi-FI' : 'en-GB', {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol'
    })
      .format(amount)
      .replace('-', '−');
  } catch {
    return `${amount < 0 ? '−' : ''}${currency} ${Math.abs(amount).toFixed(2)}`;
  }
};

/** Contract dates are plain ISO YYYY-MM-DD — parse as a LOCAL date, never via new Date(iso) (UTC-midnight shifts a day). */
export const formatDate = (isoDate: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || '');
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Intl.DateTimeFormat(activeLocale === 'fi' ? 'fi-FI' : 'en-GB', {
    day: 'numeric',
    month: 'short'
  }).format(d);
};

/** A YYYY-MM-DD fact as the owner's language writes it in full: 9.11.2026 (fi), 09/11/2026 (en). */
export const formatNumericDate = (isoDate: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || '');
  if (!m) return '';
  return numericDateFormat().format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
};

export type ParsedDate = { ok: true; iso: string } | { ok: false; reason: 'format' | 'impossible' };

/**
 * Read a date the owner typed the way their language writes it (the same
 * order and separator formatNumericDate prints; one- or two-digit day and
 * month) and return the plain ISO date the contract wants. An ISO date is
 * accepted as typed. Impossible days (31.2.2026) are refused, never rolled
 * over into the next month.
 */
export const parseNumericDate = (input: string): ParsedDate => {
  const value = (input ?? '').trim();
  let year: number, month: number, day: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (iso) {
    [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else {
    const parts = numericDateFormat().formatToParts(new Date(2000, 10, 22));
    const order = parts.filter(part => part.type !== 'literal').map(part => part.type);
    const separator = parts.find(part => part.type === 'literal')?.value ?? '.';
    const escaped = separator.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    const fields = order.map(type => (type === 'year' ? '(\\d{4})' : '(\\d{1,2})'));
    const match = new RegExp('^' + fields.join(escaped) + '$').exec(value);
    if (!match || order.length !== 3) return { ok: false, reason: 'format' };
    const read = (type: string) => Number(match[order.indexOf(type as Intl.DateTimeFormatPartTypes) + 1]);
    [year, month, day] = [read('year'), read('month'), read('day')];
  }
  if (month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate())
    return { ok: false, reason: 'impossible' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return { ok: true, iso: `${year}-${pad(month)}-${pad(day)}` };
};

const numericDateFormat = () =>
  new Intl.DateTimeFormat(activeLocale === 'fi' ? 'fi-FI' : 'en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' });

/** Quiet receipt timestamps use the handoff's 24-hour HH:mm clock. */
export const formatReceiptTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat(activeLocale === 'fi' ? 'fi-FI' : 'en-GB', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  return ['hour', 'minute'].map(type => parts.find(part => part.type === type)?.value ?? '').join(':');
};

/** Format a YYYY-MM calendar fact without routing it through UTC. */
export const formatMonth = (isoMonth: string, monthOnly = false): string => {
  const m = /^(\d{4})-(\d{2})$/.exec(isoMonth || '');
  if (!m) return t('home.undated');
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  const formatted = new Intl.DateTimeFormat(activeLocale === 'fi' ? 'fi-FI' : 'en-GB', {
    month: 'long',
    ...(monthOnly ? {} : { year: 'numeric' as const })
  }).format(d);
  return monthOnly ? formatted.charAt(0).toLocaleUpperCase(activeLocale) + formatted.slice(1) : formatted;
};
