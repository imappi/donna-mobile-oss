import React from 'react';
import { Pressable, View } from 'react-native';
import { color, row, shellGeometry, shellType, space } from '../tokens';
import { Dot, type DotVoice } from './Dot';
import { useShellOverlayAccessibilityHidden } from './Screen';
import { Txt, type TxtTone } from './Txt';

/**
 * The list grammar's row (DESIGN.md §6): edge-anchored dot · content ·
 * right-anchored figures. Hairline under each row; the primary cell
 * ellipsizes, figures never do. Identity/meta stay ink — the dot alone
 * carries the voice. Press feedback is the card-white lift the desktop
 * uses for its active row.
 */
export type ListRowProps = {
  dot: DotVoice | 'none';
  title: string;
  subtitle?: string | null;
  /** Right column, top line — usually the amount (tabular). */
  trailing?: string | null;
  /** Right column, second line — date or state, muted. */
  trailingMeta?: string | null;
  /** Voice for the state line (shell v1): accent = needs you, alert = failure; default mute. */
  trailingTone?: TxtTone;
  onPress?: () => void;
  /** Indent one step — group members (decision-grain grouping). */
  inset?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export const ListRow = ({
  dot: voice,
  title,
  subtitle,
  trailing,
  trailingMeta,
  trailingTone = 'mute',
  onPress,
  inset,
  accessibilityLabel,
  testID
}: ListRowProps) => {
  const shellOverlayOpen = useShellOverlayAccessibilityHidden();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessible={!shellOverlayOpen}
      focusable={!shellOverlayOpen}
      importantForAccessibility={shellOverlayOpen ? 'no-hide-descendants' : 'auto'}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: shellGeometry.list.columnGap,
        minHeight: row.minHeight,
        paddingVertical: row.paddingY,
        paddingLeft: inset ? row.paddingLeft + space.md : row.paddingLeft,
        paddingRight: row.paddingRight,
        borderBottomWidth: 1,
        borderBottomColor: color.ruleSoft,
        backgroundColor: pressed ? color.paperDeep : color.card
      })}
    >
      <View style={{ width: shellGeometry.list.dotSlot, alignItems: 'center' }}>
        {voice !== 'none' ? <Dot voice={voice} /> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt
          v="body"
          em
          numberOfLines={1}
          style={{ lineHeight: shellType.rowTitleLine, letterSpacing: shellType.rowTitleTracking }}
        >
          {title}
        </Txt>
        {subtitle ? (
          <Txt v="meta" tone="mute" numberOfLines={1} style={{ marginTop: shellGeometry.list.subtitleGap }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {trailing || trailingMeta ? (
        <View
          style={{
            minWidth: shellGeometry.list.trailingMinWidth,
            marginLeft: shellGeometry.list.trailingMarginLeft,
            alignItems: 'flex-end',
            gap: shellGeometry.list.trailingGap
          }}
        >
          {trailing ? (
            <Txt
              v="body"
              em
              tabular
              align="right"
              style={{ lineHeight: shellType.amountLine, letterSpacing: shellType.amountTracking }}
            >
              {trailing}
            </Txt>
          ) : null}
          {trailingMeta ? (
            <Txt v="meta" tone={trailingTone} tabular align="right">
              {trailingMeta}
            </Txt>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
};
