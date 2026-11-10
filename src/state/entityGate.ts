import type { SessionState } from './session';

/**
 * Where a route that needs the active entity goes for each session state.
 * Every such route renders through `EntityRoute` (src/state/EntityRoute.tsx),
 * so a cold deep link never reaches `useEntityId` before the session is
 * restored, while locked, signed out, or without a matching entity.
 *
 * - `wait`: the session is still restoring — render nothing yet.
 * - `open`: signed in and the active entity is one of the principal's books.
 */
export type EntityGate = 'wait' | 'open' | '/unlock' | '/onboarding/phone' | 'noEntity';

export const entityGate = (state: SessionState): EntityGate => {
  if (state.phase === 'loading') return 'wait';
  if (state.phase === 'locked') return '/unlock';
  if (state.phase !== 'signedIn') return '/onboarding/phone';
  return state.entities.some((entity) => entity.id === state.entityId) ? 'open' : 'noEntity';
};
