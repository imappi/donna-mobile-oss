import React, { useEffect, useRef, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { NotificationOnboardingScreen } from '@core/screens/NotificationOnboardingScreen';
import { shell } from '@/shell';
import { notificationMoment } from '@/state/notificationMoment';
import { registerPush } from '@/state/pushRegistration';
import { useSession } from '@/state/session';
import { useDeviceSettings } from '@/state/deviceSettings';

export default function NotificationsRoute() {
  const { state, api } = useSession();
  const { update } = useDeviceSettings();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  if (state.phase === 'loading') return null;
  if (state.phase === 'locked') return <Redirect href="/unlock" />;
  if (state.phase !== 'signedIn') return <Redirect href="/onboarding/phone" />;
  if (!notificationMoment.isPending(state.principal.id)) return <Redirect href="/actions" />;
  const finish = () => { notificationMoment.finish(); router.replace('/actions'); };
  return <NotificationOnboardingScreen image={shell.appIcon} brand={shell.brandName} busy={busy}
    onLater={finish} onAllow={() => {
      if (started.current) return;
      started.current = true;
      setBusy(true);
      // Denial, unavailable push support, or a token/registration failure never blocks Books.
      void update({ notifications: true }).then(() => registerPush(api, true))
        .catch(() => {}).finally(() => { if (mounted.current) finish(); });
    }} />;
}
