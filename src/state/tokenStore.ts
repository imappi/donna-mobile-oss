import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { TokenPair, TokenStore } from '@core/api';

const KEY = 'donna.session.tokens';

/**
 * Token persistence: SecureStore on device (what biometric unlock wraps),
 * localStorage on web (dev/demo surface only).
 */
export const tokenStore: TokenStore =
  Platform.OS === 'web'
    ? {
        get: async () => {
          try {
            const raw = globalThis.localStorage?.getItem(KEY);
            return raw ? (JSON.parse(raw) as TokenPair) : null;
          } catch {
            return null;
          }
        },
        set: async (tokens) => {
          globalThis.localStorage?.setItem(KEY, JSON.stringify(tokens));
        },
        clear: async () => {
          globalThis.localStorage?.removeItem(KEY);
        }
      }
    : {
        get: async () => {
          const raw = await SecureStore.getItemAsync(KEY);
          return raw ? (JSON.parse(raw) as TokenPair) : null;
        },
        set: async (tokens) => {
          await SecureStore.setItemAsync(KEY, JSON.stringify(tokens));
        },
        clear: async () => {
          await SecureStore.deleteItemAsync(KEY);
        }
      };
