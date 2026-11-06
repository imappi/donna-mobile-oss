import React from 'react';
import { View, type ViewProps } from 'react-native';
import { space } from '../tokens';

/**
 * Layout primitives — the only sanctioned layout glue in screens (the
 * ESLint guardrail bans inline style objects there). Gaps come from the
 * spacing scale by name; anything these cannot express is a primitive
 * extension, flagged to Kari.
 */
export type SpaceKey = keyof typeof space;

export type StackProps = ViewProps & {
  gap?: SpaceKey;
  /** Horizontal inset from the spacing scale (screenX for screen blocks). */
  padX?: SpaceKey;
  padY?: SpaceKey;
  grow?: boolean;
  center?: boolean;
  align?: 'center' | 'flex-start' | 'flex-end' | 'stretch';
};

export const Stack = ({ gap, padX, padY, grow, center, align, style, ...rest }: StackProps) => (
  <View
    {...rest}
    style={[
      {
        gap: gap ? space[gap] : undefined,
        paddingHorizontal: padX ? space[padX] : undefined,
        paddingVertical: padY ? space[padY] : undefined,
        flex: grow ? 1 : undefined,
        justifyContent: center ? 'center' : undefined,
        alignItems: align
      },
      style
    ]}
  />
);

export type RowProps = ViewProps & {
  gap?: SpaceKey;
  wrap?: boolean;
  between?: boolean;
  align?: 'center' | 'flex-start' | 'flex-end';
  grow?: boolean;
};

export const Row = ({ gap, wrap, between, align = 'center', grow, style, ...rest }: RowProps) => (
  <View
    {...rest}
    style={[
      {
        flexDirection: 'row',
        alignItems: align,
        gap: gap ? space[gap] : undefined,
        flexWrap: wrap ? 'wrap' : undefined,
        justifyContent: between ? 'space-between' : undefined,
        flex: grow ? 1 : undefined
      },
      style
    ]}
  />
);
