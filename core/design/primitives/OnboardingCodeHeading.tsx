import React from 'react';
import { Platform, View } from 'react-native';
import { onboarding } from '../tokens';
import { Txt } from './Txt';

/** A real inline text link so its line-wrap and baseline match the sentence. */
export const OnboardingCodeHeading = ({ title, sentence, link, disabled, onPress }: {
  title: string; sentence: string; link: string; disabled?: boolean; onPress: () => void;
}) => <View style={{ gap: onboarding.headerGap }}>
  <Txt v="onboardingTitle" accessibilityRole="header">{title}</Txt>
  <Txt v="onboardingLead" tone="soft">{sentence}{' '}
    <Txt v="onboardingLead" accessibilityRole="link" accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      style={{ textDecorationLine: 'underline', ...(Platform.OS === 'web' ? { textUnderlineOffset: onboarding.inlineLinkOffset } : {}) }}>
      {link}
    </Txt>
  </Txt>
</View>;
