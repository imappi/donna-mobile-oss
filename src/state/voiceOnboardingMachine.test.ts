import assert from 'node:assert/strict';
import test from 'node:test';
import type { VoiceOnboardingDraft } from '@core/api';
import {
  initialVoiceOnboardingState,
  recordingMimeType,
  voiceDisplayDuration,
  voiceOnboardingReducer,
  voiceScreenPresentation
} from './voiceOnboardingMachine';

const draft = { transcript: 'review' } as VoiceOnboardingDraft;

test('recording UI covers consent, ready, record, pause, processing, success and retry', () => {
  let state = initialVoiceOnboardingState;
  assert.equal(voiceScreenPresentation(state).primary, 'allow');
  state = voiceOnboardingReducer(state, { type: 'PERMISSION_GRANTED' });
  state = voiceOnboardingReducer(state, { type: 'START' });
  assert.equal(voiceScreenPresentation(state).secondary, 'pause');
  state = voiceOnboardingReducer(state, { type: 'PAUSE' });
  assert.equal(voiceScreenPresentation(state).status, 'paused');
  state = voiceOnboardingReducer(state, { type: 'RESUME' });
  state = voiceOnboardingReducer(state, { type: 'FINISH', durationSeconds: 12.4 });
  assert.equal(state.phase, 'processing');
  state = voiceOnboardingReducer(state, { type: 'PROCESS_FAILED', reason: 'transcription' });
  assert.equal(voiceScreenPresentation(state).primary, 'retry');
  state = voiceOnboardingReducer(state, { type: 'RETRY' });
  state = voiceOnboardingReducer(state, { type: 'PROCESS_SUCCEEDED', draft });
  assert.equal(voiceScreenPresentation(state).primary, 'review');
  assert.equal(voiceScreenPresentation(state).secondary, 'record_again');
});

test('permission denial, cancellation and interruption never leave onboarding stuck', () => {
  const denied = voiceOnboardingReducer(initialVoiceOnboardingState, { type: 'PERMISSION_DENIED' });
  assert.deepEqual(denied, { phase: 'failure', reason: 'permission_denied', retryable: false });

  const recording = voiceOnboardingReducer(
    voiceOnboardingReducer(initialVoiceOnboardingState, { type: 'PERMISSION_GRANTED' }),
    { type: 'START' }
  );
  assert.deepEqual(voiceOnboardingReducer(recording, { type: 'CANCEL' }), {
    phase: 'ready',
    notice: 'discarded'
  });
  assert.deepEqual(voiceOnboardingReducer(recording, { type: 'INTERRUPTED' }), {
    phase: 'failure',
    reason: 'interrupted',
    retryable: false
  });
});

test('oversized audio cannot be retried without a fresh recording', () => {
  const processing = { phase: 'processing', durationSeconds: 12.4 } as const;
  const failed = voiceOnboardingReducer(processing, { type: 'PROCESS_FAILED', reason: 'oversized' });
  assert.deepEqual(failed, {
    phase: 'failure',
    reason: 'oversized',
    retryable: false,
    durationSeconds: 12.4,
    message: undefined
  });
});

test('native file uploads use a supported recording MIME type', () => {
  assert.equal(recordingMimeType('file:///cache/introduction.m4a', 'application/octet-stream'), 'audio/mp4');
  assert.equal(recordingMimeType('file:///cache/introduction.webm', ''), 'audio/webm');
  assert.equal(recordingMimeType('file:///cache/introduction.wav', 'audio/wav'), 'audio/wav');
});

test('stopping the native recorder does not zero the completed clip duration', () => {
  assert.equal(voiceDisplayDuration({ phase: 'recording' }, 12.4), 12.4);
  assert.equal(voiceDisplayDuration({ phase: 'processing', durationSeconds: 12.4 }, 0), 12.4);
  assert.equal(
    voiceDisplayDuration({ phase: 'success', durationSeconds: 12.4, draft }, 0),
    12.4
  );
});

test('a recorder failure asks for a clean restart instead of retrying a missing file', () => {
  const failed = voiceOnboardingReducer(
    { phase: 'recording' },
    { type: 'PROCESS_FAILED', reason: 'recording' }
  );
  assert.equal(failed.phase, 'failure');
  assert.equal(failed.phase === 'failure' && failed.retryable, false);
  assert.equal(voiceScreenPresentation(failed).primary, 'restart');
  assert.equal(voiceScreenPresentation(failed).canDiscard, false);
});
