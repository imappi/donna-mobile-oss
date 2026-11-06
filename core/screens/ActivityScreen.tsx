import React from 'react';
import { View } from 'react-native';
import type { ActivityEvent } from '../api';
import { EmptyState, ListRow, Screen } from '../design';
import { formatDate, t } from '../i18n';

/**
 * ACTIVITY — what happened, newest first. Nudges deep-link into QUEUE.
 * Read-only by design: acting happens where the work surface is.
 */
export type ActivityScreenProps = {
  events: ActivityEvent[];
  onOpen: (event: ActivityEvent) => void;
  onBack?: () => void;
};

export const ActivityScreen = ({ events, onOpen, onBack }: ActivityScreenProps) => (
  <Screen title={t('activity.title')} scroll onBack={onBack}>
    <View>
      {events.length === 0 ? <EmptyState text={t('activity.empty')} /> : null}
      {events.map((event) => (
        <ListRow
          key={event.id}
          dot={event.kind === 'card_created' ? 'accent' : 'quiet'}
          title={event.title}
          subtitle={event.body ?? null}
          trailingMeta={formatDate(event.at.slice(0, 10))}
          onPress={event.deep_link ? () => onOpen(event) : undefined}
        />
      ))}
    </View>
  </Screen>
);
