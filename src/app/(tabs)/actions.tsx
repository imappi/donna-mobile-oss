import React, { useCallback, useMemo } from 'react';
import type { Doc, QueueCard } from '@core/api';
import type { QueuedCapture } from '@core/capture/queue';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@core/design';
import { t } from '@core/i18n';
import { HomeScreen } from '@core/screens/HomeScreen';
import { useCaptureQueue } from '@/state/captureQueue';
import { useCaptureActions } from '@/state/captureActions';
import { useBusinessSetup, useDocuments, useHeaderEyebrow, useQueue } from '@/state/hooks';
import { useEntityId, useSession } from '@/state/session';

export default function ActionsRoute() {
  const queue = useQueue();
  const documents = useDocuments();
  const captureQueue = useCaptureQueue();
  const { snapReceipt, addFile } = useCaptureActions();
  const entityId = useEntityId();
  const setup = useBusinessSetup();
  const { api, state } = useSession();
  const client = useQueryClient();
  const toast = useToast();
  const defer = useMutation({ mutationFn: (id: string) => api.updateBusinessSetup(id, { type: 'defer' }),
    onSuccess: (result, id) => client.setQueryData(['business-setup', id], result.setup),
    onError: () => toast.show(t('setup.unavailable')) });
  const router = useRouter();
  const { eyebrow } = useHeaderEyebrow();
  const queued = useMemo(
    () => captureQueue.entries.filter((entry) => entry.entityId === entityId),
    [captureQueue.entries, entityId]
  );
  const onOpenCard = useCallback(
    (card: QueueCard) => router.push({ pathname: '/card/[id]', params: { id: card.id } }),
    [router]
  );
  const onOpenDocument = useCallback(
    (document: Doc) => {
      if (document.capture_state === 'needs_info' && document.needs_info_card_id) {
        router.push({ pathname: '/card/[id]', params: { id: document.needs_info_card_id } });
        return;
      }
      router.push({ pathname: '/document/[id]', params: { id: document.id } });
    },
    [router]
  );
  const onOpenQueuedCapture = useCallback((_capture: QueuedCapture) => router.push('/materials'), [router]);
  const onRefresh = useCallback(() => {
    queue.refetch();
    documents.refetch();
    setup.refetch();
  }, [documents, queue, setup]);
  return (
    <HomeScreen
      queue={queue.data}
      documents={documents.data?.documents ?? []}
      queued={queued}
      eyebrow={eyebrow}
      loading={queue.isLoading || documents.isLoading}
      loadFailed={queue.isError || documents.isError}
      refreshing={queue.isRefetching || documents.isRefetching}
      onRefresh={onRefresh}
      onOpenCard={onOpenCard}
      onOpenDocument={onOpenDocument}
      onOpenQueuedCapture={onOpenQueuedCapture}
      onSnapReceipt={snapReceipt}
      onAddFile={addFile}
      ownerName={state.phase === 'signedIn' && state.entities.find(entity => entity.id === entityId)?.business_profile
        ? state.principal.display_name : undefined}
      setup={setup.data}
      setupBusy={defer.isPending}
      onOpenSetup={() => router.push('/business-setup')}
      onDeferSetup={() => defer.mutate(entityId)}
    />
  );
}
