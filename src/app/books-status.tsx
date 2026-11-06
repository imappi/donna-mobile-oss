import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { StatusScreen } from '@core/screens/StatusScreen';
import { useBooksStatus } from '@/state/hooks';
import { useSession, useEntityId } from '@/state/session';
import { shell } from '@/shell';

const SignedInStatus = () => {
  const status = useBooksStatus();
  const router = useRouter();
  const { state } = useSession();
  const entityId = useEntityId();
  const entityName = state.phase === 'signedIn' ? state.entities.find(entity => entity.id === entityId)?.display_name ?? '' : '';
  return <StatusScreen status={status.data} entityName={entityName} image={shell.mascot}
    refreshing={status.isRefetching} failed={status.isError} onRefresh={() => status.refetch()}
    onBack={() => router.back()} onChat={() => router.navigate('/chat')} onTaxes={() => router.push('/taxes')}
    onMonth={period => router.push({ pathname: '/month', params: { period } })}
    onOpenBlocker={(_period, blocker) => {
      if (blocker.card_ids?.length === 1) router.push({ pathname: '/card/[id]', params: { id: blocker.card_ids[0] } });
      else router.navigate('/actions');
    }} />;
};
export default function StatusRoute() {
  const { state } = useSession();
  if (state.phase === 'loading') return null;
  if (state.phase === 'locked') return <Redirect href="/unlock" />;
  if (state.phase === 'signedOut') return <Redirect href="/onboarding/phone" />;
  return <SignedInStatus />;
}
