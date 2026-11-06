import React from 'react';
import { Pressable, View } from 'react-native';
import { color, dot, row, shellGeometry, shellType, weight } from '../tokens';
import { Dot, type DotVoice } from './Dot';
import { Txt } from './Txt';

/**
 * Bucket heading (DESIGN.md §6): dot · plain label · muted tabular count.
 * Labels answer "whose move?" in the owner's words and render in INK; the
 * dot carries the voice — only the "needs you" section speaks accent.
 * Paper background so it holds up as a sticky header.
 */
export type SectionHeaderProps = {
  label: string;
  count?: number;
  voice?: DotVoice;
  /** Accepted for source compatibility; the fixed-height shell-v1 grammar spaces all headers equally. */
  first?: boolean;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  toggleHint?: { show: string; hide: string };
};

export const SectionHeader = ({
  label,
  count,
  voice = 'quiet',
  collapsible,
  expanded = true,
  onToggle,
  toggleHint
}: SectionHeaderProps) => {
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: shellGeometry.list.columnGap,
        paddingLeft: row.paddingLeft,
        paddingRight: row.paddingRight,
        // Shell v1: fixed-height headers in the 78pt list grammar; they sit
        // on the opaque information surface, so no fill of their own.
        minHeight: row.headerHeight,
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: color.ruleSoft
      }}
    >
      <View style={{ width: shellGeometry.list.dotSlot, alignItems: 'center' }}>
        <Dot voice={voice} size={dot.headerSize} />
      </View>
      <Txt v="meta" style={{ lineHeight: shellType.sectionLine, fontWeight: weight.heading }}>
        {label}
      </Txt>
      {count != null ? (
        <Txt v="meta" tone="mute" tabular style={{ marginLeft: 'auto' }}>
          {count}
        </Txt>
      ) : null}
      {collapsible && toggleHint ? (
        <Txt v="meta" tone="mute" style={count == null ? { marginLeft: 'auto' } : undefined}>
          {expanded ? toggleHint.hide : toggleHint.show}
        </Txt>
      ) : null}
    </View>
  );
  if (!collapsible) return inner;
  return (
    <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded }}>
      {inner}
    </Pressable>
  );
};
