import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color, onboarding, radius, space } from '../tokens';
import { Button } from './Button';
import { OnboardingReveal } from './OnboardingMotion';
import { Txt } from './Txt';

export const FirstReceipt = ({ title, body, action, addFile, ghost, onCapture, onAddFile }: {
  title: string; body: string; action: string; addFile: string; ghost: string;
  onCapture: () => void; onAddFile: () => void;
}) => <View style={styles.stack}>
  <OnboardingReveal><View style={styles.card}>
    <View style={styles.copy}>
      <Txt v="onboardingGreeting" accessibilityRole="header">{title}</Txt>
      <Txt v="onboardingGreetingBody" tone="soft">{body}</Txt>
    </View>
    <Button title={action} kind="primary" size="onboardingCapture" icon="scan-outline" onPress={onCapture} />
    <Button title={addFile} kind="text" size="onboarding" onPress={onAddFile} />
  </View></OnboardingReveal>
  <View style={styles.ghost}>
    <View style={styles.ghostIcon} accessibilityElementsHidden />
    <Txt v="onboardingSmall" tone="mute" style={styles.ghostCopy}>{ghost}</Txt>
  </View>
</View>;
const styles = StyleSheet.create({
  stack: { gap: onboarding.booksGap },
  copy: { gap: onboarding.booksCopyGap },
  card: { borderRadius: radius.streamCard, backgroundColor: color.card, padding: space.screenX,
    gap: onboarding.booksCardGap, ...onboarding.booksShadow },
  ghost: { borderRadius: radius.streamCard, borderWidth: onboarding.ghostBorderWidth, borderColor: color.rule,
    borderStyle: 'dashed', padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
  ghostIcon: { width: onboarding.ghostIconSize, height: onboarding.ghostIconSize,
    borderRadius: onboarding.ghostIconRadius, backgroundColor: onboarding.ghostIconGround },
  ghostCopy: { flex: 1 }
});
