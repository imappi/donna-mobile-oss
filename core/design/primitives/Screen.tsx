import { WorkingIcon } from './WorkingIcon';
import React from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  type ViewProps,
  type ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { artifact, color, ownerMenu, radius, refinement, shadow, shellGeometry, space, surface } from '../tokens';
import { Ground } from './Ground';
import { Txt } from './Txt';
import { t } from '../../i18n';

let shellOverlayAccessibilityHidden = false;
const shellOverlayAccessibilityListeners = new Set<() => void>();

const setShellOverlayAccessibilityHidden = (hidden: boolean) => {
  if (shellOverlayAccessibilityHidden === hidden) return;
  shellOverlayAccessibilityHidden = hidden;
  shellOverlayAccessibilityListeners.forEach((listener) => listener());
};

const subscribeToShellOverlayAccessibility = (listener: () => void) => {
  shellOverlayAccessibilityListeners.add(listener);
  return () => {
    shellOverlayAccessibilityListeners.delete(listener);
  };
};

export const useShellOverlayAccessibilityHidden = () =>
  React.useSyncExternalStore(
    subscribeToShellOverlayAccessibility,
    () => shellOverlayAccessibilityHidden,
    () => false
  );

export const ShellOverlayAccessibilityProvider = ({
  hidden,
  children
}: {
  hidden: boolean;
  children: React.ReactNode;
}) => {
  // Expo Router owns the native scene roots, so this small external signal
  // carries modal accessibility state across that navigator boundary.
  React.useEffect(() => setShellOverlayAccessibilityHidden(hidden), [hidden]);
  React.useEffect(() => () => setShellOverlayAccessibilityHidden(false), []);
  return children;
};

type ShellHeaderMenuContextValue = {
  open: boolean;
  onOpen: () => void;
  attentionCount: number;
  accessibilityLabel: string;
};

const ShellHeaderMenuContext = React.createContext<ShellHeaderMenuContextValue | null>(null);

export const ShellHeaderMenuProvider = ({
  value,
  children
}: {
  value: ShellHeaderMenuContextValue;
  children: React.ReactNode;
}) => <ShellHeaderMenuContext.Provider value={value}>{children}</ShellHeaderMenuContext.Provider>;

/**
 * The screen shell: the sunset
 * ground carries only the chrome — an optional EYEBROW (entity · period),
 * the screen title, and a round accessory chip — while everything the owner
 * reads sits on an opaque paper information surface with a 28pt radius.
 * Shell v2 adds `contentMode="canvas"` for Books: individual stream cards
 * sit directly on the continuous sunset-to-paper ground instead of inside
 * one enclosing surface.
 * `scroll` wraps children in a ScrollView; list screens mount their own list.
 * `floatingChrome` reserves bottom space for Donna's floating control.
 */
export type ScreenProps = ViewProps & {
  title?: string;
  headerContent?: React.ReactNode;
  /**
   * The quiet identity line ABOVE the title — entity · period, uppercase.
   * Pressable when onEyebrowPress is given (the multi-entity switcher
   * trigger). Shell-v1 supersedes the earlier under-title subtitle slot.
   */
  eyebrow?: string | null;
  onEyebrowPress?: () => void;
  /** Optional node rendered at the title row's right edge. */
  titleAccessory?: React.ReactNode;
  /** Renders the in-content back chevron (pushed detail surfaces; no native header). */
  onBack?: () => void;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  floatingChrome?: boolean;
  contentMode?: 'panel' | 'canvas';
  /** Brand register is restricted to first-run/marketing surfaces. */
  groundVariant?: 'shell' | 'brand';
  /** Keeps form content reachable above the native keyboard. */
  keyboardAvoiding?: boolean;
  /** Compact pushed-artifact chrome: one-line context, back, optional real action. */
  headerMode?: 'screen' | 'artifact';
};

