import React from 'react';
import { Pressable } from 'react-native';
import { OnboardingIcon } from './OnboardingIcon';
import { color, onboarding, radius, voice } from '../tokens';

/** The single primary action on the optional business introduction. */
export const MicrophoneButton = ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    disabled={disabled}
    accessibilityState={{ disabled }}
    style={({ pressed }) => ({
      width: voice.startSize,
      height: voice.startSize,
      borderRadius: radius.pill,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.ink,
      transform: [{ scale: pressed ? 0.96 : 1 }],
      ...onboarding.micShadow
    })}
  >
    <OnboardingIcon name="microphone" size={voice.startGlyph} ink={color.card} />
  </Pressable>
);
