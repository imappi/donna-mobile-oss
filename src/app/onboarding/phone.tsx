import React, { useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { PhoneEntryScreen } from '@core/screens/PhoneEntryScreen';
import { t } from '@core/i18n';
import { useOnboarding } from '@/state/onboarding';
import { firstEntryHref } from '@/state/onboardingState';
import { formatFinnishPhoneInput, normalizeFinnishPhone } from '@/state/onboardingPreview';
import { useSession } from '@/state/session';

export default function PhoneEntryRoute() {
  const { state } = useSession();
  const onboarding = useOnboarding();
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const [phone, setPhone] = useState(() => formatFinnishPhoneInput(params.phone ?? ''));
  const [error, setError] = useState<string | null>(null);
  const entry = firstEntryHref(state.phase, onboarding.status);

  if (entry !== '/onboarding/phone') return entry ? <Redirect href={entry} /> : null;

  const normalized = normalizeFinnishPhone(phone);
  const continueToCode = () => {
    if (!normalized) {
      setError(t('onboarding.phoneInvalid'));
      return;
    }
    router.push({ pathname: '/onboarding/code', params: { phone: normalized } });
  };

  return (
    <PhoneEntryScreen
      value={phone}
      valid={Boolean(normalized)}
      error={error}
      onChange={(next) => {
        setPhone(formatFinnishPhoneInput(next));
        setError(null);
      }}
      onContinue={continueToCode}
    />
  );
}
