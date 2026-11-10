import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@core/design';
import { t } from '@core/i18n';
import { MileageScreen } from '@core/screens/MileageScreen';
import { EntityRoute } from '@/state/EntityRoute';
import { useEntityId, useSession } from '@/state/session';

const todayIso = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const SignedInMileage = () => {
  const { api } = useSession();
  const entityId = useEntityId();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'km' | 'mi'>('km');
  // A cold deep link has no history to go back to: land on Books instead.
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/actions'));

  return (
    <MileageScreen
      busy={busy}
      error={error}
      defaultDate={todayIso()}
      unit={unit}
      onToggleUnit={setUnit}
      onBack={leave}
      onSave={async ({ date, distance, purpose }) => {
        setBusy(true);
        setError(null);
        try {
          const result = await api.recordMileage(entityId, { date, distance, unit, purpose });
          queryClient.invalidateQueries({ queryKey: ['queue', entityId] });
          toast.show(result.receipt.summary);
          leave();
        } catch (e) {
          setError(e instanceof Error ? e.message : t('common.error_generic'));
        } finally {
          setBusy(false);
        }
      }}
    />
  );
};

export default function MileageRoute() {
  return <EntityRoute><SignedInMileage /></EntityRoute>;
}
