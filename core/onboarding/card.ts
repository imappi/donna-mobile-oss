import type { StringKey } from '../i18n';
import type { OnboardingProfileFieldState, OnboardingProfileForm, ProfileFieldName } from './profile';

export const CARD_FIELD_LABELS: Record<ProfileFieldName, StringKey> = {
  owner_name: 'onboarding.ownerName', business_name: 'onboarding.businessName',
  profession: 'onboarding.profession', description: 'onboarding.businessDescription',
  operating_area: 'onboarding.operatingArea', billing_basis: 'onboarding.billingBasis',
  experience: 'onboarding.experience', business_address: 'onboarding.businessAddress',
  people_involved: 'onboarding.peopleInvolved', payment_methods: 'onboarding.paymentMethods',
  spending_categories: 'onboarding.spendingCategories'
};

export const CARD_FACT_FIELDS = ['billing_basis', 'operating_area', 'experience', 'business_address', 'people_involved', 'payment_methods', 'spending_categories'] as const;

/** Visibility uses field state only; never mine the old narrative to fill gaps. */
export const visibleCardFactFields = (values: OnboardingProfileForm, states: OnboardingProfileFieldState) =>
  CARD_FACT_FIELDS.filter(field => values[field].trim() && states[field].state !== 'missing');

export const profileFieldHint = (field: ProfileFieldName, states: OnboardingProfileFieldState): StringKey | null => {
  if (states[field].state === 'uncertain') return states[field].requires_exact_confirmation
    ? 'onboarding.profileNameUncertain' : 'onboarding.profileUncertain';
  if (states[field].state === 'missing' && states[field].requires_exact_confirmation) return 'onboarding.cardAddName';
  return null;
};
