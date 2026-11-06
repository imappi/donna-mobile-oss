import React from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { color, icon } from '../tokens';

/** Exact 1.8px-stroke paths supplied in the handoff, shared on native and web. */
export const OnboardingIcon = ({ name, size = icon.size, ink = color.ink }: {
  name: 'microphone' | 'pencil' | 'checkmark' | 'scan-outline'; size?: number; ink?: string;
}) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ink}
  strokeWidth={icon.stroke} strokeLinecap="round" strokeLinejoin="round"
  {...(Platform.OS === 'web' ? { 'aria-hidden': true as const } : { accessible: false })}>
  {name === 'microphone' ? <><Rect x="9" y="3" width="6" height="11" rx="3" />
    <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>
    : name === 'pencil' ? <Path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    : name === 'scan-outline' ? <><Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><Circle cx="12" cy="12" r="3" /></>
    : <Path d="M5 12l5 5L20 7" />}
</Svg>;
