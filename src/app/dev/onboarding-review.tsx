import React, { useState } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { setLocale, t } from '@core/i18n';
import { OnboardingScreen } from '@core/screens/OnboardingScreen';
import { PhoneEntryScreen } from '@core/screens/PhoneEntryScreen';
import { CodeVerificationScreen } from '@core/screens/CodeVerificationScreen';
import { VoiceOnboardingScreen } from '@core/screens/VoiceOnboardingScreen';
import { OnboardingProfileReviewScreen } from '@core/screens/OnboardingProfileReviewScreen';
import { NotificationOnboardingScreen } from '@core/screens/NotificationOnboardingScreen';
import { HomeScreen } from '@core/screens/HomeScreen';
import { emptyOnboardingFieldState, emptyOnboardingProfile, type OnboardingProfileForm } from '@core/onboarding/profile';
import { shell } from '@/shell';
import { FloatingDonnaButton, ShellHeaderMenuProvider, Stack } from '@core/design';

const noop = () => {};

/** Isolated visual fixtures, never linked from onboarding and never saved to the API.
 * Available only in a development build explicitly started with the review flag. */
export default function OnboardingReview() {
  const params = useLocalSearchParams<{ screen?: string; lang?: string; state?: string }>();
  if (!__DEV__ || process.env.EXPO_PUBLIC_ONBOARDING_REVIEW !== 'true') return <Redirect href="/" />;
  return <Review key={[params.screen, params.lang, params.state].join(':')} page={params.screen ?? 'welcome'}
    language={params.lang === 'en' ? 'en' : 'fi'} state={params.state} />;
}

function Review({ page, language, state }: { page: string; language: 'fi' | 'en'; state?: string }) {
  setLocale(language);
  const [phone, setPhone] = useState(state === 'filled' ? '40 222 2222' : '');
  const [code, setCode] = useState('');
  const [paused, setPaused] = useState(state === 'paused');
  const [values, setValues] = useState<OnboardingProfileForm>({
    ...emptyOnboardingProfile('Matti Meikäläinen'),
    business_name: 'Mattin Putket Oy',
    profession: language === 'fi' ? 'Putkiasentaja' : 'Plumber',
    description: language === 'fi' ? 'Putkityöt asiakkaiden kohteissa' : 'Plumbing at customers’ sites',
    billing_basis: language === 'fi' ? 'Tuntityö + varaosat' : 'Hourly + parts',
    operating_area: 'Pirkanmaa',
    experience: language === 'fi' ? '12 vuotta' : '12 years'
  });
  const fieldState = emptyOnboardingFieldState();
  for (const field of Object.keys(values) as (keyof OnboardingProfileForm)[]) {
    if (values[field]) fieldState[field].state = 'confident';
  }
  if (state !== 'certain') fieldState.business_name.state = 'uncertain';
  if (page === 'welcome') return <OnboardingScreen mascot={shell.mascot} busy={false} onContinue={noop} />;
  if (page === 'phone') return <PhoneEntryScreen value={phone} valid={phone.replace(/\D/g, '').length === 9}
    onChange={setPhone} onContinue={noop} />;
  if (page === 'code') return <CodeVerificationScreen phone="+358 40 222 2222" value={code}
    busy={state === 'busy'} resendSeconds={state === 'resend' ? 0 : 30} onChange={setCode}
    onSendAgain={noop} onWrongNumber={noop} error={state === 'error' ? t('onboarding.codeInvalid') : null} />;
  if (page === 'business' || page === 'recording' || page === 'processing') return <VoiceOnboardingScreen
    idle={page === 'business'} active={page === 'recording' && !paused} paused={page === 'recording' && paused}
    processing={page === 'processing'} permissionDenied={state === 'denied'}
    status={t(paused ? 'onboarding.paused' : 'onboarding.recording')} elapsed="00:12"
    mascot={shell.mascot} primaryTitle={t('onboarding.finishRecording')} onPrimary={noop}
    secondaryTitle={t(paused ? 'onboarding.resumeRecording' : 'onboarding.pauseRecording')}
    onSecondary={() => setPaused(!paused)} onDiscard={noop} onTypeInstead={noop} onSkip={noop} />;
  if (page === 'card') return <OnboardingProfileReviewScreen values={values} fieldState={fieldState}
    source="voice" busy={false} onChange={(field, value) => setValues(previous => ({ ...previous, [field]: value }))}
    onConfirm={noop} onSwitchToVoice={noop} />;
  if (page === 'notifications') return <NotificationOnboardingScreen image={shell.appIcon} brand={shell.brandName}
    busy={false} onAllow={noop} onLater={noop} />;
  return <ShellHeaderMenuProvider value={{ open: false, onOpen: noop, attentionCount: 0, accessibilityLabel: t('ownerMenu.open') }}>
    <Stack grow><HomeScreen documents={[]} queued={[]} loading={false} refreshing={false}
    eyebrow={language === 'fi' ? 'Mattin Putket Oy · Syyskuu' : 'Mattin Putket Oy · September'} ownerName="Matti Meikäläinen"
    onRefresh={noop} onOpenCard={noop} onOpenDocument={noop} onOpenQueuedCapture={noop}
    onSnapReceipt={noop} onAddFile={noop} />
    <FloatingDonnaButton image={shell.mascot} open={false} onPress={noop}
      accessibilityLabel={t('tabs.donnaMenuCollapsed')}
      launcher={{ actions: [], dismissLabel: t('common.cancel'), onAction: noop, onDismiss: noop }} />
    </Stack></ShellHeaderMenuProvider>;
}
