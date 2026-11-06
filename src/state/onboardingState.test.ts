import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createOnboardingStore,
  firstEntryHref,
  ONBOARDING_STORAGE_KEY,
  type OnboardingStorage
} from './onboardingState';

const memoryStorage = (): OnboardingStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    }
  };
};

test('a first signed-out launch waits for preference loading, then opens welcome', () => {
  assert.equal(firstEntryHref('loading', 'incomplete'), null);
  assert.equal(firstEntryHref('signedOut', 'loading'), null);
  assert.equal(firstEntryHref('signedOut', 'incomplete'), '/welcome');
});

test('welcome completion persists and returning signed-out users reach Finland phone entry', async () => {
  const storage = memoryStorage();
  const store = createOnboardingStore(storage);

  assert.equal(await store.getStatus(), 'incomplete');
  await store.complete();
  assert.equal(storage.values.get(ONBOARDING_STORAGE_KEY), 'complete');
  assert.equal(await store.getStatus(), 'complete');
  assert.equal(firstEntryHref('signedOut', await store.getStatus()), '/onboarding/phone');
});

test('restored authenticated and locked sessions bypass onboarding before its marker resolves', () => {
  assert.equal(firstEntryHref('locked', 'loading'), '/unlock');
  assert.equal(firstEntryHref('signedIn', 'loading'), '/actions');
  assert.equal(firstEntryHref('signedIn', 'incomplete'), '/actions');
});

test('preference read failure fails open to phone entry instead of trapping authentication', async () => {
  const store = createOnboardingStore({
    getItem: async () => {
      throw new Error('storage unavailable');
    },
    setItem: async () => undefined
  });

  assert.equal(await store.getStatus(), 'complete');
  assert.equal(firstEntryHref('signedOut', await store.getStatus()), '/onboarding/phone');
});
