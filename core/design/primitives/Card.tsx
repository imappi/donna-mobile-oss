import React from 'react';
import { View, type ViewProps } from 'react-native';
import { color, radius, shadow, space } from '../tokens';

/**
 * A pure-white container that pops off paper (DESIGN.md §3) — border plus
 * a whisper of shadow, never an outline on a same-color ground.
 */
export const Card = ({ style, children, ...rest }: ViewProps) => (
  <View
    {...rest}
    style={[
      {
        backgroundColor: color.card,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: color.ruleSoft,
        padding: space.rowX,
        ...shadow.card
      },
      style
    ]}
  >
    {children}
  </View>
);
