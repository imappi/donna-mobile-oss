import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { color, ToastHost } from '@core/design';
import { setBrandName, setLocale } from '@core/i18n';
import { shell } from '@/shell';
import { CaptureQueueProvider } from '@/state/captureQueue';
import { OnboardingProvider, useOnboarding } from '@/state/onboarding';
import { OnboardingProfileProvider } from '@/state/onboardingProfile';
import { PushBridge } from '@/state/push';
import { SessionProvider, useSession } from '@/state/session';
import { DeviceSettingsProvider } from '@/state/deviceSettings';

setBrandName(shell.brandName);
setLocale(shell.defaultLocale);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5000, retry: 1 } }
});

const OnboardingSessionBridge = () => {
  const { state } = useSession();
  const { status, complete } = useOnboarding();

  React.useEffect(() => {
    if ((state.phase === 'locked' || state.phase === 'signedIn') && status !== 'complete') {
      void complete();
    }
  }, [complete, state.phase, status]);

  return null;
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <OnboardingProvider>
          <OnboardingProfileProvider>
            <DeviceSettingsProvider><SessionProvider>
              <OnboardingSessionBridge />
              <ToastHost>
                <CaptureQueueProvider>
                  <PushBridge />
                  <StatusBar style="dark" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: color.paper }
                    }}
                  >
                  </Stack>
                </CaptureQueueProvider>
              </ToastHost>
            </SessionProvider></DeviceSettingsProvider>
          </OnboardingProfileProvider>
        </OnboardingProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
