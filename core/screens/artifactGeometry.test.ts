import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveArtifactVerticalGeometry } from '../design/artifactGeometry';

test('artifact composer clears the device safe area without a keyboard', () => {
  assert.deepEqual(resolveArtifactVerticalGeometry({ keyboardOverlap: null, safeBottom: 34 }), {
    composerBottom: 44,
    threadPaddingBottom: 126
  });
});

test('artifact composer and reading flow clear the native keyboard frame', () => {
  assert.deepEqual(resolveArtifactVerticalGeometry({ keyboardOverlap: 301, safeBottom: 34 }), {
    composerBottom: 315,
    threadPaddingBottom: 397
  });
});

test('conversation actions reserve their measured space above the composer', () => {
  assert.deepEqual(
    resolveArtifactVerticalGeometry({ keyboardOverlap: null, safeBottom: 34, dockHeight: 110 }),
    {
      composerBottom: 44,
      threadPaddingBottom: 178
    }
  );
});
