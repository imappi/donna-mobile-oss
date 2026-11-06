import React from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '@/state/session';

/** Older links no longer introduce a separate name question. */
export default function FirstNameRoute() {
  const { state } = useSession();
  if (state.phase === 'loading') return null;
  if (state.phase === 'locked') return <Redirect href="/unlock" />;
  return <Redirect href={state.phase === 'signedIn' ? '/onboarding/voice' : '/onboarding/phone'} />;
}
