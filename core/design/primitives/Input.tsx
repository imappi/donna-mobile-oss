import React from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';
import { accessibilityType, businessCard, color, inputSurface, leading, onboardingType, radius, space, text } from '../tokens';
import { useShellOverlayAccessibilityHidden } from './Screen';

/**
 * The one text field. PRIMITIVE-SET EXTENSION (flagged to Kari per
 * DESIGN.md §9): sign-in and inline ask answers need a field; this is the
 * quiet version — card ground, hairline, body type, no focus glow.
 */
export const Input = ({ variant = 'default', cardRole = 'fact', ...props }: TextInputProps & {
  variant?: 'default' | 'onboarding' | 'card'; cardRole?: 'company' | 'owner' | 'profession' | 'fact';
}) => {
  const shellOverlayOpen = useShellOverlayAccessibilityHidden();
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor={color.inkMute}
      {...props}
      onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
      accessible={!shellOverlayOpen && props.accessible !== false}
      focusable={!shellOverlayOpen && props.focusable !== false}
      importantForAccessibility={
        shellOverlayOpen ? 'no-hide-descendants' : props.importantForAccessibility
      }
      maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? accessibilityType.maxMultiplier}
      style={[
        {
          backgroundColor: color.card,
          borderWidth: 1,
          borderColor: color.rule,
          borderRadius: radius.card,
          paddingHorizontal: space.md,
          paddingVertical: space.sm + 2,
          fontSize: text.base,
          lineHeight: Math.round(text.base * leading.body),
          color: color.ink
        },
        variant !== 'default' ? inputSurface : null,
        variant === 'card' ? { minHeight: cardRole === 'company' ? businessCard.editCompanyHeight : businessCard.editFieldHeight,
          borderRadius: businessCard.editRadius, borderColor: businessCard.editBorder, boxShadow: 'none',
          paddingHorizontal: businessCard.editPaddingX, paddingVertical: space.md,
          ...(cardRole === 'company' ? { ...onboardingType.description, fontWeight: '600' }
            : cardRole === 'owner' ? onboardingType.owner : cardRole === 'profession' ? onboardingType.small : onboardingType.fact) } : null,
        variant === 'onboarding' && focused ? { borderColor: color.inkSoft } : null,
        variant !== 'default' && Platform.OS === 'web' ? { outlineStyle: 'solid', outlineWidth: 0 } : null,
        props.multiline ? { minHeight: 88, textAlignVertical: 'top' } : null,
        props.style
      ]}
    />
  );
};
