import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { color, dot, onboarding, space } from '../tokens';
import { Txt } from './Txt';
import { OnboardingIcon } from './OnboardingIcon';
import { useReducedMotion } from './OnboardingMotion';

const Spinner = () => {
  const reduced = useReducedMotion();
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { rotation.setValue(0); return; }
    const animation = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: onboarding.spinnerDuration,
      easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }));
    animation.start();
    return () => animation.stop();
  }, [reduced, rotation]);
  return <Animated.View accessible={false} style={[styles.spinner,
    { transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} />;
};

/** Stage changes must come from actual processing events, never elapsed timers. */
export const OnboardingProgress = ({ steps, stage = 0 }: { steps: string[]; stage?: number }) =>
  <View accessibilityLiveRegion="polite">{steps.map((label, index) =>
    <View key={label} style={styles.row}>
      <View style={styles.slot}>
        {index < stage ? <OnboardingIcon name="checkmark" size={onboarding.progressIconSize} /> :
          index === stage ? <Spinner /> : <View style={styles.hollow} />}
      </View>
      <Txt v="onboardingLead" tone={index <= stage ? 'ink' : 'mute'}>{label}</Txt>
    </View>)}</View>;

export const OnboardingChecking = ({ label }: { label: string }) =>
  <View style={styles.checking} accessibilityLiveRegion="polite"><Spinner /><Txt v="onboardingSmall" tone="soft">{label}</Txt></View>;

export const OnboardingPermissionNote = ({ children }: { children: string }) =>
  <View style={styles.permission}><Txt v="onboardingAlert" tone="alert" accessibilityLiveRegion="polite">{children}</Txt></View>;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: onboarding.progressRowHeight,
    borderBottomWidth: 1, borderBottomColor: color.ruleSoft },
  slot: { width: onboarding.progressIconSize, alignItems: 'center' },
  hollow: { width: dot.size, height: dot.size, borderRadius: dot.size, borderWidth: dot.hollowBorder, borderColor: onboarding.placeholder },
  spinner: { width: onboarding.progressIconSize, height: onboarding.progressIconSize, borderRadius: onboarding.progressIconSize,
    borderWidth: 2, borderColor: color.rule, borderTopColor: color.ink },
  checking: { flexDirection: 'row', alignItems: 'center', minHeight: space.lg, gap: onboarding.booksGap },
  permission: { marginTop: space.rowX, paddingVertical: onboarding.permissionPaddingY, paddingHorizontal: onboarding.permissionPaddingX,
    borderRadius: onboarding.permissionRadius, backgroundColor: color.alertWash }
});