const ROOT: ViewStyle = { flex: 1, backgroundColor: color.paper };
const SHELL_HEADER: ViewStyle = {
  minHeight: shellGeometry.header.height,
  paddingHorizontal: shellGeometry.header.paddingX,
  paddingTop: shellGeometry.header.paddingTop,
  paddingBottom: shellGeometry.header.paddingBottom,
  justifyContent: 'flex-end'
};
const SHELL_HEADER_ROW: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'flex-end',
  justifyContent: 'space-between'
};
const SHELL_TITLE_STACK: ViewStyle = { flex: 1, minWidth: 0 };
const SHELL_BACK: ViewStyle = {
  width: shellGeometry.header.back,
  height: shellGeometry.header.back,
  marginRight: shellGeometry.header.backGap,
  borderRadius: radius.pill,
  backgroundColor: color.headerChip,
  ...refinement.chromeShadow,
  alignItems: 'center',
  justifyContent: 'center'
};
const HEADER_MENU_CHIP: ViewStyle = {
  width: shellGeometry.header.accessory,
  height: shellGeometry.header.accessory,
  borderRadius: radius.pill,
  backgroundColor: color.headerChip,
  ...refinement.chromeShadow,
  alignItems: 'center',
  justifyContent: 'center'
};
const MENU_DOT: ViewStyle = {
  position: 'absolute',
  top: ownerMenu.notificationDotTop,
  right: ownerMenu.notificationDotRight,
  width: ownerMenu.notificationDot + ownerMenu.notificationDotBorder * 2,
  height: ownerMenu.notificationDot + ownerMenu.notificationDotBorder * 2,
  borderRadius: radius.pill,
  borderWidth: ownerMenu.notificationDotBorder,
  borderColor: color.card,
  backgroundColor: color.alert
};
const EYEBROW_PRESS: ViewStyle = {
  alignSelf: 'flex-start',
  paddingBottom: shellGeometry.header.eyebrowGap
};

