import assert from 'node:assert/strict';
import test from 'node:test';
import { artifact, refinement, shellGeometry, stream } from './tokens';
import { en } from '../i18n/en';
import { fi } from '../i18n/fi';
import { formatReceiptTime, getLocale, setLocale } from '../i18n';

test('working-screen geometry matches the supplied mobile refinement', () => {
  assert.deepEqual(refinement.groundColors, ['#F9EAC2', '#FFF0E3', '#FDFCF7', '#FEFDFA']);
  assert.deepEqual(refinement.groundLocations, [0, .28, .7, 1]);
  assert.equal(refinement.pillHeight, 22);
  assert.equal(refinement.detailPillHeight, 26);
  assert.equal(refinement.accentInk, '#8A5420');
  assert.equal(artifact.headerHeight, 62);
  assert.equal(artifact.contextPadding, 20);
  assert.equal(artifact.contextRadius, 24);
  assert.equal(refinement.decisionHeight, 48);
  assert.equal(refinement.chatHeaderHeight, 70);
  assert.equal(shellGeometry.chat.composerHeight, 54);
  assert.equal(artifact.composerHeight, 58);
  assert.equal(refinement.evidenceHeight, 132);
  assert.equal(stream.cardMinHeight, 70);
  assert.equal(refinement.reportRowHeight, 40);
});
test('receipt timestamps match the 24-hour handoff clock in both locales', () => {
  const previous = getLocale();
  try {
    for (const locale of ['en', 'fi'] as const) {
      setLocale(locale);
      assert.equal(formatReceiptTime(new Date(2026, 8, 6, 9, 41).toISOString()), '09:41');
      assert.equal(formatReceiptTime(new Date(2026, 8, 6, 20, 2).toISOString()), '20:02');
      assert.equal(formatReceiptTime('invalid'), '');
    }
  } finally { setLocale(previous); }
});
test('new working copy is available in Finnish and English without raw state enums', () => {
  assert.deepEqual(fi.home?.state, { needsInput: 'Sinun vuorosi', processing: 'Käsittelyssä', handled: 'Hoidettu', stalled: 'Jumissa' });
  assert.equal(fi.plus?.mileage, 'Kirjaa kilometrit');
  assert.equal(fi.chat?.placeholder, 'Kirjoita {brand}lle…');
  for (const dictionary of [en, fi]) {
    assert.ok(dictionary.status?.closed);
    assert.ok(dictionary.status?.locked);
    assert.ok(dictionary.review?.sample);
    assert.ok(dictionary.artifact?.total);
    assert.ok(dictionary.artifact?.receiptDetails);
  }
});
