import React from 'react';
import { Redirect } from 'expo-router';
import { useOnboarding } from '@/state/onboarding';
import { firstEntryHref } from '@/state/onboardingState';
import { useSession } from '@/state/session';

export default function Index() {
  const { state } = useSession();
  const onboarding = useOnboarding();
  const destination = firstEntryHref(state.phase, onboarding.status);
  return destination ? <Redirect href={destination} /> : null;
}
