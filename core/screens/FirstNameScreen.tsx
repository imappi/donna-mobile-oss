import React from 'react';
import { Input } from '../design';
import { t } from '../i18n';
import { OnboardingFormScreen } from './OnboardingFormScreen';

export type FirstNameScreenProps = {
  value: string;
  busy: boolean;
  error?: string | null;
  onChange: (value: string) => void;
  onContinue: () => void;
};

export const FirstNameScreen = ({ value, busy, error, onChange, onContinue }: FirstNameScreenProps) => {
  const valid = Boolean(value.trim());
  return (
    <OnboardingFormScreen
      title={t('onboarding.nameTitle')}
      body={t('onboarding.nameBody')}
      primaryTitle={t('onboarding.finish')}
      primaryDisabled={!valid}
      busy={busy}
      error={error}
      onPrimary={onContinue}
    >
      <Input
        accessibilityLabel={t('onboarding.firstName')}
        placeholder={t('onboarding.firstName')}
        value={value}
        onChangeText={onChange}
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="done"
        onSubmitEditing={valid && !busy ? onContinue : undefined}
        editable={!busy}
      />
    </OnboardingFormScreen>
  );
};
