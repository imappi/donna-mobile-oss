import React from 'react';
import { View } from 'react-native';
import { stream } from '../tokens';
import { Txt } from './Txt';

/** A factual calendar boundary for the stream — never a workflow lane. */
export const PeriodHeader = ({ label }: { label: string }) => (
  <View
    accessibilityRole="header"
    style={{
      minHeight: stream.periodHeight,
      paddingTop: stream.periodTopInset,
      justifyContent: 'flex-start',
      paddingHorizontal: stream.periodPaddingX,
      paddingBottom: stream.periodPaddingBottom,
      backgroundColor: 'transparent'
    }}
  >
    <Txt v="period" tone="mute">
      {label}
    </Txt>
  </View>
);
