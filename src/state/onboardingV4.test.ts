import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreviewCodeAttempt, resendSecondsRemaining } from './onboardingCode';
import { createNotificationMoment, notificationPermissionGranted } from './notificationPermission';
import { formatMonth, setLocale } from '@core/i18n';

test('sixth-digit verification accepts only the preview code and is single-flight, including autofill', async () => {
  const attempt = createPreviewCodeAttempt();
  let calls = 0;
  let finish!: () => void;
  const signIn = () => { calls++; return new Promise<void>(resolve => { finish = resolve; }); };
  assert.equal(await attempt.submit('123456', signIn), 'invalid');
  assert.equal(await attempt.submit('11111', signIn), 'invalid');
  assert.equal(calls, 0);
  const first = attempt.submit('111111', signIn);
  assert.equal(await attempt.submit('111111', signIn), 'ignored');
  finish();
  assert.equal(await first, 'success');
  assert.equal(await attempt.submit('111111', signIn), 'ignored');
  assert.equal(calls, 1);
});

test('failed code sign-in can retry and resend countdown uses a deadline across background time', async () => {
  const attempt = createPreviewCodeAttempt();
  assert.equal(await attempt.submit('111111', async () => { throw Error('offline'); }), 'failed');
  assert.equal(await attempt.submit('111111', async () => {}), 'success');
  assert.equal(resendSecondsRemaining(31000, 1000), 30);
  assert.equal(resendSecondsRemaining(31000, 30999), 1);
  assert.equal(resendSecondsRemaining(31000, 99999), 0);
});

test('sign-in/restoration cannot show an OS notification prompt; only explicit Allow can ask', async () => {
  let asks = 0;
  const source = { getPermissionsAsync: async () => ({ granted: false, canAskAgain: true }),
    requestPermissionsAsync: async () => { asks++; return { granted: true, canAskAgain: true }; } };
  assert.equal(await notificationPermissionGranted(source, false), false);
  assert.equal(asks, 0);
  assert.equal(await notificationPermissionGranted(source, true), true);
  assert.equal(asks, 1);
  source.getPermissionsAsync = async () => ({ granted: false, canAskAgain: false });
  assert.equal(await notificationPermissionGranted(source, true), false);
  source.getPermissionsAsync = async () => ({ granted: true, canAskAgain: true });
  assert.equal(await notificationPermissionGranted(source, false), true);
  assert.equal(asks, 1);
});

test('notification introduction requires fresh confirmation, is once per principal and cannot restore a pending prompt', async () => {
  const values = new Map<string, string>();
  const storage = { getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => { values.set(key, value); } };
  const moment = createNotificationMoment(storage);
  assert.equal(moment.isPending('owner-a'), false); // skip/direct link
  assert.equal(await moment.offerAfterConfirmation('owner-a'), true);
  assert.equal(moment.isPending('owner-a'), true);
  assert.equal(moment.isPending('owner-b'), false);
  const restored = createNotificationMoment(storage);
  assert.equal(restored.isPending('owner-a'), false);
  assert.equal(await restored.offerAfterConfirmation('owner-a'), false);
  moment.finish(); // both Allow and Not now
  assert.equal(moment.isPending('owner-a'), false);
  assert.equal(await moment.offerAfterConfirmation('owner-b'), true);
  const broken = createNotificationMoment({ getItem: async () => { throw Error('storage'); }, setItem: async () => {} });
  assert.equal(await broken.offerAfterConfirmation('owner-a'), false);
});

test('Finnish Books period is formatted from the calendar fact rather than English server copy', () => {
  setLocale('fi'); assert.equal(formatMonth('2026-09'), 'syyskuu 2026');
  setLocale('en'); assert.equal(formatMonth('2026-09'), 'September 2026');
});
