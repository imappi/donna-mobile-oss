import assert from 'node:assert/strict';
import test from 'node:test';
import { androidChannelName, submitRegistration, type StoredRegistration } from './pushRegistrationFlow';

test('every sign-in registers, even with an unchanged device token', async () => {
  let stored: StoredRegistration | null = null;
  const calls: unknown[] = [];
  const deps = {
    api: {
      registerForPush: async (input: unknown) => {
        calls.push(input);
        return { id: 'reg-1' };
      }
    },
    writeStored: async (r: StoredRegistration) => {
      stored = r;
    }
  };
  const input = { platform: 'ios' as const, expo_push_token: 'ExponentPushToken[a]', locale: 'fi' as const };
  await submitRegistration(deps, input);
  await submitRegistration(deps, input);
  assert.equal(calls.length, 2);
  assert.deepEqual(stored, { id: 'reg-1', token: 'ExponentPushToken[a]' });
});

test('the Android channel takes the shell brand name, not a hardcoded one', () => {
  assert.equal(androidChannelName({ brandName: 'Fork Books' }), 'Fork Books');
});
