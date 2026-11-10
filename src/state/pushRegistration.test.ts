import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../../core/api/client';
import { androidChannelName, submitRegistration, type StoredRegistration } from './pushRegistrationFlow';

test('every sign-in registers, even with an unchanged device token', async () => {
  let stored: StoredRegistration | null = null;
  const calls: unknown[] = [];
  const deps = {
    api: {
      registerForPush: async (input: unknown) => {
        calls.push(input);
        return { id: 'reg-1' };
      },
      unregisterFromPush: async () => {
        throw new Error('nothing was replaced');
      }
    },
    readStored: async () => stored,
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

/** A device with one stored registration and a server that mints an id per token. */
const device = (initial: StoredRegistration | null, unregister: (id: string) => Promise<void>) => {
  let stored = initial;
  const log: string[] = [];
  const ids: Record<string, string> = { 'ExponentPushToken[old]': 'reg-old', 'ExponentPushToken[new]': 'reg-new' };
  return {
    log,
    stored: () => stored,
    deps: {
      api: {
        registerForPush: async (input: { expo_push_token: string }) => {
          log.push(`register ${input.expo_push_token}`);
          return { id: ids[input.expo_push_token] };
        },
        unregisterFromPush: async (id: string) => {
          log.push(`unregister ${id}`);
          await unregister(id);
        }
      },
      readStored: async () => stored,
      writeStored: async (registration: StoredRegistration) => {
        log.push(`store ${JSON.stringify(registration)}`);
        stored = registration;
      }
    }
  };
};
const rotated = { platform: 'ios' as const, expo_push_token: 'ExponentPushToken[new]', locale: 'en' as const };

test('a rotated device token removes the registration it replaces, after storing the new one', async () => {
  const phone = device({ id: 'reg-old', token: 'ExponentPushToken[old]' }, async () => {});
  await submitRegistration(phone.deps, rotated);
  assert.deepEqual(phone.stored(), { id: 'reg-new', token: 'ExponentPushToken[new]' });
  const unregisterAt = phone.log.indexOf('unregister reg-old');
  assert.ok(unregisterAt > 0, phone.log.join('\n'));
  assert.ok(phone.log.findIndex((line) => line.includes('"id":"reg-new"')) < unregisterAt, 'the new id is stored first');
});

test('an unchanged token removes nothing', async () => {
  const phone = device({ id: 'reg-new', token: 'ExponentPushToken[new]' }, async () => {});
  await submitRegistration(phone.deps, rotated);
  assert.ok(!phone.log.some((line) => line.startsWith('unregister')));
  assert.deepEqual(phone.stored(), { id: 'reg-new', token: 'ExponentPushToken[new]' });
});

test('a failed removal keeps the new registration and retries the old one next time', async () => {
  let online = false;
  const phone = device({ id: 'reg-old', token: 'ExponentPushToken[old]' }, async () => {
    if (!online) throw new ApiError(503, 'UNAVAILABLE', 'Down');
  });
  await submitRegistration(phone.deps, rotated);
  assert.deepEqual(phone.stored(), { id: 'reg-new', token: 'ExponentPushToken[new]', replaced_ids: ['reg-old'] });

  online = true;
  await submitRegistration(phone.deps, rotated);
  assert.equal(phone.log.filter((line) => line === 'unregister reg-old').length, 2);
  assert.deepEqual(phone.stored(), { id: 'reg-new', token: 'ExponentPushToken[new]' });
});

test('a registration the server no longer has (404) counts as removed', async () => {
  const phone = device({ id: 'reg-old', token: 'ExponentPushToken[old]' }, async () => {
    throw new ApiError(404, 'NOT_FOUND', 'Gone');
  });
  await submitRegistration(phone.deps, rotated);
  assert.deepEqual(phone.stored(), { id: 'reg-new', token: 'ExponentPushToken[new]' });
});
