export type OnboardingStatus = 'loading' | 'incomplete' | 'complete';
export type SessionPhase = 'loading' | 'locked' | 'signedOut' | 'signedIn';

export type FirstEntryHref = '/unlock' | '/actions' | '/welcome' | '/onboarding/phone' | null;

export const firstEntryHref = (
  sessionPhase: SessionPhase,
  onboardingStatus: OnboardingStatus
): FirstEntryHref => {
  if (sessionPhase === 'loading') return null;
  if (sessionPhase === 'locked') return '/unlock';
  if (sessionPhase === 'signedIn') return '/actions';
  if (onboardingStatus === 'loading') return null;
  return onboardingStatus === 'complete' ? '/onboarding/phone' : '/welcome';
};

export type OnboardingStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export const ONBOARDING_STORAGE_KEY = 'donna.presentation.onboarding.v1';
const COMPLETE_VALUE = 'complete';

export const createOnboardingStore = (storage: OnboardingStorage) => ({
  getStatus: async (): Promise<Exclude<OnboardingStatus, 'loading'>> => {
    try {
      return (await storage.getItem(ONBOARDING_STORAGE_KEY)) === COMPLETE_VALUE
        ? 'complete'
        : 'incomplete';
    } catch {
      // Onboarding must never become a new door in front of authentication.
      return 'complete';
    }
  },
  complete: async (): Promise<void> => {
    await storage.setItem(ONBOARDING_STORAGE_KEY, COMPLETE_VALUE);
  }
});
