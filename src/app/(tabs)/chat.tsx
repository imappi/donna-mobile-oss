import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { AppliableChatAction, ChatMessage } from '@core/api';
import { useToast } from '@core/design';
import { t } from '@core/i18n';
import { ChatScreen } from '@core/screens/ChatScreen';
import { shell } from '@/shell';
import { useEntityId, useSession } from '@/state/session';

export default function ChatRoute() {
  const { api, state } = useSession();
  const entityId = useEntityId();
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const entityName =
    state.phase === 'signedIn'
      ? (state.entities.find((entity) => entity.id === entityId)?.display_name ?? '')
      : '';

  const chat = useQuery({
    queryKey: ['chat', entityId],
    queryFn: () => api.listChatMessages(entityId),
    refetchInterval: 15000
  });

  const send = useMutation({
    mutationFn: (text: string) => api.sendChatMessage(entityId, text),
    onMutate: async (text) => {
      // Show the owner's words immediately; the server's copy replaces
      // this on success (the terminal renders returned state).
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        author: 'owner',
        text,
        at: new Date().toISOString()
      };
      queryClient.setQueryData<{ messages: ChatMessage[] }>(['chat', entityId], (prev) => ({
        messages: [...(prev?.messages ?? []), optimistic]
      }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat', entityId] }),
    onError: (e) => {
      queryClient.invalidateQueries({ queryKey: ['chat', entityId] });
      toast.show(e instanceof Error ? e.message : t('common.error_generic'));
    }
  });

  const apply = useMutation({
    mutationFn: (action: AppliableChatAction) => api.applyChatAction(entityId, action.id),
    onSuccess: (result) => {
      // Render the returned state; an apply can mint or change a card.
      queryClient.invalidateQueries({ queryKey: ['chat', entityId] });
      queryClient.invalidateQueries({ queryKey: ['queue', entityId] });
      queryClient.invalidateQueries({ queryKey: ['status', entityId] });
      queryClient.invalidateQueries({ queryKey: ['review', entityId] });
      queryClient.invalidateQueries({ queryKey: ['card', entityId] });
      queryClient.invalidateQueries({ queryKey: ['artifact-messages', entityId] });
      if (result.receipt) toast.show(result.receipt.summary);
      else if (!result.applied) toast.show(t('card.alreadyHandled'));
    },
    onError: (e) => toast.show(e instanceof Error ? e.message : t('common.error_generic'))
  });

  return (
    <ChatScreen
      messages={chat.data?.messages ?? []}
      sending={send.isPending}
      identity={{
        name: shell.brandName,
        detail: t('chat.workingIn', { entity: entityName }),
        image: shell.mascot
      }}
      loading={chat.isLoading}
      failed={chat.isError}
      onRetry={() => chat.refetch()}
      onBack={() => router.navigate('/actions')}
      applyingActionId={apply.isPending ? apply.variables?.id : null}
      onSend={(text) => send.mutate(text)}
      onApplyAction={(action) => apply.mutate(action)}
    />
  );
}
