import { shell } from '@/shell';
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppliableChatAction } from '@core/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useToast } from '@core/design';
import { t } from '@core/i18n';
import { DocumentDetailScreen } from '@core/screens/DocumentDetailScreen';
import { useArtifactConversation } from '@/state/hooks';
import { EntityRoute } from '@/state/EntityRoute';
import { useEntityId, useSession } from '@/state/session';
import { backOrBooks } from '@/state/backOrBooks';

const SignedInDocumentRoute = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { api } = useSession();
  const entityId = useEntityId();
  const toast = useToast();
  const queryClient = useQueryClient();
  const document = useQuery({
    queryKey: ['document', entityId, id],
    queryFn: () => api.getDocument(entityId, id),
    refetchInterval: (query) =>
      query.state.data?.capture_state === 'received' || query.state.data?.capture_state === 'processing'
        ? 2500
        : 10000
  });
  const artifact = useArtifactConversation('document', id);
  const retry = useMutation({
    mutationFn: () => api.retryDocument(entityId, id),
    onSuccess: () => {
      document.refetch();
      queryClient.invalidateQueries({ queryKey: ['documents', entityId] });
      toast.show(t('common.retry'));
    },
    onError: (error) => toast.show(error instanceof Error ? error.message : t('common.error_generic'))
  });
  const resolveDuplicate = useMutation({
    mutationFn: (action: 'create' | 'replace' | 'cancel') => api.resolveDuplicate(entityId, id, action),
    onSuccess: (_result, action) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityId] });
      if (action === 'cancel') {
        backOrBooks(router);
        return;
      }
      document.refetch();
    },
    onError: (error) => toast.show(error instanceof Error ? error.message : t('common.error_generic'))
  });
  const applyAction = useMutation({
    mutationFn: (action: AppliableChatAction) => api.applyChatAction(entityId, action.id),
    onSuccess: (result) => {
      artifact.conversation.refetch();
      document.refetch();
      if (result.receipt) toast.show(result.receipt.summary);
    },
    onError: (error) => toast.show(error instanceof Error ? error.message : t('common.error_generic'))
  });

  if (!document.data) return null;

  return (
    <DocumentDetailScreen
      image={shell.mascot}
      document={document.data}
      messages={artifact.conversation.data?.messages ?? []}
      receipts={artifact.conversation.data?.receipts ?? []}
      sending={artifact.send.isPending}
      retrying={retry.isPending}
      resolvingDuplicateAction={resolveDuplicate.isPending ? resolveDuplicate.variables ?? null : null}
      applyingActionId={applyAction.isPending ? applyAction.variables?.id ?? null : null}
      onSend={(text) =>
        artifact.send.mutate(text, {
          onError: (error) => toast.show(error instanceof Error ? error.message : t('common.error_generic'))
        })
      }
      onRetry={() => retry.mutate()}
      onResolveDuplicate={(action) => resolveDuplicate.mutate(action)}
      onApplyAction={(action) => applyAction.mutate(action)}
      onBack={() => backOrBooks(router)}
    />
  );
};

export default function DocumentRoute() {
  return <EntityRoute><SignedInDocumentRoute /></EntityRoute>;
}
