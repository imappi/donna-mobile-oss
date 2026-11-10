import assert from 'node:assert/strict';
import test from 'node:test';
import { formatNumericDate, parseNumericDate, setLocale, t } from './index';

test('a Finnish owner types the date as Finnish writes it and the contract gets ISO', () => {
  setLocale('fi');
  assert.equal(formatNumericDate('2026-11-09'), '9.11.2026');
  assert.deepEqual(parseNumericDate('9.11.2026'), { ok: true, iso: '2026-11-09' });
  assert.deepEqual(parseNumericDate(' 09.01.2027 '), { ok: true, iso: '2027-01-09' });
  assert.deepEqual(parseNumericDate('29.2.2028'), { ok: true, iso: '2028-02-29' });
  assert.deepEqual(parseNumericDate(formatNumericDate('2026-12-31')), { ok: true, iso: '2026-12-31' });
  assert.match(t('mileage.date'), /p\.k\.vvvv/);
});

test('an English owner types the date the way the app already prints dates (day first)', () => {
  setLocale('en');
  assert.equal(formatNumericDate('2026-11-09'), '09/11/2026');
  assert.deepEqual(parseNumericDate('09/11/2026'), { ok: true, iso: '2026-11-09' });
  assert.deepEqual(parseNumericDate('9/11/2026'), { ok: true, iso: '2026-11-09' });
  assert.deepEqual(parseNumericDate(formatNumericDate('2026-12-31')), { ok: true, iso: '2026-12-31' });
  assert.match(t('mileage.date'), /dd\/mm\/yyyy/);
});

test('impossible dates are refused, never rolled into the next month', () => {
  for (const [locale, input] of [['fi', '31.2.2026'], ['fi', '29.2.2027'], ['fi', '0.11.2026'], ['fi', '9.13.2026'],
    ['en', '31/04/2026'], ['en', '29/02/2027'], ['en', '2026-02-30']] as const) {
    setLocale(locale);
    assert.deepEqual(parseNumericDate(input), { ok: false, reason: 'impossible' }, `${locale} ${input}`);
  }
});

test('other shapes are a format error, and an ISO date is accepted in either language', () => {
  setLocale('fi');
  for (const input of ['', '9.11.', '9/11/2026', '9.11.26', 'eilen', '2026-11-9x'])
    assert.deepEqual(parseNumericDate(input), { ok: false, reason: 'format' }, input);
  assert.deepEqual(parseNumericDate('2026-11-09'), { ok: true, iso: '2026-11-09' });
  setLocale('en');
  assert.deepEqual(parseNumericDate('9.11.2026'), { ok: false, reason: 'format' });
  assert.deepEqual(parseNumericDate('2026-11-09'), { ok: true, iso: '2026-11-09' });
});
