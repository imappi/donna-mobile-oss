import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import Svg, { Path } from 'react-native-svg';
import { color, refinement } from '../tokens';

// Exact handoff strokes. Fall back only for existing controls outside the new screens.
export type WorkingIconName = keyof typeof Feather.glyphMap | 'car';
const paths: Partial<Record<WorkingIconName, string[]>> = {
  'check-circle': ['M22 11.1V12a10 10 0 1 1-5.9-9.1', 'M9 11l3 3L22 4'],
  'help-circle': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01'],
  file: ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6'],
  'file-text': ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6M8 13h8M8 17h5'],
  'align-left': ['M4 6h16M4 12h16M4 18h10'],
  activity: ['M22 12h-4l-3 9L9 3l-3 9H2'],
  'upload-cloud': ['M16 16l-4-4-4 4', 'M12 12v9', 'M20.4 16.4A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 3 15.3'],
  'message-circle': ['M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z'],
  camera: ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  'file-plus': ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6', 'M12 12v6M9 15h6'],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  'chevron-left': ['M15 5l-7 7 7 7'],
  'chevron-right': ['M9 6l6 6-6 6'],
  'arrow-up': ['M12 19V5M5 12l7-7 7 7'],
  check: ['M5 12l5 5L20 7'],
  car: ['M5 17h14v-5l-2-5H7l-2 5z', 'M7 17a2 2 0 1 0 0 .01M17 17a2 2 0 1 0 0 .01', 'M5 12h14']
};
export const WorkingIcon = ({ name, size = refinement.headerGlyph, color: ink = color.ink }: {
  name: WorkingIconName; size?: number; color?: string;
}) => {
  const strokes = paths[name];
  if (!strokes) return name === 'car' ? null : <Feather name={name} size={size} color={ink} />;
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ink}
    strokeWidth={['chevron-left', 'chevron-right', 'arrow-up', 'check'].includes(name) ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    {strokes.map((d, index) => <Path key={index} d={d} />)}
  </Svg>;
};
