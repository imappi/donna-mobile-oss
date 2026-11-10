import React from 'react';
import { Redirect, type Href } from 'expo-router';
import { entityGate } from './entityGate';
import { useSession } from './session';

/**
 * The one guard for routes that need the active entity (see entityGate.ts).
 * `noEntity` is where a signed-in principal without a matching entity goes;
 * Books is the default, the Books layout itself sends them to the picker.
 */
export const EntityRoute = ({ children, noEntity = '/actions' }: { children: React.ReactNode; noEntity?: Href }) => {
  const { state } = useSession();
  const gate = entityGate(state);
  if (gate === 'wait') return null;
  if (gate === 'noEntity') return <Redirect href={noEntity} />;
  if (gate !== 'open') return <Redirect href={gate} />;
  return <>{children}</>;
};
