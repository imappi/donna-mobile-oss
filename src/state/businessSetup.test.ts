import assert from 'node:assert/strict';
import test from 'node:test';
import { en } from '@core/i18n/en';
import { fi } from '@core/i18n/fi';
import { SETUP_SUGGESTIONS } from '@core/onboarding/setup';
import { stateForDocument } from '@core/screens/homeStream';
import type { Doc } from '@core/api';

test('all optional setup copy and every backend action have Finnish presentation', () => {
  for (const key of Object.keys(en.setup)) assert.ok(fi.setup?.[key as keyof typeof en.setup], key);
  assert.deepEqual(Object.keys(SETUP_SUGGESTIONS).sort(), ['business_stage', 'done', 'first_receipt', 'identify_business', 'prior_records']);
});
test('a stored background record is not an endless processing task or an owner approval', () => {
  const doc: Doc = { id: 'context', entity_id: 'synthetic', filename: 'prior.csv', uploaded_at: '2026-09-05T00:00:00Z',
    purpose: 'prior_records', capture_state: 'stored' };
  assert.equal(stateForDocument(doc), 'handled'); // Display overrides with Received, not Posted/Ready.
});
