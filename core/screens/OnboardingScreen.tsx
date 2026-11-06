import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Button, MascotOrb, onboarding, OnboardingLayout, WelcomeCopy, Txt } from '../design';
import { t } from '../i18n';

export type OnboardingScreenProps = { mascot?: ImageSourcePropType; busy: boolean; onContinue: () => void };

export const OnboardingScreen = ({ mascot, busy, onContinue }: OnboardingScreenProps) => (
  <OnboardingLayout page="welcome" footer={<Button title={t('onboarding.continue')} kind="primary"
    size="onboarding" loading={busy} onPress={onContinue} />}>
    <MascotOrb size={onboarding.mascotSize} image={mascot}
      imageSize={onboarding.mascotImageSize} imageShift={onboarding.mascotImageShift} lifted />
    <WelcomeCopy>
      <Txt v="onboardingWelcome" accessibilityRole="header">{t('onboarding.title')}</Txt>
      <Txt v="onboardingLead" tone="soft">{t('onboarding.handoff')}</Txt>
    </WelcomeCopy>
  </OnboardingLayout>
);
