import React from 'react';
import { View } from 'react-native';
import { color, radius, refinement, space, stream } from '../tokens';
import { Txt } from './Txt';

/**
 * A quiet state chip. The tone rule is the accent-vs-alarm rule
 * (DESIGN.md §3): accent = your move, alert = genuine failure, quiet =
 * everything else. `machine` renders identity in the machine voice on the
 * 4% ink wash (identity is ink, never hue).
 */
export type StatusPillTone = 'accent' | 'alert' | 'quiet' | 'machine';

const STYLES: Record<StatusPillTone, { bg: string; fg: 'accent' | 'alert' | 'soft' | 'ink' }> = {
  accent: { bg: color.accentWash, fg: 'accent' },
  alert: { bg: color.alertWash, fg: 'alert' },
  quiet: { bg: color.inkWash, fg: 'soft' },
  machine: { bg: color.inkWash, fg: 'ink' }
};

export const StatusPill = ({
  label,
  tone = 'quiet',
  detail = false,
  allowWrap = false
}: {
  label: string;
  tone?: StatusPillTone;
  /** Stream cards allow a two-line pill at large Dynamic Type without moving it from the right edge. */
  allowWrap?: boolean;
  detail?: boolean;
}) => {
  const s = STYLES[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        maxWidth: allowWrap ? stream.accessibilityStateWidth : undefined,
        backgroundColor: tone === 'machine' ? 'transparent' : s.bg,
        borderWidth: tone === 'machine' ? 1 : 0,
        borderColor: color.rule,
        minHeight: detail ? refinement.detailPillHeight : refinement.pillHeight,
        justifyContent: 'center',
        borderRadius: radius.pill,
        paddingHorizontal: space.sm,
        paddingVertical: refinement.pillPaddingY
      }}
    >
      <Txt
        v={detail ? 'meta' : 'pill'}
        tone={tone === 'machine' ? 'mute' : s.fg}
        style={tone === 'accent' ? { color: refinement.accentInk } : undefined}
        numberOfLines={allowWrap ? 2 : 1}
        align={allowWrap ? 'center' : undefined}
      >
        {label}
      </Txt>
    </View>
  );
};
