import Feather from '@expo/vector-icons/Feather';
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
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, ease, ownerMenu, radius, shadow, shellGeometry } from '../tokens';
import { Txt } from './Txt';

export type OwnerMenuAction = {
  key: string;
  label: string;
  iconName: keyof typeof Feather.glyphMap;
};

export type OwnerMenuProps = {
  open: boolean;
  title: string;
  detail?: string | null;
  actions: OwnerMenuAction[];
  dismissLabel: string;
  onAction: (key: string) => void;
  onDismiss: () => void;
};

/**
 * The compact owner-level navigation opened by the shared burger control.
 * It is intentionally separate from Donna's action launcher: this menu is
 * for account and app destinations, while Donna remains the work doorway.
 */
export const OwnerMenu = ({
  open,
  title,
  detail,
  actions,
  dismissLabel,
  onAction,
  onDismiss
}: OwnerMenuProps) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const safeTop = Platform.OS === 'web' ? shellGeometry.referenceSafeTop : insets.top;
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
      duration: reduceMotion ? 0 : open ? 150 : 120,
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
      }, reduceMotion ? 0 : 160);
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
      style={[StyleSheet.absoluteFill, { zIndex: 40 }]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: progress }]}
      >
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
        testID="owner-menu"
        style={{
          position: 'absolute',
          top: safeTop + shellGeometry.header.height - ownerMenu.topGap,
          right: ownerMenu.margin,
          width: Math.min(ownerMenu.width, width - ownerMenu.margin * 2),
          padding: ownerMenu.padding,
          borderRadius: radius.sheet,
          borderWidth: 1,
          borderColor: color.ruleSoft,
          backgroundColor: color.card,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [ownerMenu.travel, 0]
              })
            }
          ],
          ...shadow.sheet
        }}
      >
        <View
          style={{
            paddingHorizontal: ownerMenu.identityPaddingX,
            paddingVertical: ownerMenu.identityPaddingY,
            gap: ownerMenu.identityGap
          }}
        >
          <Txt v="body" em numberOfLines={1}>
            {title}
          </Txt>
          {detail ? (
            <Txt v="meta" tone="mute" numberOfLines={1}>
              {detail}
            </Txt>
          ) : null}
        </View>
        {actions.map((action, index) => (
          <React.Fragment key={action.key}>
            {index > 0 ? (
              <View
                style={{
                  marginLeft: ownerMenu.dividerInset,
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: color.ruleSoft
                }}
              />
            ) : null}
            <Pressable
              ref={index === 0 ? firstActionRef : undefined}
              onPress={() => onAction(action.key)}
              accessibilityRole={open ? 'menuitem' : undefined}
              accessibilityLabel={action.label}
              accessible={open}
              focusable={open}
              testID={`owner-menu-${action.key}`}
              style={({ pressed }) => ({
                minHeight: ownerMenu.rowMinHeight,
                paddingHorizontal: ownerMenu.rowPaddingX,
                flexDirection: 'row',
                alignItems: 'center',
                gap: ownerMenu.rowGap,
                borderRadius: radius.card,
                backgroundColor: pressed ? color.inkWash : 'transparent'
              })}
            >
              <View style={{ width: ownerMenu.iconSlot, alignItems: 'center' }}>
                <Feather name={action.iconName} size={ownerMenu.iconSize} color={color.inkSoft} />
              </View>
              <Txt v="body" numberOfLines={2} style={{ flex: 1 }}>
                {action.label}
              </Txt>
              <Feather name="chevron-right" size={ownerMenu.iconSize} color={color.inkMute} />
            </Pressable>
          </React.Fragment>
        ))}
      </Animated.View>
    </View>
  );
};
