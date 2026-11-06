import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router } from 'expo-router';
import { hrefForDeepLink, type DeepLink } from './deepLink';
import { registerPush } from './pushRegistration';
import { useSession } from './session';
import { readDevicePreferences } from './devicePreferences';

/**
 * The push bridge: registers the device once a session is up, shows
 * foreground notifications quietly, and routes a tap through the same
 * deep-link mapping the Activity list uses. Renders nothing.
 *
 * The payload contract (documented in contract/DESIGN-NOTES.md): the
 * backend sends {title, body, data.deep_link} with deep_link exactly
 * the ActivityEvent shape — one vocabulary for "where this lands".
 */
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
const notificationsUnavailable =
  Platform.OS === 'android' &&
  (Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.expoGoConfig != null);
const Notifications: typeof import('expo-notifications') | null = notificationsUnavailable
  ? null
  // Android Expo Go must not evaluate this native module at all.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  : require('expo-notifications');

if (isNative && Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const { notifications } = await readDevicePreferences();
      return {
        shouldShowBanner: notifications,
        shouldShowList: notifications,
        shouldPlaySound: false,
        shouldSetBadge: notifications
      };
    }
  });
}

const NativePushBridge = () => {
  if (!Notifications) throw new Error('NativePushBridge mounted without notifications');
  const { state, api } = useSession();
  const signedIn = state.phase === 'signedIn';
  const lastHandled = useRef<string | null>(null);
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!signedIn) return;
    registerPush(api);
  }, [signedIn, api]);

  useEffect(() => {
    if (!signedIn || !lastResponse) return;
    const requestId = lastResponse.notification.request.identifier;
    if (lastHandled.current === requestId) return;
    lastHandled.current = requestId;
    const data = lastResponse.notification.request.content.data as
      | { deep_link?: DeepLink | null }
      | null
      | undefined;
    const href = hrefForDeepLink(data?.deep_link ?? null);
    if (href) router.push(href);
  }, [signedIn, lastResponse]);

  return null;
};

/** Platform split at the component boundary — no native hook runs on web. */
export const PushBridge = () => (isNative && Notifications ? <NativePushBridge /> : null);
