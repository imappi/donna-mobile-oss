import assert from 'node:assert/strict';
import test from 'node:test';
import { formatNumber, parseDecimal, setLocale } from './index';

test('a Finnish owner types a distance with a decimal comma and the contract gets a JSON number', () => {
  setLocale('fi');
  assert.deepEqual(parseDecimal('12,5'), { ok: true, value: 12.5 });
  assert.deepEqual(parseDecimal(' 12 '), { ok: true, value: 12 });
  assert.deepEqual(parseDecimal('0,75'), { ok: true, value: 0.75 });
  assert.deepEqual(parseDecimal(',5'), { ok: true, value: 0.5 });
  // A phone keyboard set to another language may offer only a point; Finnish
  // groups with spaces, so a point can only mean the decimal.
  assert.deepEqual(parseDecimal('12.5'), { ok: true, value: 12.5 });
  // Finnish groups thousands with a (no-break) space.
  assert.deepEqual(parseDecimal('1 250,5'), { ok: true, value: 1250.5 });
  assert.deepEqual(parseDecimal('1 250,5'), { ok: true, value: 1250.5 });
  assert.deepEqual(parseDecimal(formatNumber(1250.5)), { ok: true, value: 1250.5 });
  assert.equal(formatNumber(12.5), '12,5');
});

test('an English owner types a decimal point; a comma only groups whole thousands', () => {
  setLocale('en');
  assert.deepEqual(parseDecimal('12.5'), { ok: true, value: 12.5 });
  assert.deepEqual(parseDecimal('1,250.5'), { ok: true, value: 1250.5 });
  assert.deepEqual(parseDecimal('12,345,678'), { ok: true, value: 12345678 });
  assert.deepEqual(parseDecimal(formatNumber(1250.5)), { ok: true, value: 1250.5 });
  assert.equal(formatNumber(12.5), '12.5');
  // Never guess: "12,5" is not a well-formed English number, so it is refused, not read as 125.
  assert.deepEqual(parseDecimal('12,5'), { ok: false });
  assert.deepEqual(parseDecimal('1,25'), { ok: false });
});

test('anything that is not a plain number is refused in either language', () => {
  for (const locale of ['fi', 'en'] as const) {
    setLocale(locale);
    for (const input of ['', ' ', 'abc', '12km', '1e3', '0x10', 'Infinity', 'NaN', '1.2.3', '1,2,3', '12,', '-', '1 2', '12 5'])
      assert.deepEqual(parseDecimal(input), { ok: false }, `${locale} ${JSON.stringify(input)}`);
  }
  setLocale('fi');
  assert.deepEqual(parseDecimal('1,250.5'), { ok: false });
});
