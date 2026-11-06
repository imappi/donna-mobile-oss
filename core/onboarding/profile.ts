import type {
  OnboardingDraftField,
  OnboardingProfileConfirmation,
  VoiceOnboardingDraft
} from '../api';

export const PROFILE_FIELDS = [
  'owner_name',
  'business_name',
  'profession',
  'description',
  'operating_area',
  'billing_basis',
  'experience',
  'business_address',
  'people_involved',
  'payment_methods',
  'spending_categories'
] as const;

export type ProfileFieldName = (typeof PROFILE_FIELDS)[number];
export type OnboardingProfileForm = Record<ProfileFieldName, string>;
export type OnboardingProfileFieldState = Record<
  ProfileFieldName,
  Pick<OnboardingDraftField, 'state' | 'requires_exact_confirmation'>
>;

export const exactProfileFields = new Set<ProfileFieldName>(['owner_name', 'business_name']);

export const emptyOnboardingProfile = (ownerName = ''): OnboardingProfileForm => ({
  owner_name: ownerName,
  business_name: '',
  profession: '',
  description: '',
  operating_area: '',
  billing_basis: '',
  experience: '',
  business_address: '',
  people_involved: '',
  payment_methods: '',
  spending_categories: ''
});

export const emptyOnboardingFieldState = (): OnboardingProfileFieldState =>
  Object.fromEntries(
    PROFILE_FIELDS.map((field) => [
      field,
      {
        state: 'missing',
        requires_exact_confirmation: exactProfileFields.has(field)
      }
    ])
  ) as OnboardingProfileFieldState;

/** A new introduction must not inherit names or facts from the discarded recording. */
export const restartVoiceProfile = (): { values: OnboardingProfileForm; fieldState: OnboardingProfileFieldState } => {
  const values = emptyOnboardingProfile();
  const fieldState = emptyOnboardingFieldState();
  return { values, fieldState };
};

export const mergeVoiceDraft = (
  current: OnboardingProfileForm,
  draft: VoiceOnboardingDraft
): { values: OnboardingProfileForm; fieldState: OnboardingProfileFieldState } => {
  const fieldState = emptyOnboardingFieldState();
  const values = { ...current };
  for (const field of PROFILE_FIELDS) {
    const extracted = draft[field] ?? { value: '', state: 'missing', requires_exact_confirmation: exactProfileFields.has(field) };
    if (!values[field].trim()) values[field] = extracted.value;
    fieldState[field] = {
      state: values[field].trim() && values[field] !== extracted.value ? 'confident' : extracted.state,
      requires_exact_confirmation: exactProfileFields.has(field) || extracted.requires_exact_confirmation
    };
  }
  return { values, fieldState };
};

const listFromText = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const profileConfirmationFromForm = (
  values: OnboardingProfileForm
): OnboardingProfileConfirmation => ({
  owner_name: values.owner_name.trim(),
  business_name: values.business_name.trim(),
  description: values.description.trim(),
  operating_area: values.operating_area.trim(),
  profession: values.profession.trim(),
  billing_basis: values.billing_basis.trim(),
  experience: values.experience.trim(),
  business_address: values.business_address.trim(),
  people_involved: listFromText(values.people_involved),
  payment_methods: listFromText(values.payment_methods),
  spending_categories: listFromText(values.spending_categories),
  confirmed_exact_fields: ['owner_name', 'business_name']
});
