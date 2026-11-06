import React, { useState } from 'react';
import { Redirect, Stack as RouterStack, useRouter, usePathname } from 'expo-router';
import { FloatingDonnaButton, ShellHeaderMenuProvider, ShellOverlayAccessibilityProvider, Stack as ShellFrame } from '@core/design';
import { t } from '@core/i18n';
import { settingsText } from '@core/i18n/settings';
import { shell } from '@/shell';
import { useCaptureActions } from '@/state/captureActions';
import { useQueue } from '@/state/hooks';
import { useSession } from '@/state/session';
import { destinationForLauncherAction, LAUNCHER_ACTIONS, type LauncherActionKey } from '@/state/shellNavigation';

const ChromeStack = () => {
  const { addFile, snapReceipt } = useCaptureActions();
  const queue = useQueue();
  const router = useRouter();
  const pathname = usePathname();
  const [donnaOpen, setDonnaOpen] = useState(false);
  const attentionCount = queue.data?.needs_you_count ?? 0;
  const headerMenuValue = {
    open: false,
    onOpen: () => { setDonnaOpen(false); router.push('/settings'); },
    attentionCount,
    accessibilityLabel: settingsText('settings')
  };
  const onLauncherAction = async (key: LauncherActionKey) => {
    setDonnaOpen(false);
    const destination = destinationForLauncherAction(key);
    if (destination) {
      if (destination === '/chat') router.navigate(destination);
      else router.push(destination);
      return;
    }
    if (key === 'snap') await snapReceipt();
    else await addFile();
  };
  return <RouterStack initialRouteName="actions" layout={({ children }) => (
    <ShellHeaderMenuProvider value={headerMenuValue}>
      <ShellOverlayAccessibilityProvider hidden={donnaOpen}>
        <ShellFrame grow>
          {children}
          {pathname !== '/chat' ? <FloatingDonnaButton
            accessibilityLabel={t(donnaOpen ? 'tabs.donnaMenuExpanded' : 'tabs.donnaMenuCollapsed')}
            image={shell.mascot} open={donnaOpen} onPress={() => setDonnaOpen(open => !open)}
            launcher={{ mascot:shell.mascot, dismissLabel:t('plus.dismiss'),
              actions:LAUNCHER_ACTIONS.map(action=>({...action,label:t(action.labelKey)})),
              onAction:key=>onLauncherAction(key as LauncherActionKey),onDismiss:()=>setDonnaOpen(false) }} /> : null}
        </ShellFrame>
      </ShellOverlayAccessibilityProvider>
    </ShellHeaderMenuProvider>
  )} screenOptions={{headerShown:false,contentStyle:{backgroundColor:'transparent'}}}>
    <RouterStack.Screen name="actions" options={{title:t('home.title')}} />
    <RouterStack.Screen name="materials" options={{title:t('tabs.materials')}} />
    <RouterStack.Screen name="chat" options={{title:t('tabs.chat')}} />
  </RouterStack>;
};
export default function TabsLayout() {
  const {state}=useSession();
  if(state.phase==='loading')return null;
  if(state.phase==='locked')return <Redirect href="/unlock"/>;
  if(state.phase==='signedOut')return <Redirect href="/onboarding/phone"/>;
  return <ChromeStack/>;
}
