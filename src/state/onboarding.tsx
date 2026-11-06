import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createOnboardingStore, type OnboardingStatus } from './onboardingState';

type OnboardingContextValue = {
  status: OnboardingStatus;
  complete: () => Promise<void>;
};

const onboardingStore = createOnboardingStore(AsyncStorage);
const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export const useOnboarding = () => {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('useOnboarding outside OnboardingProvider');
  return value;
};

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    onboardingStore.getStatus().then((storedStatus) => {
      if (!cancelled) setStatus((current) => (current === 'complete' ? current : storedStatus));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const complete = useCallback(async () => {
    try {
      await onboardingStore.complete();
    } catch {
      // Keep the running app unblocked if device preference storage fails.
    } finally {
      setStatus('complete');
    }
  }, []);

  const value = useMemo(() => ({ status, complete }), [complete, status]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};
