import React from 'react';
import { PhoneInput } from '../design';
import { t } from '../i18n';
import { OnboardingFormScreen } from './OnboardingFormScreen';

export type PhoneEntryScreenProps = {
  value: string;
  valid: boolean;
  error?: string | null;
  onChange: (value: string) => void;
  onContinue: () => void;
};

export const PhoneEntryScreen = ({ value, valid, error, onChange, onContinue }: PhoneEntryScreenProps) => (
  <OnboardingFormScreen
    title={t('onboarding.phoneTitle')}
    body={t('onboarding.phoneBody')}
    primaryTitle={t('onboarding.sendCode')}
    primaryDisabled={!valid}
    error={error}
    note={process.env.EXPO_PUBLIC_ONBOARDING_HINTS === 'true' ? t('onboarding.previewPhone') : null}
    onPrimary={onContinue}
  >
    <PhoneInput
      callingCode="+358"
      callingCodeLabel={t('onboarding.finlandCallingCode')}
      accessibilityLabel={t('onboarding.phoneLabel')}
      placeholder={t('onboarding.phonePlaceholder')}
      value={value}
      onChangeText={onChange}
      onSubmitEditing={valid ? onContinue : undefined}
      autoFocus
    />
  </OnboardingFormScreen>
);
