import React, { useRef, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { OnboardingProfileReviewScreen } from '@core/screens/OnboardingProfileReviewScreen';
import { t } from '@core/i18n';
import { profileConfirmationFromForm, type OnboardingProfileForm } from '@core/onboarding/profile';
import { useOnboardingProfile } from '@/state/onboardingProfile';
import { useSession } from '@/state/session';
import { notificationMoment } from '@/state/notificationMoment';

export default function OnboardingProfileRoute() {
  const { state, api, applyProfileUpdate } = useSession();
  const profile = useOnboardingProfile();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);

  if (state.phase === 'loading') return null;
  if (state.phase === 'locked') return <Redirect href="/unlock" />;
  if (state.phase !== 'signedIn') return <Redirect href="/onboarding/phone" />;

  const confirm = async (values: OnboardingProfileForm) => {
    if (saving.current) return;
    if (!values.owner_name.trim() || !values.business_name.trim()) {
      setError(t('onboarding.profileRequired'));
      return;
    }
    saving.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await api.confirmOnboardingProfile(
        state.entityId,
        profileConfirmationFromForm(values)
      );
      applyProfileUpdate(result.principal, result.entity);
      profile.reset();
      const offerNotifications = await notificationMoment.offerAfterConfirmation(result.principal.id);
      router.replace(offerNotifications ? '/onboarding/notifications' : '/actions');
    } catch {
      setError(t('common.error_generic'));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  return (
    <OnboardingProfileReviewScreen
      values={profile.values}
      fieldState={profile.fieldState}
      rawTranscript={profile.rawTranscript}
      samplePreview={profile.processingMode === 'sample_preview'}
      source={profile.source}
      busy={busy}
      error={error}
      onChange={(field, value) => {
        profile.updateField(field, value);
        setError(null);
      }}
      onConfirm={confirm}
      onSwitchToVoice={() => {
        profile.restartVoice();
        router.replace('/onboarding/voice');
      }}
    />
  );
}
