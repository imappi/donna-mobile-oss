import assert from 'node:assert/strict';
import test from 'node:test';
import { CARD_FIELD_LABELS, profileFieldHint, visibleCardFactFields } from '@core/onboarding/card';
import { emptyOnboardingFieldState, emptyOnboardingProfile, mergeVoiceDraft, PROFILE_FIELDS, profileConfirmationFromForm } from '@core/onboarding/profile';
import { fi } from '@core/i18n/fi';
import { en } from '@core/i18n/en';
import type { VoiceOnboardingDraft } from '@core/api';

test('the card hides absent optional facts and keeps each uncertainty next to its own value', () => {
  const values = { ...emptyOnboardingProfile(), billing_basis: 'Tuntityö + varaosat', experience: 'Pari vuotta' };
  const states = emptyOnboardingFieldState();
  states.billing_basis.state = 'confident'; states.experience.state = 'uncertain';
  assert.deepEqual(visibleCardFactFields(values, states), ['billing_basis', 'experience']);
  assert.equal(profileFieldHint('billing_basis', states), null);
  assert.equal(profileFieldHint('experience', states), 'onboarding.profileUncertain');
  assert.equal(profileFieldHint('owner_name', states), 'onboarding.cardAddName');
  states.business_name.state = 'uncertain';
  assert.equal(profileFieldHint('business_name', states), 'onboarding.profileNameUncertain');
});

test('an older backend cannot populate the new card fields from a legacy narrative', () => {
  const value = { value: '', state: 'missing', requires_exact_confirmation: false } as const;
  const draft: VoiceOnboardingDraft = { processing_mode: 'live_transcription', cleanup_mode: 'model_cleanup',
    raw_transcript: 'Evidence', transcript: 'Legacy paragraph mentioning hourly rates and years of experience.',
    owner_name: value, business_name: value, description: value, operating_area: value,
    people_involved: value, payment_methods: value, spending_categories: value };
  const merged = mergeVoiceDraft(emptyOnboardingProfile(), draft);
  for (const field of ['profession', 'billing_basis', 'experience', 'business_address'] as const) {
    assert.equal(merged.values[field], '');
    assert.equal(merged.fieldState[field].state, 'missing');
  }
});

test('card edits and confirmation contain the same facts with no stale summary', () => {
  const values = { ...emptyOnboardingProfile(), owner_name: 'Eero Kallio', business_name: 'Havupuro Oy',
    profession: 'Putkiasentaja', description: 'Putkityöt asiakkaiden luona', billing_basis: '70 euroa / tunti + varaosat',
    experience: 'Pari vuotta putkiasentajana', business_address: 'Vaahterapolku 42' };
  const payload = profileConfirmationFromForm(values);
  for (const field of ['profession', 'description', 'billing_basis', 'experience', 'business_address'] as const) {
    assert.equal(payload[field], values[field]);
  }
  assert.equal('transcript' in payload, false);
  assert.equal('cleaned_transcript' in payload, false);
});

test('every onboarding string and every editable card field has a Finnish label', () => {
  for (const key of Object.keys(en.onboarding)) assert.ok(fi.onboarding?.[key as keyof typeof en.onboarding], key);
  for (const field of PROFILE_FIELDS) assert.ok(CARD_FIELD_LABELS[field], field);
});
