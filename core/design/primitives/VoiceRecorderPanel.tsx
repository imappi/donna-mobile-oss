import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { color, onboarding, radius, space, weight } from '../tokens';
import { Txt } from './Txt';
import { useReducedMotion } from './OnboardingMotion';

export type VoiceRecorderPanelProps = { status: string; elapsed: string; active?: boolean };
export const VoiceRecorderPanel = ({ status, elapsed, active }: VoiceRecorderPanelProps) => {
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active || reduced) { pulse.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.35, duration: onboarding.statusPulseHalfDuration, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: onboarding.statusPulseHalfDuration, useNativeDriver: true })
    ]));
    animation.start();
    return () => animation.stop();
  }, [active, reduced, pulse]);
  return <View style={styles.header}>
    <View style={styles.status}>
      <Animated.View style={[styles.dot, { opacity: pulse, backgroundColor: active ? color.accent : onboarding.placeholder }]} />
      <Txt v="onboardingLead" style={{ fontWeight: weight.heading }} accessibilityLiveRegion="polite">{status}</Txt>
    </View>
    <Txt v="onboardingTimer" tabular>{elapsed.replace(/^0(?=\d:)/, '')}</Txt>
  </View>;
};

/** Decorative listening animation — deliberately not represented as a measured audio waveform. */
const WaveBar = ({ index, active, reduced }: { index: number; active: boolean; reduced: boolean }) => {
  const scale = useRef(new Animated.Value(onboarding.waveformRest / onboarding.waveformPeak)).current;
  useEffect(() => {
    if (!active || reduced) { scale.setValue(onboarding.pausedWaveHeights[index % 4] / onboarding.waveformPeak); return; }
    scale.setValue(onboarding.waveformRest / onboarding.waveformPeak);
    const half = (onboarding.waveformDuration + (index % 5) * onboarding.waveformDurationStep) / 2;
    const animation = Animated.sequence([
      Animated.delay(index * onboarding.waveformDelayStep),
      Animated.loop(Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: onboarding.waveformRest / onboarding.waveformPeak, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ]))
    ]);
    animation.start();
    return () => animation.stop();
  }, [active, reduced, index, scale]);
  return <Animated.View style={[styles.bar, { transform: [{ scaleY: scale }] }]} />;
};
export const VoiceActivity = ({ active }: { active: boolean }) => {
  const reduced = useReducedMotion();
  return <View style={styles.wave} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {onboarding.waveformHeights.map((_, index) => <WaveBar key={index} index={index} active={active} reduced={reduced} />)}
  </View>;
};
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: space.md },
  status: { flexDirection: 'row', alignItems: 'center', gap: onboarding.booksGap },
  dot: { width: onboarding.statusDotSize, height: onboarding.statusDotSize, borderRadius: radius.pill },
  wave: { height: onboarding.waveformHeight, flexDirection: 'row', alignItems: 'center', gap: onboarding.waveformGap },
  bar: { width: onboarding.waveformBarWidth, height: onboarding.waveformPeak, backgroundColor: color.accent, borderRadius: radius.pill }
});
