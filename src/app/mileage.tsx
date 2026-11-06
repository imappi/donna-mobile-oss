import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@core/design';
import { t } from '@core/i18n';
import { MileageScreen } from '@core/screens/MileageScreen';
import { useEntityId, useSession } from '@/state/session';

const todayIso = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function MileageRoute() {
  const { api } = useSession();
  const entityId = useEntityId();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'km' | 'mi'>('km');

  return (
    <MileageScreen
      busy={busy}
      error={error}
      defaultDate={todayIso()}
      unit={unit}
      onToggleUnit={setUnit}
      onBack={() => router.back()}
      onSave={async ({ date, distance, purpose }) => {
        setBusy(true);
        setError(null);
        try {
          const result = await api.recordMileage(entityId, { date, distance, unit, purpose });
          queryClient.invalidateQueries({ queryKey: ['queue', entityId] });
          toast.show(result.receipt.summary);
          router.back();
        } catch (e) {
          setError(e instanceof Error ? e.message : t('common.error_generic'));
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}
