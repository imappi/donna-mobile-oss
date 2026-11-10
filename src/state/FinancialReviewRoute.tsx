import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FinancialReviewScreen } from '@core/screens/FinancialReviewScreen';
import { EntityRoute } from './EntityRoute';
import { useEntityId, useSession } from './session';
import { shell } from '@/shell';
import { backOrBooks } from './backOrBooks';

const SignedInReview = ({ kind }: { kind: 'taxes' | 'month' }) => {
  const { api, state } = useSession();
  const entityId = useEntityId();
  const router = useRouter();
  const { period } = useLocalSearchParams<{ period?: string }>();
  const review = useQuery({ queryKey: ['review', entityId, kind, period], queryFn: () => api.getFinancialReview(entityId, kind, period), retry: false });
  const entityName = state.phase === 'signedIn' ? state.entities.find(entity => entity.id === entityId)?.display_name ?? '' : '';
  const onChat = () => router.navigate('/chat');
  const onRow = (id: string) => router.push({ pathname: '/card/[id]', params: { id } });
  return <FinancialReviewScreen review={review.data} kind={kind} entityName={entityName} image={shell.mascot}
    failed={review.isError} refreshing={review.isRefetching} onRefresh={() => review.refetch()} onBack={() => backOrBooks(router)} onChat={onChat}
    onRow={onRow} onAction={action => { if (action.kind === 'queue_card' && action.card_id) onRow(action.card_id); else onChat(); }} />;
};
export const FinancialReviewRoute = ({ kind }: { kind: 'taxes' | 'month' }) => {
  return <EntityRoute><SignedInReview kind={kind} /></EntityRoute>;
};
