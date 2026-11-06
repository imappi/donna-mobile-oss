import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color, dot, onboarding, radius, space } from '../tokens';
import { Txt } from './Txt';

export const OnboardingCues = ({ cues, note, recording }: { cues: string[]; note?: string; recording?: boolean }) => (
  <View style={{ marginTop: recording ? onboarding.recordingGap : onboarding.businessGap, gap: onboarding.cueNoteGap }}>
  <View style={styles.card}>
    {cues.map((cue, index) => <View key={cue} style={[styles.row, index > 0 && styles.rule]}>
      <View style={styles.dot} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <Txt v="onboardingBody" style={styles.copy}>{cue}</Txt>
    </View>)}
  </View>
  {note ? <Txt v="onboardingNote" tone="mute">{note}</Txt> : null}
  </View>
);
const styles = StyleSheet.create({
  card: { backgroundColor: onboarding.cueSurface, borderWidth: 1, borderColor: onboarding.cueBorder,
    borderRadius: radius.streamCard, paddingHorizontal: onboarding.cuePaddingX, paddingVertical: space.xs },
  row: { minHeight: onboarding.cueRowHeight, flexDirection: 'row', alignItems: 'center', gap: space.md },
  rule: { borderTopWidth: 1, borderTopColor: color.ruleSoft },
  dot: { width: dot.size, height: dot.size, borderRadius: radius.pill, borderWidth: dot.hollowBorder, borderColor: color.inkMute },
  copy: { flex: 1 }
});
