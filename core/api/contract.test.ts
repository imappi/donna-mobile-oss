import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';
import { findStrayKeys } from './contractShape';

const contractUrl = new URL('../../contract/mobile-api.yaml', import.meta.url);

test('the contract parses with no stray (non-keyword) keys in any schema', () => {
  const doc = parse(readFileSync(contractUrl, 'utf8'));
  assert.deepEqual(findStrayKeys(doc), []);
});

test('the stray-key check catches an unquoted comma in a flow mapping', () => {
  const doc = parse('components:\n  schemas:\n    X:\n      properties:\n        a: { type: number, description: Signed, major units. }\n');
  assert.deepEqual(findStrayKeys(doc), [{ path: 'components.schemas.X.properties.a', key: 'major units.' }]);
});
