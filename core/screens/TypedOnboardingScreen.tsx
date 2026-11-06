import React from 'react';
import { Input } from '../design';
import { t } from '../i18n';
import { OnboardingFormScreen } from './OnboardingFormScreen';

export const TypedOnboardingScreen = ({ value, busy, error, onChange, onContinue, onVoice, onSkip }: {
  value: string;
  busy: boolean;
  error: string | null;
  onChange: (text: string) => void;
  onContinue: () => void;
  onVoice: () => void;
  onSkip: () => void;
}) => (
  <OnboardingFormScreen
    title={t('onboarding.businessTitle')}
    body={t('onboarding.typedPrompt')}
    primaryTitle={busy ? t('onboarding.preparingIntroduction') : t('onboarding.prepareIntroduction')}
    primaryDisabled={!value.trim()}
    busy={busy}
    error={error}
    secondaryTitle={t('onboarding.voiceStart')}
    tertiaryTitle={t('onboarding.skipForNow')}
    onPrimary={onContinue}
    onSecondary={onVoice}
    onTertiary={onSkip}
  >
    <Input
      variant="onboarding"
      multiline
      numberOfLines={6}
      accessibilityLabel={t('onboarding.writeLabel')}
      placeholder={t('onboarding.writePlaceholder')}
      value={value}
      editable={!busy}
      maxLength={12000}
      onChangeText={onChange}
      autoFocus
    />
  </OnboardingFormScreen>
);
