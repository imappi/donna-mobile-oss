import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveChatVerticalGeometry } from './chatGeometry';

test('chat composer clears the safe area without reserving a launcher', () => {
  assert.deepEqual(resolveChatVerticalGeometry({ keyboardOverlap: null, safeBottom: 34 }), {
    composerBottom: 44,
    threadPaddingBottom: 122
  });
});

test('native keyboard overlap raises both composer and thread clearance', () => {
  assert.deepEqual(resolveChatVerticalGeometry({ keyboardOverlap: 301, safeBottom: 34 }), {
    composerBottom: 315,
    threadPaddingBottom: 393
  });
});
