import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ArtifactConversation,
  ArtifactKind,
  ChatMessage,
  Decision,
  DecisionResult,
  QueueResponse
} from '@core/api';
import { useEntityId, useSession } from './session';
import { applyDecisionResultToQueue } from './queueCache';
import { formatMonth } from '@core/i18n';

/**
 * Server-state hooks. The one rule that matters: after a mutation the
 * cache is updated from the RETURNED state (the receipt's card), never
 * from an optimistic guess — the terminal renders what the backend said.
 */
export const useQueue = () => {
  const { api } = useSession();
  const entityId = useEntityId();
  return useQuery({
    queryKey: ['queue', entityId],
    queryFn: () => api.getQueue(entityId),
    refetchInterval: 20000
  });
};

export const useBusinessSetup = () => {
  const { api, state } = useSession();
  const entityId = useEntityId();
  const entity = state.phase === 'signedIn' ? state.entities.find(item => item.id === entityId) : null;
  return useQuery({ queryKey: ['business-setup', entityId], queryFn: () => api.getBusinessSetup(entityId),
    enabled: entity?.country === 'FI', retry: false });
};

export const useDecide = (cardId: string) => {
  const { api } = useSession();
  const entityId = useEntityId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (decision: Decision) => api.decideQueueCard(entityId, cardId, decision),
    onSuccess: (result: DecisionResult) => {
      queryClient.setQueryData<QueueResponse>(['queue', entityId], (previous) =>
        applyDecisionResultToQueue(previous, result)
      );
      queryClient.invalidateQueries({ queryKey: ['queue', entityId] });
      queryClient.invalidateQueries({ queryKey: ['status', entityId] });
      queryClient.invalidateQueries({ queryKey: ['review', entityId] });
      queryClient.invalidateQueries({ queryKey: ['chat', entityId] });
    }
  });
};

export const useBooksStatus = () => {
  const { api } = useSession();
  const entityId = useEntityId();
  return useQuery({
    queryKey: ['status', entityId],
    queryFn: () => api.getBooksStatus(entityId),
    refetchInterval: 30000
  });
};

export const useDocuments = () => {
  const { api } = useSession();
  const entityId = useEntityId();
  return useQuery({
    queryKey: ['documents', entityId],
    queryFn: () => api.listDocuments(entityId, 50),
    refetchInterval: (query) =>
      query.state.data?.documents.some((d) => d.capture_state === 'received' || d.capture_state === 'processing')
        ? 2500
        : 15000
  });
};

export const useArtifactConversation = (kind: ArtifactKind, artifactId: string) => {
  const { api } = useSession();
  const entityId = useEntityId();
  const queryClient = useQueryClient();
  const queryKey = ['artifact-messages', entityId, kind, artifactId] as const;
  const conversation = useQuery({
    queryKey,
    queryFn: () => api.listArtifactMessages(entityId, kind, artifactId),
    refetchInterval: 10000
  });
  const send = useMutation({
    mutationFn: (text: string) => api.sendArtifactMessage(entityId, kind, artifactId, text),
    onSuccess: (result: { message: ChatMessage; reply?: ChatMessage | null }) => {
      queryClient.setQueryData<ArtifactConversation>(queryKey, (previous) => {
        const incoming = [result.message, result.reply].filter((message): message is ChatMessage => Boolean(message));
        const known = new Set(previous?.messages.map((message) => message.id) ?? []);
        return {
          artifact_kind: kind,
          artifact_id: artifactId,
          messages: [...(previous?.messages ?? []), ...incoming.filter((message) => !known.has(message.id))],
          receipts: previous?.receipts ?? []
        };
      });
    }
  });
  return { conversation, send };
};

export const useActivity = () => {
  const { api } = useSession();
  const entityId = useEntityId();
  return useQuery({
    queryKey: ['activity', entityId],
    queryFn: () => api.listActivity(entityId),
    refetchInterval: 30000
  });
};

/**
 * The header eyebrow (shell v1): entity · current period, straight from
 * session + the cached status read. `multiEntity` tells the route whether
 * the eyebrow doubles as the switcher trigger.
 */
export const useHeaderEyebrow = () => {
  const { state } = useSession();
  const entityId = useEntityId();
  const status = useBooksStatus();
  const entities = state.phase === 'signedIn' ? state.entities : [];
  const entityName = entities.find((entity) => entity.id === entityId)?.display_name ?? null;
  const currentPeriod = status.data?.periods?.[0];
  const period = currentPeriod ? formatMonth(currentPeriod.period_start.slice(0, 7), true) : null;
  const eyebrow = [entityName, period].filter(Boolean).join(' · ') || null;
  return { eyebrow, multiEntity: entities.length > 1 };
};
