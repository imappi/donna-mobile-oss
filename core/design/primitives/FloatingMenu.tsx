import { WorkingIcon, type WorkingIconName } from './WorkingIcon';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  findNodeHandle,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  accessibilityType,
  color,
  ease,
  floatingAction,
  radius,
  refinement,
  shadow,
  shellGeometry,
  shellType
} from '../tokens';
import { MascotOrb } from './MascotOrb';
import { Txt } from './Txt';

/**
 * Shell v2's one persistent bottom control. Donna is an action launcher, not
 * a tab: tapping her preserves the current route and opens DonnaMenu below.
 * The shell supplies the brand image; core supplies no mascot of its own.
 */
export type FloatingDonnaButtonProps = {
  accessibilityLabel: string;
  image?: ImageSourcePropType;
  open: boolean;
  onPress: () => void;
  launcher?: Omit<DonnaMenuProps, 'open'>;
  /** Another modal shell control is open; keep Donna visible but inert. */
  blockedByOverlay?: boolean;
};

export const FloatingDonnaButton = ({
  accessibilityLabel,
  image,
  open,
  onPress,
  launcher,
  blockedByOverlay = false
}: FloatingDonnaButtonProps) => {
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'web' ? shellGeometry.referenceSafeBottom : insets.bottom;
  const donnaRef = useRef<React.ElementRef<typeof Pressable>>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (wasOpen.current && !open && Platform.OS !== 'web') {
      const focusTimer = setTimeout(() => {
        const node = findNodeHandle(donnaRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 0);
      wasOpen.current = open;
      return () => clearTimeout(focusTimer);
    }
    wasOpen.current = open;
    return undefined;
  }, [open]);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {launcher ? <DonnaMenu open={open} {...launcher} /> : null}
      <Pressable
        ref={donnaRef}
        onPress={onPress}
        accessible={!blockedByOverlay}
        focusable={!blockedByOverlay}
        importantForAccessibility={blockedByOverlay ? 'no-hide-descendants' : 'auto'}
        pointerEvents={blockedByOverlay ? 'none' : 'auto'}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={launcher ? { expanded: open } : undefined}
        style={({ pressed }) => ({
          position: 'absolute',
          zIndex: 30,
          right: floatingAction.right,
          bottom: safeBottom + floatingAction.bottomGap,
          width: floatingAction.size,
          height: floatingAction.size,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.9 : 1
        })}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: floatingAction.size + (open ? floatingAction.halo * 2 : 0),
            height: floatingAction.size + (open ? floatingAction.halo * 2 : 0),
            borderRadius: radius.pill,
            backgroundColor: open ? color.accentWash : 'transparent',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <View
            style={{
              width: floatingAction.size,
              height: floatingAction.size,
              borderRadius: radius.pill,
              borderWidth: floatingAction.border,
              borderColor: refinement.orbBorder,
              overflow: 'hidden',
              ...shadow.orb
            }}
          >
            <MascotOrb
              working
              size={floatingAction.size - floatingAction.border * 2}
              image={image}
              imageSize={floatingAction.imageSize}
              imageShift={floatingAction.imageShift}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export type DonnaMenuAction = {
  key: string;
  label: string;
  iconName?: WorkingIconName;
  /** Semantic primary action; all rows share the handoff's white-card style. */
  prominent?: boolean;
};

export type DonnaMenuProps = {
  open: boolean;
  actions: DonnaMenuAction[];
  mascot?: ImageSourcePropType;
  dismissLabel: string;
  onAction: (key: string) => void;
  onDismiss: () => void;
};

/**
 * The Donna launcher — the four-action menu her orb opens. First row is
 * the conversation (white, her face leading); the capture verbs are ink.
 * The scrim closes it; the current route never changes on open/close.
 */
export const DonnaMenu = ({ open, actions, mascot, dismissLabel, onAction, onDismiss }: DonnaMenuProps) => {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const safeBottom = Platform.OS === 'web' ? shellGeometry.referenceSafeBottom : insets.bottom;
  const widenLabel = fontScale > accessibilityType.launcherWideThreshold;
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  const firstActionRef = useRef<React.ElementRef<typeof Pressable>>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: reduceMotion ? 0 : open ? 160 : 140,
      easing: Easing.bezier(...ease),
      useNativeDriver: true
    });
    animation.start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    if (open && Platform.OS !== 'web') {
      focusTimer = setTimeout(() => {
        const node = findNodeHandle(firstActionRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, reduceMotion ? 0 : 170);
    }
    return () => {
      animation.stop();
      if (focusTimer) clearTimeout(focusTimer);
    };
  }, [mounted, open, progress, reduceMotion]);

  useEffect(() => {
    if (!open) return undefined;
    if (Platform.OS === 'web') {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onDismiss();
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });
    return () => subscription.remove();
  }, [open, onDismiss]);

  if (!mounted) return null;

  return (
    <View
      pointerEvents={open ? 'box-none' : 'none'}
      accessibilityElementsHidden={!open}
      aria-hidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      style={[StyleSheet.absoluteFill, { zIndex: 25 }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <Pressable
          accessibilityLabel={dismissLabel}
          accessibilityRole="button"
          accessible={open}
          focusable={open}
          onPress={onDismiss}
          style={[StyleSheet.absoluteFill, { backgroundColor: color.scrim }]}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal={open}
        accessibilityRole={open ? 'menu' : undefined}
        onAccessibilityEscape={onDismiss}
        style={{
          position: 'absolute',
          left: floatingAction.menuMargin,
          right: floatingAction.menuMargin,
          bottom:
            safeBottom +
            floatingAction.bottomGap +
            floatingAction.size +
            floatingAction.menuGapToButton,
          gap: floatingAction.menuGap,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [floatingAction.menuTravel, 0]
              })
            }
          ]
        }}
      >
        {actions.map((action, index) => (
          <Pressable
            key={action.key}
            ref={index === 0 ? firstActionRef : undefined}
            onPress={() => onAction(action.key)}
            accessibilityRole={open ? 'menuitem' : undefined}
            accessibilityLabel={action.label}
            accessible={open}
            focusable={open}
            style={({ pressed }) => ({
              minHeight: floatingAction.menuRow,
              flexDirection: 'row',
              alignItems: 'center',
              gap: widenLabel ? accessibilityType.launcherColumnGap : floatingAction.menuColumnGap,
              backgroundColor: pressed ? color.paperDeep : color.card,
              borderRadius: radius.streamCard,
              paddingHorizontal: widenLabel
                ? accessibilityType.launcherPaddingX
                : floatingAction.menuRowPaddingX,
              opacity: pressed ? 0.9 : 1,
              ...shadow.launcher
            })}
          >
            {(
              <View style={{ width: floatingAction.menuIcon, alignItems: 'center' }}>
                <WorkingIcon
                  name={action.iconName ?? 'message-circle'}
                  size={shellGeometry.header.accessoryIcon}
                  color={color.ink}
                />
              </View>
            )}
            <Txt
              v="body"
              tone="ink"
              numberOfLines={1}
              style={{ flex: 1, lineHeight: shellType.rowTitleLine }}
            >
              {action.label}
            </Txt>
            {widenLabel ? null : (
              <View style={{ width: floatingAction.menuChevron + 2, alignItems: 'flex-end', opacity: 0.5 }}>
                <WorkingIcon
                  name="chevron-right"
                  size={floatingAction.menuChevron}
                  color={color.ink}
                />
              </View>
            )}
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
};
