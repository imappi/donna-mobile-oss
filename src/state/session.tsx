import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ApiClient, type Entity, type Principal } from '@core/api';
import { t } from '@core/i18n';
import { shell } from '@/shell';
import { unregisterPush } from './pushRegistration';
import { tokenStore } from './tokenStore';
import { useDeviceSettings } from './deviceSettings';
import { readDevicePreferences } from './devicePreferences';

/**
 * Session state: one ApiClient for the app, the signed-in principal, and
 * the active entity (single-entity default; the switcher writes here).
 *
 * 'locked' is the biometric gate on a RESTORED session (stored tokens +
 * a device with biometrics enrolled): the books stay closed until the
 * device owner proves themselves. A fresh password sign-in is itself
 * authentication, so it never locks. If the gate can't run (no
 * hardware, nothing enrolled, web) the restore proceeds — the gate is
 * a protection where it exists, not a lockout where it doesn't.
 */
type SessionState =
  | { phase: 'loading' }
  | { phase: 'locked' }
  | { phase: 'signedOut' }
  | { phase: 'signedIn'; principal: Principal; entities: Entity[]; entityId: string };

type SessionContextValue = {
  locale: string | null;
  state: SessionState;
  api: ApiClient;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** From the 'locked' phase: biometric prompt, then session restore. False = not unlocked. */
  unlock: () => Promise<boolean>;
  switchEntity: (entityId: string) => void;
  applyProfileUpdate: (principal: Principal, entity: Entity) => void;
};

const biometricGateApplies = async (): Promise<boolean> => {
  if (!(await readDevicePreferences()).biometrics) return false;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
};

const SessionContext = createContext<SessionContextValue | null>(null);

export const useSession = () => {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession outside SessionProvider');
  return value;
};

/** The active entity id — screens call this; only signed-in screens mount. */
export const useEntityId = () => {
  const { state } = useSession();
  if (state.phase !== 'signedIn') throw new Error('useEntityId while signed out');
  return state.entityId;
};

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const { value: device } = useDeviceSettings();
  const [state, setState] = useState<SessionState>({ phase: 'loading' });
  const api = useMemo(
    () => new ApiClient(shell.api.baseUrl, tokenStore, () => setState({ phase: 'signedOut' })),
    []
  );

  const resume = useCallback(async () => {
    try {
      const me = await api.getMe();
      setState({
        phase: 'signedIn',
        principal: me.principal,
        entities: me.entities,
        entityId: me.default_entity_id
      });
    } catch {
      setState({ phase: 'signedOut' });
    }
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = await tokenStore.get();
      if (cancelled) return;
      if (!tokens) {
        setState({ phase: 'signedOut' });
        return;
      }
      if (await biometricGateApplies()) {
        if (!cancelled) setState({ phase: 'locked' });
        return;
      }
      if (!cancelled) await resume();
    })();
    return () => {
      cancelled = true;
    };
  }, [api, resume]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await api.signIn(email, password);
      setState({
        phase: 'signedIn',
        principal: session.principal,
        entities: session.entities,
        entityId: session.default_entity_id
      });
    },
    [api]
  );

  const signOut = useCallback(async () => {
    // Push unregistration needs the bearer token — before signOut clears it.
    await unregisterPush(api);
    try {
      await api.signOut();
    } finally {
      // Logging out locally must not depend on the network accepting the
      // best-effort server revocation; ApiClient clears the token in either case.
      setState({ phase: 'signedOut' });
    }
  }, [api]);

  const unlock = useCallback(async () => {
    if (state.phase !== 'locked') return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('auth.biometricPrompt'),
        cancelLabel: t('common.cancel')
      });
      if (!result.success) return false;
    } catch {
      return false;
    }
    await resume();
    return true;
  }, [state.phase, resume]);

  const switchEntity = useCallback((entityId: string) => {
    setState((prev) => (prev.phase === 'signedIn' ? { ...prev, entityId } : prev));
  }, []);

  const applyProfileUpdate = useCallback((principal: Principal, entity: Entity) => {
    setState((previous) =>
      previous.phase === 'signedIn'
        ? {
            ...previous,
            principal,
            entities: previous.entities.map((item) => (item.id === entity.id ? entity : item))
          }
        : previous
    );
  }, []);

  const value = useMemo(
    () => ({ state, api, signIn, signOut, unlock, switchEntity, applyProfileUpdate, locale: device.locale }),
    [state, api, signIn, signOut, unlock, switchEntity, applyProfileUpdate, device.locale]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
