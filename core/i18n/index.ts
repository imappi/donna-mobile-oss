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
