import React from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '@/state/session';

/** Historical deep links now enter the Finland phone door; email is no longer a product route. */
export default function SignInRoute() {
  const { state } = useSession();
  if (state.phase === 'loading') return null;
  if (state.phase === 'locked') return <Redirect href="/unlock" />;
  return <Redirect href={state.phase === 'signedIn' ? '/actions' : '/onboarding/phone'} />;
}
