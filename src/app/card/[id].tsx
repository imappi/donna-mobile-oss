import { shell } from '@/shell';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppliableChatAction, Receipt } from '@core/api';
import { useToast } from '@core/design';
import { t } from '@core/i18n';
import { CardDetailScreen } from '@core/screens/CardDetailScreen';
import { useCaptureQueue } from '@/state/captureQueue';
import { useArtifactConversation, useDecide } from '@/state/hooks';
import { useEntityId, useSession } from '@/state/session';

const SignedInCardRoute = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { api } = useSession();
  const entityId = useEntityId();
  const captureQueue = useCaptureQueue();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [attaching, setAttaching] = useState(false);

  const card = useQuery({
    queryKey: ['card', entityId, id],
    queryFn: () => api.getQueueCard(entityId, id),
    refetchInterval: 10000
  });
  const decide = useDecide(id);
  const artifact = useArtifactConversation('queue_card', id);
  const applyAction = useMutation({
    mutationFn: (action: AppliableChatAction) => api.applyChatAction(entityId, action.id),
    onSuccess: (result) => {
      artifact.conversation.refetch();
      card.refetch();
      queryClient.invalidateQueries({ queryKey: ['queue', entityId] });
      queryClient.invalidateQueries({ queryKey: ['chat', entityId] });
      queryClient.invalidateQueries({ queryKey: ['status', entityId] });
      queryClient.invalidateQueries({ queryKey: ['review', entityId] });
      if (result.receipt) toast.show(result.receipt.summary);
    },
    onError: (e) => toast.show(e instanceof Error ? e.message : t('common.error_generic'))
  });

  if (!card.data) return null;

  const onDecide = (decision: Parameters<typeof decide.mutate>[0]) => {
    decide.mutate(decision, {
      onSuccess: (result) => {
        card.refetch();
        artifact.conversation.refetch();
        if (result.receipt) {
          setReceipt(result.receipt);
          toast.show(result.receipt.summary);
        } else if (!result.applied) {
          toast.show(t('card.alreadyHandled'));
        }
      },
      onError: (e) => toast.show(e instanceof Error ? e.message : t('common.error_generic'))
    });
  };

  const attachPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setAttaching(true);
    try {
      const added = await captureQueue.add(
        {
          uri: asset.uri,
          filename: asset.fileName ?? `receipt-${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? 'image/jpeg',
          size: asset.fileSize ?? 0,
          source: 'photo_library'
        },
        { answersCardId: id }
      );
      if (added.status === 'queued') toast.show(t('capture.queuedOffline'));
      if (added.status === 'blocked') toast.show(added.error ?? t('common.error_generic'));
      card.refetch();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : t('common.error_generic'));
    } finally {
      setAttaching(false);
    }
  };

  return (
    <CardDetailScreen
      image={shell.mascot}
      card={card.data}
      messages={artifact.conversation.data?.messages ?? []}
      deciding={decide.isPending}
      sending={artifact.send.isPending}
      receipt={receipt}
      receipts={artifact.conversation.data?.receipts ?? []}
      onDecide={onDecide}
      onSend={(text) =>
        artifact.send.mutate(text, {
          onError: (e) => toast.show(e instanceof Error ? e.message : t('common.error_generic'))
        })
      }
      onAttachPhoto={card.data.ask?.allows_documents ? attachPhoto : undefined}
      attaching={attaching}
      applyingActionId={applyAction.isPending ? applyAction.variables?.id ?? null : null}
      onApplyAction={(action) => applyAction.mutate(action)}
      onBack={() => router.back()}
    />
  );
};

export default function CardRoute() {
  const { state } = useSession();
  if (state.phase === 'loading') return null;
  if (state.phase === 'locked') return <Redirect href="/unlock" />;
  if (state.phase === 'signedOut') return <Redirect href="/onboarding/phone" />;
  return <SignedInCardRoute />;
}
