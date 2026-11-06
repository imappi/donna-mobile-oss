import assert from 'node:assert/strict';
import test from 'node:test';
import type { VoiceOnboardingDraft } from '@core/api';
import {
  emptyOnboardingProfile,
  mergeVoiceDraft,
  profileConfirmationFromForm,
  restartVoiceProfile
} from './onboardingProfile';

const field = (
  value: string,
  state: 'confident' | 'uncertain' | 'missing' = value ? 'confident' : 'missing',
  requiresExact = false
) => ({ value, state, requires_exact_confirmation: requiresExact });

const draft: VoiceOnboardingDraft = {
  processing_mode: 'live_transcription',
  cleanup_mode: 'model_cleanup',
  raw_transcript: 'Neutral preview trans crypt.',
  transcript: 'Neutral preview transcript.',
  owner_name: field('Misheard name', 'uncertain', true),
  business_name: field('Northwind Studio', 'uncertain', true),
  description: field('Repairs bicycles'),
  operating_area: field('Southern Finland'),
  people_involved: field('Owner'),
  payment_methods: field('Card, bank transfer'),
  spending_categories: field('Parts, tools')
};

test('voice extraction never replaces typed work that the owner already confirmed', () => {
  const current = emptyOnboardingProfile('Alex');
  current.business_name = 'Corrected Studio';
  const merged = mergeVoiceDraft(current, draft);
  assert.equal(merged.values.owner_name, 'Alex');
  assert.equal(merged.values.business_name, 'Corrected Studio');
  assert.equal(merged.values.description, 'Repairs bicycles');
});

test('an exact field correction is the value submitted only after review confirmation', () => {
  const merged = mergeVoiceDraft(emptyOnboardingProfile('Alex'), draft);
  const corrected = { ...merged.values, business_name: 'North Star Studio' };
  const confirmation = profileConfirmationFromForm(corrected);
  assert.equal(confirmation.business_name, 'North Star Studio');
  assert.deepEqual(confirmation.confirmed_exact_fields, ['owner_name', 'business_name']);
  assert.deepEqual(confirmation.payment_methods, ['Card', 'bank transfer']);
});

test('starting over clears names and every fact from the previous recording', () => {
  const restarted = restartVoiceProfile();
  assert.deepEqual(restarted.values, emptyOnboardingProfile());
  assert.equal(restarted.fieldState.owner_name.state, 'missing');
  assert.equal(restarted.fieldState.business_name.state, 'missing');
});

test('the review retains backend name uncertainty and clears it for a supplied correction', () => {
  const proposed = mergeVoiceDraft(emptyOnboardingProfile(), draft);
  assert.equal(proposed.fieldState.business_name.state, 'uncertain');
  const corrected = { ...proposed.values, business_name: 'North Star Studio' };
  const reviewed = mergeVoiceDraft(corrected, draft);
  assert.equal(reviewed.fieldState.business_name.state, 'confident');
  assert.equal(reviewed.fieldState.business_name.requires_exact_confirmation, true);
});
