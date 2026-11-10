import assert from 'node:assert/strict';
import test from 'node:test';
import { dictionaries } from '../i18n';
import { en } from '../i18n/en';
import { settingsLocales, settingsPairs } from '../i18n/settings';

/**
 * Every locale carries every English key, no extra keys, and the same
 * {token} placeholders. The type system already refuses a missing key in a
 * locale typed as `Dictionary`; this catches what it cannot: a dropped or
 * misspelled placeholder, an empty string, and a locale added as `unknown`.
 *
 * `{brand}` is the one exception: t() supplies it itself, so a translation
 * may leave it out (Finnish often rephrases rather than glue a case ending
 * to a name). It may not misspell it. Every caller-supplied token must match.
 */
const OPTIONAL_TOKENS = new Set(['brand']);
type Tree = { [key: string]: string | Tree };

const leaves = (node: Tree, prefix = ''): Map<string, string> => {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string') out.set(prefix + key, value);
    else for (const [k, v] of leaves(value, `${prefix}${key}.`)) out.set(k, v);
  }
  return out;
};

const tokens = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
const required = (text: string) => tokens(text).filter(name => !OPTIONAL_TOKENS.has(name));
const sameTokens = (source: string, text: string) =>
  required(text).join() === required(source).join() &&
  tokens(text).every(name => !OPTIONAL_TOKENS.has(name) || tokens(source).includes(name));

export const localeProblems = (reference: Tree, locale: Tree): string[] => {
  const want = leaves(reference);
  const have = leaves(locale);
  const problems: string[] = [];
  for (const [key, source] of want) {
    const text = have.get(key);
    if (text === undefined) problems.push(`missing ${key}`);
    // A blank English source is a deliberate blank (the Settings home has no eyebrow).
    else if (text.trim() === '' && source.trim() !== '') problems.push(`empty ${key}`);
    else if (!sameTokens(source, text))
      problems.push(`placeholders differ in ${key}: {${tokens(source).join('},{')}} vs {${tokens(text).join('},{')}}`);
  }
  for (const key of have.keys()) if (!want.has(key)) problems.push(`extra ${key}`);
  return problems;
};

test('every locale has every English key with the same placeholders', () => {
  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    assert.deepEqual(localeProblems(en as unknown as Tree, dictionary as unknown as Tree), [], locale);
  }
});

/**
 * Settings copy lives in its own file (core/i18n/settings.ts) because its
 * pages are row structures, not flat keys. Same guarantee: every English
 * string has a Finnish one with the same placeholders, and the rows a
 * translation renders keep the same icons, routes and flags.
 */
const STRUCTURE = /\.(icon|go|toggle|radio|option)$/;
const structure = (node: unknown, prefix = ''): Map<string, unknown> => {
  const out = new Map<string, unknown>();
  if (node == null || typeof node !== 'object') return out;
  for (const [key, value] of Object.entries(node)) {
    const path = prefix + key;
    if (value != null && typeof value === 'object') for (const [k, v] of structure(value, `${path}.`)) out.set(k, v);
    else if (typeof value !== 'string' || STRUCTURE.test(`.${path}`)) out.set(path, value);
  }
  return out;
};
const copyOnly = (node: unknown): Tree => {
  if (Array.isArray(node)) return Object.fromEntries(node.map((v, i) => [String(i), copyOnly(v)]));
  const out: Tree = {};
  for (const [key, value] of Object.entries(node as object)) {
    if (typeof value === 'string' && !STRUCTURE.test(`.${key}`)) out[key] = value;
    else if (value != null && typeof value === 'object') out[key] = copyOnly(value);
  }
  return out;
};
export const settingsProblems = (
  locales: Record<string, unknown>,
  pairs: Record<string, readonly string[]>
): string[] => {
  const reference = locales.en;
  const problems: string[] = [];
  for (const [locale, copy] of Object.entries(locales)) {
    if (locale === 'en') continue;
    problems.push(...localeProblems(copyOnly(reference), copyOnly(copy)).map(p => `${locale} ${p}`));
    const want = structure(reference);
    const have = structure(copy);
    for (const [key, value] of want) if (have.get(key) !== value) problems.push(`${locale} structure differs at ${key}`);
    for (const key of have.keys()) if (!want.has(key)) problems.push(`${locale} structure differs at ${key}`);
  }
  const pairTree = (index: number): Tree =>
    Object.fromEntries(Object.entries(pairs).map(([key, pair]) => [key, pair[index] ?? '']));
  problems.push(...localeProblems(pairTree(1), pairTree(0)).map(p => `fi text ${p}`));
  for (const [key, pair] of Object.entries(pairs)) {
    if (pair.length !== 2) problems.push(`text ${key} needs exactly [fi, en]`);
    if (!pair[1]?.trim()) problems.push(`en text empty ${key}`);
  }
  return problems;
};

test('every Settings string has Finnish and English with the same placeholders and rows', () => {
  assert.deepEqual(settingsProblems(settingsLocales, settingsPairs), []);
});

test('the Settings check reports a missing translation, a changed row and a half pair', () => {
  const en = { page: { title: 'Bank', lead: 'Ask {brand}', sections: [{ rows: [{ label: 'OP', go: 'done' }] }] } };
  assert.deepEqual(settingsProblems({ en, fi: { page: { title: 'Pankki', lead: 'Kysy', sections: [{ rows: [{ label: 'OP', go: 'done' }] }] } } }, { ok: ['Hei', 'Hi'] }), []);
  assert.deepEqual(
    settingsProblems(
      { en, fi: { page: { title: 'Pankki', sections: [{ rows: [{ label: 'OP', go: 'elsewhere', noIcon: true }] }] } } },
      { half: ['Hei'], blank: [' ', 'Hi'], drift: ['{pvm}', '{date}'] }
    ),
    [
      'fi missing page.lead',
      'fi structure differs at page.sections.0.rows.0.go',
      'fi structure differs at page.sections.0.rows.0.noIcon',
      'fi text empty blank',
      'fi text placeholders differ in drift: {date} vs {pvm}',
      'text half needs exactly [fi, en]',
      'en text empty half'
    ]
  );
});

test('the parity check reports missing keys, extra keys and placeholder drift', () => {
  const reference = { a: { one: 'Hi {name}', two: '{count} of {total}' }, b: 'Plain', c: 'Ask {brand}' };
  assert.deepEqual(localeProblems(reference, { a: { one: 'Hei {name}', two: '{total}: {count}' }, b: 'Tavallinen', c: 'Kysy meiltä' }), []);
  assert.deepEqual(localeProblems(reference, { a: { one: 'Hei {name}', two: '{count}/{total}' }, b: '{brand}', c: 'Kysy {brnad}' }), [
    'placeholders differ in b: {} vs {brand}',
    'placeholders differ in c: {brand} vs {brnad}'
  ]);
  assert.deepEqual(localeProblems(reference, { a: { one: 'Hei {nimi}', two: '{count}' }, c: 'Kysy', d: 'Ylimääräinen' } as Tree), [
    'placeholders differ in a.one: {name} vs {nimi}',
    'placeholders differ in a.two: {count},{total} vs {count}',
    'missing b',
    'extra d'
  ]);
  assert.deepEqual(localeProblems(reference, { a: { one: ' ', two: '{count} / {total}' }, b: 'x', c: 'y' }), ['empty a.one']);
});
