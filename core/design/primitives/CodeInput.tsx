import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { color, inputSurface, onboarding, text, weight } from '../tokens';

const CELLS = [0, 1, 2, 3, 4, 5] as const;

type CodeInputProps = Omit<
  TextInputProps,
  'autoComplete' | 'caretHidden' | 'keyboardType' | 'maxLength' | 'style' | 'textContentType'
>;

/** One native OTP field, presented as six generous cells for fast comparison. */
export const CodeInput = ({ value = '', onChangeText, ...props }: CodeInputProps) => {
  const digits = String(value).replace(/\D/g, '').slice(0, CELLS.length);
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ minHeight: onboarding.codeCellHeight }}>
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        style={{ flexDirection: 'row', gap: onboarding.codeGap }}
      >
        {CELLS.map((index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: onboarding.codeCellHeight,
              alignItems: 'center',
              justifyContent: 'center',
              ...inputSurface,
              boxShadow: onboarding.codeInsetShadow,
              borderRadius: onboarding.codeRadius,
              borderWidth: focused && index === digits.length ? 1.5 : 1,
              borderColor: focused && index === digits.length ? color.ink : color.ruleSoft
            }}
          >
            <Text
              maxFontSizeMultiplier={1.5}
              style={{ color: color.ink, fontSize: text.xl, fontWeight: weight.emphasis, fontVariant: ['tabular-nums'] }}
            >
              {digits[index] ?? ''}
            </Text>
          </View>
        ))}
      </View>
      <TextInput
        {...props}
        value={digits}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        onChangeText={(next) => onChangeText?.(next.replace(/\D/g, '').slice(0, CELLS.length))}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        keyboardType="number-pad"
        maxLength={CELLS.length}
        caretHidden
        style={{ position: 'absolute', inset: 0, color: 'transparent', opacity: 0.02 }}
      />
    </View>
  );
};
