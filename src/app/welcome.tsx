import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { OnboardingScreen } from '@core/screens/OnboardingScreen';
import { shell } from '@/shell';
import { useOnboarding } from '@/state/onboarding';
import { firstEntryHref } from '@/state/onboardingState';
import { useSession } from '@/state/session';

export default function WelcomeRoute() {
  const { state } = useSession();
  const onboarding = useOnboarding();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const destination = firstEntryHref(state.phase, onboarding.status);

  if (destination !== '/welcome') {
    return destination ? <Redirect href={destination} /> : null;
  }

  const continueToPhone = async () => {
    setBusy(true);
    await onboarding.complete();
    router.replace('/onboarding/phone');
  };

  return <OnboardingScreen mascot={shell.mascot} busy={busy} onContinue={continueToPhone} />;
}
