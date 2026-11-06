import React from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { button, color, icon, onboarding, refinement, tapTarget, text } from '../tokens';
import { useShellOverlayAccessibilityHidden } from './Screen';
import { OnboardingIcon } from './OnboardingIcon';
import { Txt } from './Txt';

/**
 * The one-button law (DESIGN.md §5). Three voices, one geometry:
 *  primary  — the ONE loud action on a surface (ink pill, paper text)
 *  chip     — everything else clickable (hairline, soft ink)
 *  danger   — primary recolored to alert, ONLY inside an explicit
 *             confirmation step, never on first tap
 * Disabled is the primary's resting state, not a fourth voice.
 * Hit target reaches 44dp via padding compensation, not visual growth.
 */
export type ButtonKind = 'primary' | 'chip' | 'danger' | 'text';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  kind?: ButtonKind;
  loading?: boolean;
  quietTone?: 'ink' | 'soft' | 'mute';
  flush?: boolean;
  icon?: 'microphone' | 'pause' | 'play' | 'stop' | 'pencil' | 'checkmark' | 'scan-outline';
  /**
   * PRIMITIVE-SET EXTENSION (flagged to Kari): 'large' is the CAPTURE
   * screen's one big verb — full-width pill, body-size label. Everything
   * else stays 'regular'.
   */
  size?: 'regular' | 'large' | 'onboarding' | 'onboardingCapture' | 'decision' | 'action';
  grow?: boolean;
};

export const Button = ({ title, kind = 'chip', loading, disabled, size = 'regular', icon: iconName, quietTone = 'soft', flush = false, grow = false, ...rest }: ButtonProps) => {
  const isDecision = size === 'decision';
  const isAction = size === 'action';
  const isOnboarding = size === 'onboarding' || size === 'onboardingCapture';
  const shellOverlayOpen = useShellOverlayAccessibilityHidden();
  const off = Boolean(disabled) || Boolean(loading);
  const isLoud = kind === 'primary' || kind === 'danger';
  const bg = off ? 'transparent' : kind === 'primary' ? color.ink : kind === 'danger' ? color.alert : 'transparent';
  const fg = off ? color.inkMute : isLoud ? color.paper : quietTone === 'ink' ? color.ink : quietTone === 'mute' ? color.inkMute : color.inkSoft;
  const borderColor = kind === 'text' ? 'transparent' : off ? color.ruleSoft : isLoud ? 'transparent' : color.rule;
  const pad = Math.max(0, (tapTarget - (button.paddingY * 2 + Math.round(text.xs * 1.35))) / 2);
  const glyphName = iconName === 'microphone' ? 'mic' : iconName;
  return (
    <Pressable
      {...rest}
      disabled={off}
      accessible={!shellOverlayOpen && rest.accessible !== false}
      focusable={!shellOverlayOpen && rest.focusable !== false}
      importantForAccessibility={
        shellOverlayOpen ? 'no-hide-descendants' : rest.importantForAccessibility
      }
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      accessibilityLabel={rest.accessibilityLabel ?? title}
      aria-checked={rest['aria-checked'] ?? rest.accessibilityState?.checked}
      hitSlop={{ top: pad, bottom: pad, left: 4, right: 4 }}
      style={({ pressed }) => ({
        flex: grow ? 1 : undefined,
        alignSelf: kind === 'text' ? (isOnboarding ? 'flex-start' : 'center') : size !== 'regular' ? 'stretch' : 'flex-start',
        minHeight: isDecision ? refinement.decisionHeight : isAction ? refinement.chipHeight : kind === 'text' ? tapTarget : isOnboarding ? size === 'onboardingCapture' ? onboarding.booksButtonHeight : onboarding.primaryHeight : undefined,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: size !== 'regular' ? 'center' : 'flex-start',
        gap: size === 'onboardingCapture' ? onboarding.booksGap : isOnboarding ? 8 : button.gap,
        paddingVertical: isDecision || isAction ? 0 : isOnboarding ? kind === 'text' ? 0 : ((size === 'onboardingCapture' ? onboarding.booksButtonHeight : onboarding.primaryHeight) - 24) / 2 - (off ? 1 : 0) : size === 'large' ? 16 : button.paddingY,
        paddingHorizontal: isDecision ? refinement.decisionPaddingX : isOnboarding && kind === 'text' ? flush ? 0 : onboarding.quietPaddingX : button.paddingX,
        borderRadius: button.radius,
        borderWidth: isOnboarding && (!off || kind === 'text') ? 0 : 1,
        borderColor,
        backgroundColor: bg,
        opacity: pressed && !off ? 0.85 : 1
      })}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : null}
      {!loading && glyphName ? isOnboarding && (iconName === 'microphone' || iconName === 'pencil' || iconName === 'checkmark' || iconName === 'scan-outline')
        ? <OnboardingIcon name={iconName} size={iconName === 'microphone' ? 15 : iconName === 'pencil' ? 16 : icon.size} ink={fg} />
        : <Ionicons name={glyphName} size={icon.size} color={fg} /> : null}
      <Txt v={isDecision ? 'decision' : isAction ? 'chip' : isOnboarding ? kind === 'text' ? 'onboardingQuiet' : 'onboardingLead' : size === 'large' ? 'body' : 'meta'} style={{ color: fg, fontWeight: isLoud ? '600' : '500', flexShrink: 1, textAlign: 'center' }}>
        {title}
      </Txt>
    </Pressable>
  );
};
