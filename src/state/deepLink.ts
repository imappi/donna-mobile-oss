import type { Href } from 'expo-router';
import type { ActivityEvent } from '@core/api';

/**
 * One mapping from the contract's deep_link shape to an app route —
 * shared by the Activity list and notification taps so the two can
 * never drift. A card id always wins (the work surface); otherwise the
 * named screen; anything unknown lands safely on Books (`/actions` remains
 * its compatibility route).
 */
export type DeepLink = NonNullable<ActivityEvent['deep_link']>;

export const hrefForDeepLink = (link: DeepLink | null | undefined): Href | null => {
  if (!link) return null;
  if (link.card_id) return { pathname: '/card/[id]', params: { id: link.card_id } };
  if (link.screen === 'capture') return '/actions';
  if (link.screen === 'status') return '/books-status';
  return '/actions';
};
