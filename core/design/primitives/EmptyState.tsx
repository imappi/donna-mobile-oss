import React from 'react';
import { View } from 'react-native';
import { row, space } from '../tokens';
import { Button } from './Button';
import { Txt } from './Txt';

/**
 * Absence-of-data, stated in the same inset and type as a real row
 * (DESIGN.md §6) — not a card, not an illustration, not a celebration.
 */
export const EmptyState = ({
  text,
  title,
  actionTitle,
  onAction
}: {
  text: string;
  title?: string;
  actionTitle?: string;
  onAction?: () => void;
}) => (
  <View style={{ paddingHorizontal: row.paddingX, paddingVertical: space.lg, gap: space.md }}>
    {title ? (
      <Txt v="heading" accessibilityRole="header">
        {title}
      </Txt>
    ) : null}
    <Txt v={title ? 'body' : 'sm'} tone={title ? 'soft' : 'mute'}>
      {text}
    </Txt>
    {actionTitle && onAction ? (
      <Button title={actionTitle} kind="primary" size="large" onPress={onAction} />
    ) : null}
  </View>
);
