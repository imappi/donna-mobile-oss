import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Redirect } from 'expo-router';
import { UnlockScreen } from '@core/screens/UnlockScreen';
import { shell } from '@/shell';
import { useSession } from '@/state/session';

/**
 * The biometric gate route. Mounted only while the session is 'locked';
 * the prompt fires once on arrival, and the button re-fires it after a
 * cancel. Unlock success flows into the normal session restore — the
 * redirects below then take over.
 */
export default function UnlockRoute() {
  const { state, unlock, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const promptedOnce = useRef(false);

  const attempt = useCallback(async () => {
    setBusy(true);
    try {
      await unlock();
    } finally {
      setBusy(false);
    }
  }, [unlock]);

  const locked = state.phase === 'locked';
  useEffect(() => {
    if (!locked || promptedOnce.current) return;
    promptedOnce.current = true;
    attempt();
  }, [locked, attempt]);

  if (state.phase === 'signedIn') return <Redirect href="/actions" />;
  if (state.phase === 'signedOut') return <Redirect href="/onboarding/phone" />;

  return (
    <UnlockScreen
      brandName={shell.brandName}
      busy={busy}
      onUnlock={attempt}
      onSignOut={() => {
        signOut();
      }}
    />
  );
}
