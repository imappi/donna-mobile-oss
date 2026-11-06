import React, { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { CodeVerificationScreen } from '@core/screens/CodeVerificationScreen';
import { t } from '@core/i18n';
import { useOnboarding } from '@/state/onboarding';
import { firstEntryHref } from '@/state/onboardingState';
import { formatFinnishPhoneInput, normalizeFinnishPhone, PREVIEW_SESSION_CREDENTIALS } from '@/state/onboardingPreview';
import { createPreviewCodeAttempt, resendSecondsRemaining } from '@/state/onboardingCode';
import { useOnboardingProfile } from '@/state/onboardingProfile';
import { useSession } from '@/state/session';

export default function CodeVerificationRoute() {
  const { state, signIn } = useSession();
  const profile = useOnboardingProfile();
  const onboarding = useOnboarding();
  const params = useLocalSearchParams<{ phone?: string }>();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendDeadline, setResendDeadline] = useState(() => Date.now() + 30000);
  const [resendSeconds, setResendSeconds] = useState(30);
  const attempt = useRef(createPreviewCodeAttempt()).current;
  useEffect(() => {
    const tick = () => setResendSeconds(resendSecondsRemaining(resendDeadline, Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [resendDeadline]);
  const entry = firstEntryHref(state.phase, onboarding.status);
  const phone = typeof params.phone === 'string' ? normalizeFinnishPhone(params.phone) : null;

  if (state.phase === 'signedIn' && busy) return <Redirect href="/onboarding/voice" />;
  if (entry !== '/onboarding/phone') return entry ? <Redirect href={entry} /> : null;
  if (!phone) return <Redirect href="/onboarding/phone" />;

  const changeCode = async (next: string) => {
    if (busy) return;
    setCode(next);
    setError(null);
    setNotice(null);
    if (next.length !== 6) return;
    const result = await attempt.submit(next, async () => {
      setBusy(true);
      Keyboard.dismiss();
      profile.reset();
      await signIn(PREVIEW_SESSION_CREDENTIALS.email, PREVIEW_SESSION_CREDENTIALS.password);
      router.replace('/onboarding/voice');
    });
    if (result === 'invalid' || result === 'failed') {
      setBusy(false);
      setCode('');
      setError(t(result === 'invalid' ? 'onboarding.codeInvalid' : 'onboarding.connectionFailed'));
    }
  };

  return <CodeVerificationScreen phone={`+358 ${formatFinnishPhoneInput(phone)}`}
    value={code} error={error} notice={notice} busy={busy} resendSeconds={resendSeconds}
    onChange={next => void changeCode(next)}
    onWrongNumber={() => router.replace({ pathname: '/onboarding/phone', params: { phone } })}
    onSendAgain={() => {
      if (busy || resendSecondsRemaining(resendDeadline, Date.now()) > 0) return;
      setResendDeadline(Date.now() + 30000);
      setCode('');
      setError(null);
      setNotice(t('onboarding.codeSentAgain'));
    }} />;
}
