import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { EntitiesScreen } from '@core/screens/EntitiesScreen';
import { entityGate } from '@/state/entityGate';
import { useSession } from '@/state/session';
import { backOrBooks } from '@/state/backOrBooks';

export default function EntitiesRoute() {
  const { state, switchEntity } = useSession();
  const router = useRouter();
  // The picker needs a session but not a valid active entity: it is where
  // the Books layout sends a principal whose active entity is missing.
  const gate = entityGate(state);
  if (gate === 'wait') return null;
  if (gate === '/unlock' || gate === '/onboarding/phone') return <Redirect href={gate} />;
  if (state.phase !== 'signedIn') return null;
  return (
    <EntitiesScreen
      entities={state.entities}
      activeEntityId={state.entityId}
      onPick={(entityId) => {
        switchEntity(entityId);
        backOrBooks(router);
      }}
      onBack={() => backOrBooks(router)}
    />
  );
}
