import React from 'react';
import { Card, Txt } from '../design';
import { t } from '../i18n';
import { OnboardingFormScreen } from './OnboardingFormScreen';

export type BusinessOnboardingScreenProps = {
  onVoice: () => void;
  onType: () => void;
  onSkip: () => void;
};

export const BusinessOnboardingScreen = ({ onVoice, onType, onSkip }: BusinessOnboardingScreenProps) => (
  <OnboardingFormScreen
    title={t('onboarding.businessTitle')}
    body={t('onboarding.businessBody')}
    primaryTitle={t('onboarding.voiceStart')}
    primaryIcon="microphone"
    secondaryTitle={t('onboarding.typeInstead')}
    tertiaryTitle={t('onboarding.skipForNow')}
    note={t('onboarding.voicePrivacy')}
    onPrimary={onVoice}
    onSecondary={onType}
    onTertiary={onSkip}
  >
    <Card>
      <Txt v="body">{t('onboarding.businessPrompt')}</Txt>
    </Card>
  </OnboardingFormScreen>
);
