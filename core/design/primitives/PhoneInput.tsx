import React from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';
import { accessibilityType, color, inputSurface, onboarding } from '../tokens';
import { Txt } from './Txt';

type PhoneInputProps = Omit<
  TextInputProps,
  'autoComplete' | 'keyboardType' | 'maxLength' | 'style' | 'textContentType'
> & {
  callingCode: string;
  callingCodeLabel: string;
};

/** Finland-first phone field: the market prefix is context, not editable input. */
export const PhoneInput = ({ callingCode, callingCodeLabel, ...props }: PhoneInputProps) => {
  return (
  <View
    style={{
      minHeight: onboarding.fieldHeight,
      flexDirection: 'row',
      alignItems: 'center',
      ...inputSurface,
      overflow: 'hidden'
    }}
  >
    <View
      accessible
      accessibilityLabel={callingCodeLabel}
      style={{
        width: onboarding.callingCodeWidth,
        flexShrink: 0,
        minHeight: onboarding.fieldHeight - inputSurface.borderWidth * 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: color.ruleSoft
      }}
    >
      <Txt v="onboardingLead" tone="soft" em tabular style={{ fontSize: onboarding.phoneFontSize }}>
        {callingCode}
      </Txt>
    </View>
    <TextInput
      {...props}
      autoComplete="tel"
      textContentType="telephoneNumber"
      keyboardType="number-pad"
      maxLength={12}
      maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? accessibilityType.maxMultiplier}
      placeholderTextColor={onboarding.placeholder}
      selectionColor={color.ink}
      style={{
        flex: 1,
        minWidth: 0,
        alignSelf: 'stretch',
        paddingHorizontal: onboarding.phonePaddingX,
        letterSpacing: onboarding.phoneTracking,
        fontSize: onboarding.phoneFontSize,
        fontVariant: ['tabular-nums'],
        ...(Platform.OS === 'web' ? { outlineStyle: 'solid', outlineWidth: 0 } : {}),
        color: color.ink
      }}
    />
  </View>
  );
};
