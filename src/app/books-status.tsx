import React from 'react';
import { useRouter } from 'expo-router';
import { StatusScreen } from '@core/screens/StatusScreen';
import { useBooksStatus } from '@/state/hooks';
import { EntityRoute } from '@/state/EntityRoute';
import { useSession, useEntityId } from '@/state/session';
import { shell } from '@/shell';
import { backOrBooks } from '@/state/backOrBooks';

const SignedInStatus = () => {
  const status = useBooksStatus();
  const router = useRouter();
  const { state } = useSession();
  const entityId = useEntityId();
  const entityName = state.phase === 'signedIn' ? state.entities.find(entity => entity.id === entityId)?.display_name ?? '' : '';
  return <StatusScreen status={status.data} entityName={entityName} image={shell.mascot}
    refreshing={status.isRefetching} failed={status.isError} onRefresh={() => status.refetch()}
    onBack={() => backOrBooks(router)} onChat={() => router.navigate('/chat')} onTaxes={() => router.push('/taxes')}
    onMonth={period => router.push({ pathname: '/month', params: { period } })}
    onOpenBlocker={(_period, blocker) => {
      if (blocker.card_ids?.length === 1) router.push({ pathname: '/card/[id]', params: { id: blocker.card_ids[0] } });
      else router.navigate('/actions');
    }} />;
};
export default function StatusRoute() {
  return <EntityRoute><SignedInStatus /></EntityRoute>;
}
