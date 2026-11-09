import assert from 'node:assert/strict';
import test from 'node:test';
import { dictionaries } from '../i18n';
import { en } from '../i18n/en';

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
    else if (text.trim() === '') problems.push(`empty ${key}`);
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
