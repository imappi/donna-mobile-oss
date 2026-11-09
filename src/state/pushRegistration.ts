import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import type { ApiClient } from '@core/api';
import { getLocale } from '@core/i18n';
import { notificationPermissionGranted } from './notificationPermission';
import { readDevicePreferences } from './devicePreferences';
import { pushProjectId } from './pushProjectId';

/**
 * Device push registration against the contract's
 * /notifications/registrations seam. Everything here is BEST-EFFORT:
 * push is a convenience channel, so no failure in it may ever block
 * sign-in, sign-out, or the session — errors log and yield.
 *
 * The stored pair {id, token} makes re-registration idempotent
 * app-side (same token → skip). The matching server-side expectation —
 * the backend upserts on (principal, token) rather than growing a
 * registration per app start — is recorded in contract/DESIGN-NOTES.md.
 */
const REG_KEY = 'donna.push.registration';

type StoredRegistration = { id: string; token: string };

const readStored = async (): Promise<StoredRegistration | null> => {
  try {
    const raw = await SecureStore.getItemAsync(REG_KEY);
    return raw ? (JSON.parse(raw) as StoredRegistration) : null;
  } catch {
    return null;
  }
};

/** Session restore only registers existing permission. Only the explicit Allow action asks. */
export const registerPush = async (api: ApiClient, requestPermission = false): Promise<void> => {
  if (!(await readDevicePreferences()).notifications) return;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  // Android Expo Go no longer ships the remote-notifications native module.
  // Development and production builds still load the real module below.
  if (
    Platform.OS === 'android' &&
    (Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.expoGoConfig != null)
  ) return;
  // Without an EAS project id there is no push token to get; do not ask for
  // a permission that could not be used. Notifications stay unavailable.
  const projectId = pushProjectId(Constants);
  if (!projectId) {
    console.info('[push] unavailable: this build has no EAS project id');
    return;
  }
  try {
    const Notifications = await import('expo-notifications');
    if (!(await notificationPermissionGranted(Notifications, requestPermission))) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Donna',
        importance: Notifications.AndroidImportance.DEFAULT
      });
    }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const stored = await readStored();
    if (stored?.token === token) return;
    const { id } = await api.registerForPush({
      platform: Platform.OS,
      expo_push_token: token,
      locale: getLocale()
    });
    await SecureStore.setItemAsync(REG_KEY, JSON.stringify({ id, token } satisfies StoredRegistration));
  } catch (e) {
    console.warn('[push] registration skipped', e);
  }
};

/** Called BEFORE sign-out clears the tokens (the DELETE needs auth). */
export const unregisterPush = async (api: ApiClient): Promise<void> => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  try {
    const stored = await readStored();
    if (!stored) return;
    await api.unregisterFromPush(stored.id);
    await SecureStore.deleteItemAsync(REG_KEY);
  } catch (e) {
    console.warn('[push] unregistration skipped', e);
  }
};