export const Screen = ({
  title,
  headerContent,
  eyebrow,
  onEyebrowPress,
  titleAccessory,
  onBack,
  scroll = false,
  refreshing,
  onRefresh,
  padded = true,
  floatingChrome = false,
  contentMode = 'panel',
  groundVariant = 'shell',
  keyboardAvoiding = false,
  headerMode = 'screen',
  children,
  style,
  ...rest
}: ScreenProps) => {
  const insets = useSafeAreaInsets();
  const shellOverlayOpen = useShellOverlayAccessibilityHidden();
  const shellHeaderMenu = React.useContext(ShellHeaderMenuContext);
  const menuButtonRef = React.useRef<React.ElementRef<typeof Pressable>>(null);
  const wasMenuOpen = React.useRef(shellHeaderMenu?.open ?? false);
  const safeTop = Platform.OS === 'web' ? shellGeometry.referenceSafeTop : insets.top;

  React.useEffect(() => {
    const menuOpen = shellHeaderMenu?.open ?? false;
    if (wasMenuOpen.current && !menuOpen && Platform.OS !== 'web') {
      const focusTimer = setTimeout(() => {
        const node = findNodeHandle(menuButtonRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 0);
      wasMenuOpen.current = menuOpen;
      return () => clearTimeout(focusTimer);
    }
    wasMenuOpen.current = menuOpen;
    return undefined;
  }, [shellHeaderMenu?.open]);

  const shellAccessory =
    titleAccessory ??
    (headerMode === 'screen' && shellHeaderMenu ? (
      <Pressable
        ref={menuButtonRef}
        onPress={shellHeaderMenu.onOpen}
        accessible={!shellOverlayOpen}
        focusable={!shellOverlayOpen}
        importantForAccessibility={shellOverlayOpen ? 'no-hide-descendants' : 'auto'}
        accessibilityRole="button"
        accessibilityLabel={shellHeaderMenu.accessibilityLabel}
        accessibilityState={{ expanded: shellHeaderMenu.open }}
        hitSlop={8}
        testID="owner-menu-button"
        style={HEADER_MENU_CHIP}
      >
        <WorkingIcon name="menu" size={refinement.headerGlyph} color={color.ink} />
        {shellHeaderMenu.attentionCount > 0 ? <View pointerEvents="none" style={MENU_DOT} /> : null}
      </Pressable>
    ) : null);
  const shellHead =
    title || onBack ? (
      <View
        accessibilityElementsHidden={shellOverlayOpen}
        aria-hidden={shellOverlayOpen}
        importantForAccessibility={shellOverlayOpen ? 'no-hide-descendants' : 'auto'}
        style={[
          SHELL_HEADER,
          headerMode === 'artifact'
            ? {
                minHeight: artifact.headerHeight,
                paddingHorizontal: artifact.headerPaddingX,
                paddingTop: artifact.headerPaddingTop,
                paddingBottom: artifact.headerPaddingBottom
              }
            : null
        ]}
      >
        <View style={[SHELL_HEADER_ROW, headerMode === 'artifact' ? { alignItems: 'center' } : null]}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              accessible={!shellOverlayOpen}
              focusable={!shellOverlayOpen}
              importantForAccessibility={shellOverlayOpen ? 'no-hide-descendants' : 'auto'}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={8}
              style={[
                SHELL_BACK,
                headerMode === 'artifact' ? { marginRight: artifact.headerGap } : null
              ]}
            >
              <WorkingIcon name="chevron-left" size={refinement.headerGlyph} color={color.ink} />
            </Pressable>
          ) : null}
          <View style={SHELL_TITLE_STACK}>
            {eyebrow ? (
              <Pressable
                onPress={onEyebrowPress}
                disabled={!onEyebrowPress}
                accessible={!shellOverlayOpen}
                focusable={!shellOverlayOpen}
                importantForAccessibility={shellOverlayOpen ? 'no-hide-descendants' : 'auto'}
                accessibilityRole={onEyebrowPress ? 'button' : undefined}
                accessibilityLabel={eyebrow}
                hitSlop={8}
                style={EYEBROW_PRESS}
              >
                <Txt v="eyebrow" tone="mute" numberOfLines={1}>
                  {eyebrow}
                </Txt>
              </Pressable>
            ) : null}
            {title ? (
              <Txt v={headerMode === 'artifact' ? 'body' : 'title'} em={headerMode === 'artifact'} numberOfLines={1}>
                {title}
              </Txt>
            ) : null}
          </View>
          {shellAccessory}
        </View>
      </View>
    ) : null;
  const standardHead =
    title || onBack ? (
      <View style={{ paddingHorizontal: padded ? space.screenX : 0, paddingTop: space.sm, paddingBottom: space.md }}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={12}
            style={{ alignSelf: 'flex-start', paddingBottom: space.xs }}
          >
            <WorkingIcon name="chevron-left" size={refinement.headerGlyph} color={color.ink} />
          </Pressable>
        ) : null}
        {eyebrow ? (
          <Pressable
            onPress={onEyebrowPress}
            disabled={!onEyebrowPress}
            accessible={!shellOverlayOpen}
            focusable={!shellOverlayOpen}
            importantForAccessibility={shellOverlayOpen ? 'no-hide-descendants' : 'auto'}
            accessibilityRole={onEyebrowPress ? 'button' : undefined}
            accessibilityLabel={eyebrow}
            hitSlop={8}
            style={{ alignSelf: 'flex-start', paddingBottom: space.hair }}
          >
            <Txt v="eyebrow" tone="mute" numberOfLines={1}>
              {eyebrow}
            </Txt>
          </Pressable>
        ) : null}
        {title ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Txt v="title">{title}</Txt>
            {shellAccessory}
          </View>
        ) : null}
      </View>
    ) : null;
  const contentBottom = floatingChrome ? surface.contentBottom : space.lg;
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: contentBottom, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={color.inkMute} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    children
  );
  const reachableBody = keyboardAvoiding ? (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );
  return (
    <View
      {...rest}
      accessibilityElementsHidden={floatingChrome && shellOverlayOpen}
      aria-hidden={floatingChrome && shellOverlayOpen}
      importantForAccessibility={floatingChrome && shellOverlayOpen ? 'no-hide-descendants' : 'auto'}
      style={[ROOT, { paddingTop: floatingChrome ? safeTop : insets.top }, style]}
    >
      <Ground variant={groundVariant} />
      {headerContent ?? (floatingChrome ? shellHead : standardHead)}
      {contentMode === 'canvas' ? (
        <View
          accessibilityElementsHidden={floatingChrome && shellOverlayOpen}
          aria-hidden={floatingChrome && shellOverlayOpen}
          importantForAccessibility={floatingChrome && shellOverlayOpen ? 'no-hide-descendants' : 'auto'}
          style={{ flex: 1, backgroundColor: 'transparent' }}
        >
          {reachableBody}
        </View>
      ) : (
        // Outer view carries the float shadow; inner clips content to the
        // radius (iOS masksToBounds would otherwise kill the shadow).
        <View
          accessibilityElementsHidden={floatingChrome && shellOverlayOpen}
          aria-hidden={floatingChrome && shellOverlayOpen}
          importantForAccessibility={floatingChrome && shellOverlayOpen ? 'no-hide-descendants' : 'auto'}
          style={{
            flex: 1,
            marginHorizontal: surface.margin,
            marginBottom: surface.margin,
            borderRadius: surface.radius,
            backgroundColor: color.paper,
            ...shadow.surface
          }}
        >
          <View style={{ flex: 1, borderRadius: surface.radius, overflow: 'hidden' }}>{reachableBody}</View>
        </View>
      )}
    </View>
  );
};
