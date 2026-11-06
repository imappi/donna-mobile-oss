import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onboarding, shellGeometry, space } from '../tokens';
import { Ground } from './Ground';
import { Txt } from './Txt';

export type OnboardingPage = 'welcome' | 'phone' | 'code' | 'business' | 'recording' | 'processing' | 'card' | 'notifications';
const centerPages = new Set<OnboardingPage>(['welcome', 'processing', 'notifications']);

/** The handoff specifies per-screen rhythm, not one universal gap. Native safe
 * areas and the OS keyboard replace only the prototype's fake device chrome. */
export const OnboardingLayout = ({ title, body, header, children, footer, page = 'phone', keyboard = false }: {
  title?: string; body?: string; header?: React.ReactNode; children?: React.ReactNode;
  footer?: React.ReactNode; page?: OnboardingPage; keyboard?: boolean;
}) => {
  const insets = useSafeAreaInsets();
  const [keyboardShown, setKeyboardShown] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardShown(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardShown(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const centered = centerPages.has(page);
  const top = Platform.OS === 'web' ? shellGeometry.referenceSafeTop : insets.top;
  const bottom = Platform.OS === 'web' ? shellGeometry.referenceSafeBottom : insets.bottom;
  const topPadding = centered ? 0 : page === 'card' ? onboarding.cardTopInset : onboarding.topInset;
  const gap = page === 'card' ? onboarding.cardGap : page === 'business' || page === 'recording' ? 0 : onboarding.sectionGap;
  return <View style={styles.root}>
    <Ground variant="brand" />
    <KeyboardAvoidingView style={styles.root} enabled={keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={false}
        contentContainerStyle={[styles.scroll, { paddingTop: top + topPadding,
          paddingBottom: keyboardShown && keyboard ? onboarding.bottomInset : bottom + onboarding.homeClearance }]}>
        <View style={[styles.content, { gap }, centered && styles.centered]}>
          {header ?? (title || body ? <View style={{ gap: page === 'card' ? onboarding.titleBodyCardGap : page === 'notifications' ? space.md : onboarding.headerGap }}>
            {title ? <Txt v="onboardingTitle" accessibilityRole="header">{title}</Txt> : null}
            {body ? <Txt v={page === 'card' ? 'onboardingBody' : 'onboardingLead'} tone="soft">{body}</Txt> : null}
          </View> : null)}
          {children}
        </View>
        {footer ? <View style={[styles.footer, page === 'card' && { paddingTop: onboarding.cardGap }]}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </View>;
};

export const OnboardingFocus = ({ children }: { children: React.ReactNode }) =>
  <View style={styles.focus}>{children}</View>;

export const WelcomeCopy = ({ children }: { children: React.ReactNode }) =>
  <View style={styles.welcomeCopy}>{children}</View>;

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: onboarding.screenInset },
  content: { flexGrow: 1 },
  centered: { justifyContent: 'center' },
  footer: { gap: onboarding.footerGap },
  focus: { flexGrow: 1, minHeight: onboarding.focusMinHeight, justifyContent: 'center', alignItems: 'center',
    gap: onboarding.focusGap, paddingVertical: space.rowX },
  welcomeCopy: { maxWidth: onboarding.welcomeCopyWidth, gap: space.md }
});
