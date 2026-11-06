import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Button, MascotOrb, MicrophoneButton, onboarding, OnboardingCues, OnboardingFocus,
  OnboardingLayout, OnboardingProgress, OnboardingPermissionNote, Row, Txt, VoiceActivity, VoiceRecorderPanel, type ButtonProps } from '../design';
import { t } from '../i18n';

export type VoiceOnboardingScreenProps = {
  status: string; detail?: string | null; elapsed: string; idle?: boolean; success?: boolean;
  active?: boolean; paused?: boolean; processing?: boolean; permissionDenied?: boolean; mascot?: ImageSourcePropType;
  primaryTitle: string; primaryIcon?: ButtonProps['icon']; primaryDisabled?: boolean;
  secondaryTitle?: string; secondaryIcon?: ButtonProps['icon']; canDiscard?: boolean;
  onPrimary: () => void; onSecondary?: () => void; onDiscard: () => void;
  onTypeInstead: () => void; onSkip: () => void;
};

export const VoiceOnboardingScreen = ({
  status, detail, elapsed, idle, success, active, paused, processing, permissionDenied, mascot,
  primaryTitle, primaryIcon, primaryDisabled, secondaryTitle, secondaryIcon,
  canDiscard, onPrimary, onSecondary, onDiscard, onTypeInstead, onSkip
}: VoiceOnboardingScreenProps) => {
  const recording = active || paused;
  const cues = [t('onboarding.cueBusiness'), t('onboarding.cueCustomers'), t('onboarding.cueBilling')];
  if (processing) return <OnboardingLayout page="processing" footer={
    <Button title={t('common.cancel')} size="onboarding" kind="text" quietTone="mute" onPress={onDiscard} />
  }>
    <MascotOrb size={onboarding.processingOrbSize} image={mascot}
      imageSize={onboarding.processingImageSize} imageShift={onboarding.processingImageShift} lifted />
      <Txt v="onboardingTitle" accessibilityRole="header">{t('onboarding.processingTitle')}</Txt>
      <OnboardingProgress steps={[t('onboarding.processingHeard'), t('onboarding.processingExtracted'), t('onboarding.processingCard')]} />
      <Txt v="onboardingNote" tone="mute">{t('onboarding.processingPrivacy')}</Txt>
  </OnboardingLayout>;

  return <OnboardingLayout
    page={recording ? 'recording' : 'business'}
    title={recording ? undefined : t(success ? 'onboarding.cardTitle' : 'onboarding.businessTitle')}
    body={idle ? t('onboarding.businessPrompt') : undefined}
    footer={<>
      {!idle ? <Button title={recording ? t('onboarding.finishRecording') : primaryTitle} kind="primary" size="onboarding"
        disabled={primaryDisabled} icon={recording ? undefined : primaryIcon} onPress={onPrimary} /> : null}
      <Row between wrap gap="md">
        {recording ? <>
          {secondaryTitle && onSecondary ? <Button title={secondaryTitle} kind="text" size="onboarding"
            onPress={onSecondary} /> : null}
          <Button title={t('onboarding.discardRecording')} kind="text" size="onboarding" quietTone="mute" onPress={onDiscard} />
        </> : <>
          <Button title={t('onboarding.typeInstead')} kind="text" size="onboarding" onPress={onTypeInstead} />
          {idle ? <Button title={t('onboarding.skipForNow')} kind="text" size="onboarding" quietTone="mute" onPress={onSkip} /> : null}
        </>}
      </Row>
      {!idle && !recording && secondaryTitle && onSecondary ? <Button title={secondaryTitle}
        kind="text" size="onboarding" icon={secondaryIcon} onPress={onSecondary} /> : null}
      {!idle && !recording && canDiscard ? <Button title={t('onboarding.discardRecording')}
        kind="text" size="onboarding" onPress={onDiscard} /> : null}
    </>}>
    {recording ? <VoiceRecorderPanel status={status} elapsed={elapsed} active={active} /> : null}
    {idle || recording ? <OnboardingCues cues={cues} recording={Boolean(recording)} note={idle ? t('onboarding.cueNote') : undefined} /> : null}
    {permissionDenied ? <OnboardingPermissionNote>{t('onboarding.microphoneDenied')}</OnboardingPermissionNote> : null}
    {idle ? <>
      <OnboardingFocus>
        <MicrophoneButton label={t('onboarding.startRecording')} onPress={onPrimary} disabled={primaryDisabled} />
        <Txt v="onboardingTap" tone="soft">{t('onboarding.tapToSpeak')}</Txt>
      </OnboardingFocus>
    </> : recording ? <OnboardingFocus><VoiceActivity active={Boolean(active)} /></OnboardingFocus> : <>
      <Txt v="onboardingLead" accessibilityLiveRegion="polite">{status}</Txt>
      {detail ? <Txt v="body" tone={success ? 'soft' : 'alert'} accessibilityLiveRegion="polite">{detail}</Txt> : null}
    </>}
  </OnboardingLayout>;
};
