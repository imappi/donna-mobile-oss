import React from 'react';
import { View } from 'react-native';
import { color, dot } from '../tokens';

/**
 * The status dot — the voice of a row (DESIGN.md §6). Three states only:
 * filled accent = your move; hollow = not blocking you; filled alert =
 * genuine failure. There is no other dot state.
 */
export type DotVoice = 'accent' | 'quiet' | 'alert';

export const Dot = ({ voice, size = dot.size, halo = false }: { voice: DotVoice; size?: number; halo?: boolean }) => (
  <View accessibilityElementsHidden style={{ width: size, height: size }}>
    {halo && voice === 'accent' ? (
      <View
        style={{
          position: 'absolute',
          left: -dot.halo,
          top: -dot.halo,
          width: size + dot.halo * 2,
          height: size + dot.halo * 2,
          borderRadius: size + dot.halo,
          backgroundColor: color.accentWash
        }}
      />
    ) : null}
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: voice === 'accent' ? color.accent : voice === 'alert' ? color.alert : 'transparent',
        borderWidth: voice === 'quiet' ? dot.hollowBorder : 0,
        borderColor: voice === 'quiet' ? color.inkMute : 'transparent'
      }}
    />
  </View>
);
