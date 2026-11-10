import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@core/design';
import { MileageScreen } from '@core/screens/MileageScreen';
import { EntityRoute } from '@/state/EntityRoute';
import { useEntityId, useSession } from '@/state/session';
import { backOrBooks } from '@/state/backOrBooks';

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
  const [failed, setFailed] = useState(false);
  const [unit, setUnit] = useState<'km' | 'mi'>('km');
  const leave = () => backOrBooks(router);

  return (
    <MileageScreen
      busy={busy}
      failed={failed}
      defaultDate={todayIso()}
      unit={unit}
      onToggleUnit={setUnit}
      onBack={leave}
      onSave={async ({ date, distance, purpose }) => {
        setBusy(true);
        setFailed(false);
        try {
          const result = await api.recordMileage(entityId, { date, distance, unit, purpose });
          queryClient.invalidateQueries({ queryKey: ['queue', entityId] });
          toast.show(result.receipt.summary);
          leave();
        } catch {
          // The screen shows one plain sentence; the reason stays out of the interface.
          setFailed(true);
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
