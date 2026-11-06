import React from 'react';
import { useRouter } from 'expo-router';
import { MaterialsScreen } from '@core/screens/MaterialsScreen';
import { useCaptureQueue } from '@/state/captureQueue';
import { useDocuments, useHeaderEyebrow } from '@/state/hooks';
import { useEntityId } from '@/state/session';

export default function MaterialsRoute() {
  const documents = useDocuments();
  const entityId = useEntityId();
  const captureQueue = useCaptureQueue();
  const router = useRouter();
  const { eyebrow } = useHeaderEyebrow();

  return (
    <MaterialsScreen
      documents={documents.data?.documents ?? []}
      refreshing={documents.isRefetching}
      onRefresh={() => documents.refetch()}
      eyebrow={eyebrow}
      onBack={() => router.navigate('/actions')}
      queued={captureQueue.entries.filter((entry) => entry.entityId === entityId)}
      onRetryQueued={(id) => captureQueue.retry(id)}
      onDiscardQueued={(id) => captureQueue.remove(id)}
      onOpenDocument={(doc) => {
        if (doc.capture_state === 'needs_info' && doc.needs_info_card_id) {
          router.push({ pathname: '/card/[id]', params: { id: doc.needs_info_card_id } });
          return;
        }
        router.push({ pathname: '/document/[id]', params: { id: doc.id } });
      }}
    />
  );
}
