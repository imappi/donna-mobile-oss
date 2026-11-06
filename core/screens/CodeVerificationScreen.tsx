import React from 'react';
import { Button, CodeInput, OnboardingChecking, OnboardingCodeHeading, OnboardingLayout, Stack, Txt } from '../design';
import { t } from '../i18n';

export type CodeVerificationScreenProps = {
  phone: string; value: string; error?: string | null; notice?: string | null;
  busy?: boolean; resendSeconds: number; onChange: (value: string) => void;
  onSendAgain: () => void; onWrongNumber: () => void;
};

export const CodeVerificationScreen = ({ phone, value, error, notice, busy, resendSeconds,
  onChange, onSendAgain, onWrongNumber }: CodeVerificationScreenProps) => (
  <OnboardingLayout page="code" keyboard header={<OnboardingCodeHeading
    title={t('onboarding.codeTitle')} sentence={t('onboarding.codeBody', { phone })}
    link={t('onboarding.wrongNumber')} disabled={busy} onPress={onWrongNumber} />}>
    <CodeInput accessibilityLabel={t('onboarding.codeLabel')} value={value}
      onChangeText={onChange} editable={!busy} autoFocus />
    <Stack gap="sm">
      {busy ? <OnboardingChecking label={t('onboarding.checkingCode')} /> : <Button title={resendSeconds
        ? t('onboarding.resendCountdown', { seconds: resendSeconds }) : t('onboarding.sendAgain')}
        kind="text" size="onboarding" quietTone="ink" flush
        disabled={resendSeconds > 0} onPress={onSendAgain} />}
      {error ? <Txt v="onboardingSmall" tone="alert" accessibilityLiveRegion="polite">{error}</Txt> : null}
      {notice && process.env.EXPO_PUBLIC_ONBOARDING_HINTS === 'true' ? <Txt v="onboardingNote" tone="mute">{notice}</Txt> : null}
    </Stack>
    {process.env.EXPO_PUBLIC_ONBOARDING_HINTS === 'true' ? <Txt v="onboardingNote" tone="mute">{t('onboarding.previewCode')}</Txt> : null}
  </OnboardingLayout>
);
