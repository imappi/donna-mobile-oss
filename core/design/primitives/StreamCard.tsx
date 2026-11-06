import { WorkingIcon } from './WorkingIcon';
import type Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { Pressable, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { color, radius, shadow, stream } from '../tokens';
import { StatusPill, type StatusPillTone } from './StatusPill';
import { Txt } from './Txt';

export type StreamCardProps = {
  iconName: keyof typeof Feather.glyphMap;
  iconTone: StreamIconTone;
  title: string;
  meta: string;
  amount?: string | null;
  stateLabel: string;
  stateTone: Exclude<StatusPillTone, 'machine'>;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

export type StreamIconTone = 'gold' | 'peach' | 'rose';

const ICON_GROUND: Record<StreamIconTone, string> = {
  gold: color.iconGold,
  peach: color.iconPeach,
  rose: color.iconRose
};

const ICON_TILE: ViewStyle = {
  width: stream.iconSize,
  height: stream.iconSize,
  borderRadius: stream.iconRadius,
  alignItems: 'center',
  justifyContent: 'center'
};

/**
 * Shell v2's one primary-list item. Type gets only a quiet sunset-pastel tile;
 * persisted state gets the only pill. Amount is part of the factual metadata
 * so state keeps one predictable, vertically-centred home at every text size.
 */
export const StreamCard = ({
  iconName,
  iconTone,
  title,
  meta,
  amount,
  stateLabel,
  stateTone,
  onPress,
  accessibilityLabel,
  testID
}: StreamCardProps) => {
  const { fontScale } = useWindowDimensions();
  const expandedType = fontScale > stream.accessibilityExpandedThreshold;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={({ pressed }) => ({
        minHeight: stream.cardMinHeight,
        marginBottom: stream.cardGap,
        padding: stream.cardPadding,
        borderRadius: radius.streamCard,
        borderWidth: 0,
        borderColor: color.ruleSoft,
        backgroundColor: pressed ? color.paperDeep : color.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: stream.cardColumnGap,
        ...shadow.streamCard
      })}
    >
      <View style={[ICON_TILE, { backgroundColor: ICON_GROUND[iconTone] }]}>
        <WorkingIcon name={iconName} size={stream.iconGlyph} color={color.ink} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt v="itemTitle">
          {title}
        </Txt>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: stream.metaColumnGap,
          rowGap: stream.metaRowGap,
          marginTop: stream.copyMetaGap
        }}>
          <Txt v="meta" tone="mute" tabular>{[meta, amount].filter(Boolean).join(' · ')}</Txt>
        </View>
      </View>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <StatusPill label={stateLabel} tone={stateTone} allowWrap={expandedType} />
      </View>
    </Pressable>
  );
};
