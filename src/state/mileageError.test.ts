import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { dictionaries } from '@core/i18n';

const root = join(import.meta.dirname, '..', '..');

test('a failed mileage save shows a catalog sentence, never the caught error text', () => {
  const route = readFileSync(join(root, 'src', 'app', 'mileage.tsx'), 'utf8');
  assert.doesNotMatch(route, /\.message\b/, 'the route must not put an error message on screen');
  const screen = readFileSync(join(root, 'core', 'screens', 'MileageScreen.tsx'), 'utf8');
  assert.match(screen, /t\('mileage\.saveError'\)/);
  assert.equal(dictionaries.en.mileage.saveError, 'The trip was not logged. Try again in a moment.');
  assert.ok(dictionaries.fi.mileage.saveError);
});
