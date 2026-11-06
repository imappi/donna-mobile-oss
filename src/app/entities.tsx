import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { EntitiesScreen } from '@core/screens/EntitiesScreen';
import { useSession } from '@/state/session';

export default function EntitiesRoute() {
  const { state, switchEntity } = useSession();
  const router = useRouter();
  if (state.phase !== 'signedIn') return <Redirect href="/" />;
  return (
    <EntitiesScreen
      entities={state.entities}
      activeEntityId={state.entityId}
      onPick={(entityId) => {
        switchEntity(entityId);
        router.back();
      }}
      onBack={() => router.back()}
    />
  );
}
