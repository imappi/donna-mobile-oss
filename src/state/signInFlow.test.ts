import assert from 'node:assert/strict';
import test from 'node:test';
import { signInAndDestination, type SignInCredentials } from './signInFlow';

test('credential and demo entry use the same session action and converge on Books', async () => {
  const attempts: SignInCredentials[] = [];
  const signIn = async (email: string, password: string) => {
    attempts.push({ email, password });
  };
  const credentials = { email: 'owner@example.test', password: 'owner-pass' };
  const demo = { email: 'demo@example.test', password: 'demo-pass' };

  assert.equal(await signInAndDestination(signIn, credentials), '/actions');
  assert.equal(await signInAndDestination(signIn, demo), '/actions');
  assert.deepEqual(attempts, [credentials, demo]);
});
