import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Button, NotificationExample, OnboardingLayout, Stack, Txt } from '../design';
import { t } from '../i18n';

export const NotificationOnboardingScreen = ({ image, brand, busy, onAllow, onLater }: {
  image?: ImageSourcePropType; brand: string; busy: boolean; onAllow: () => void; onLater: () => void;
}) => <OnboardingLayout page="notifications" footer={<>
  <Button title={t('onboarding.notifyAllow')} kind="primary" size="onboarding" loading={busy} onPress={onAllow} />
  <Button title={t('onboarding.notifyLater')} kind="text" size="onboarding" onPress={onLater} />
</>}>
  <Stack gap="md">
    <Txt v="onboardingTitle" accessibilityRole="header">{t('onboarding.notifyTitle')}</Txt>
    <Txt v="onboardingLead" tone="soft">{t('onboarding.notifyBody')}</Txt>
  </Stack>
  <Stack gap="md">
    <NotificationExample image={image} brand={brand} now={t('onboarding.notifyNow')}
      title={t('onboarding.notifyExampleTitle')} body={t('onboarding.notifyExampleBody')} />
  </Stack>
</OnboardingLayout>;
