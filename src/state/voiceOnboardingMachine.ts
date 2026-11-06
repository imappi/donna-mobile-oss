import type { VoiceOnboardingDraft } from '@core/api';

export const MAX_VOICE_RECORDING_SECONDS = 5 * 60;
export const MAX_VOICE_RECORDING_BYTES = 8 * 1024 * 1024;

const supportedRecordingTypes = new Set([
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm'
]);

export const recordingMimeType = (uri: string, reportedType?: string | null) => {
  const normalized = String(reportedType || '').split(';')[0].trim().toLowerCase();
  if (supportedRecordingTypes.has(normalized)) return normalized;
  const extension = uri.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  if (extension === 'webm') return 'audio/webm';
  if (extension === 'wav') return 'audio/wav';
  if (extension === 'mp3' || extension === 'mpeg') return 'audio/mpeg';
  return 'audio/mp4';
};

export const formatVoiceDuration = (seconds: number) => {
  const bounded = Math.max(0, Math.min(MAX_VOICE_RECORDING_SECONDS, Math.floor(seconds)));
  return `${String(Math.floor(bounded / 60)).padStart(2, '0')}:${String(bounded % 60).padStart(2, '0')}`;
};

/** Native recorder state resets after stop; preserve the completed clip's duration outside live phases. */
export const voiceDisplayDuration = (
  state: VoiceOnboardingState,
  liveSeconds: number
) => {
  if (state.phase === 'recording' || state.phase === 'paused') return liveSeconds;
  if (state.phase === 'processing' || state.phase === 'success' || state.phase === 'failure') {
    return state.durationSeconds ?? 0;
  }
  return 0;
};

export type VoiceFailure =
  | 'permission_denied'
  | 'interrupted'
  | 'recording'
  | 'oversized'
  | 'connectivity'
  | 'transcription'
  | 'extraction'
  | 'unknown';

export type VoiceOnboardingState =
  | { phase: 'consent' }
  | { phase: 'ready'; notice?: 'discarded' }
  | { phase: 'recording' }
  | { phase: 'paused' }
  | { phase: 'processing'; durationSeconds: number }
  | { phase: 'success'; draft: VoiceOnboardingDraft; durationSeconds: number }
  | { phase: 'failure'; reason: VoiceFailure; retryable: boolean; durationSeconds?: number; message?: string };

export type VoiceOnboardingEvent =
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'FINISH'; durationSeconds: number }
  | { type: 'PROCESS_SUCCEEDED'; draft: VoiceOnboardingDraft }
  | { type: 'PROCESS_FAILED'; reason: VoiceFailure; message?: string }
  | { type: 'RETRY' }
  | { type: 'INTERRUPTED' }
  | { type: 'CANCEL' }
  | { type: 'RESET' };

export const initialVoiceOnboardingState: VoiceOnboardingState = { phase: 'consent' };

export const voiceOnboardingReducer = (
  state: VoiceOnboardingState,
  event: VoiceOnboardingEvent
): VoiceOnboardingState => {
  switch (event.type) {
    case 'PERMISSION_GRANTED':
      return state.phase === 'consent' || state.phase === 'failure' ? { phase: 'ready' } : state;
    case 'PERMISSION_DENIED':
      return { phase: 'failure', reason: 'permission_denied', retryable: false };
    case 'START':
      return state.phase === 'ready' ? { phase: 'recording' } : state;
    case 'PAUSE':
      return state.phase === 'recording' ? { phase: 'paused' } : state;
    case 'RESUME':
      return state.phase === 'paused' ? { phase: 'recording' } : state;
    case 'FINISH':
      return state.phase === 'recording' || state.phase === 'paused'
        ? { phase: 'processing', durationSeconds: event.durationSeconds }
        : state;
    case 'PROCESS_SUCCEEDED':
      return state.phase === 'processing'
        ? { phase: 'success', draft: event.draft, durationSeconds: state.durationSeconds }
        : state;
    case 'PROCESS_FAILED':
      return {
        phase: 'failure',
        reason: event.reason,
        retryable: ['connectivity', 'transcription', 'extraction'].includes(event.reason),
        durationSeconds:
          state.phase === 'processing' || state.phase === 'success' || state.phase === 'failure'
            ? state.durationSeconds
            : undefined,
        message: event.message
      };
    case 'RETRY':
      return state.phase === 'failure' && state.retryable
        ? { phase: 'processing', durationSeconds: state.durationSeconds ?? 0 }
        : state;
    case 'INTERRUPTED':
      return state.phase === 'recording' || state.phase === 'paused'
        ? { phase: 'failure', reason: 'interrupted', retryable: false }
        : state;
    case 'CANCEL':
      return { phase: 'ready', notice: 'discarded' };
    case 'RESET':
      return initialVoiceOnboardingState;
  }
};

export type VoiceScreenPresentation = {
  status: VoiceOnboardingState['phase'] | 'permission_denied' | 'discarded';
  primary: 'allow' | 'start' | 'finish' | 'use' | 'processing' | 'review' | 'retry' | 'restart';
  secondary?: 'pause' | 'resume' | 'record_again';
  canDiscard: boolean;
};

export const voiceScreenPresentation = (state: VoiceOnboardingState): VoiceScreenPresentation => {
  switch (state.phase) {
    case 'consent':
      return { status: 'consent', primary: 'allow', canDiscard: false };
    case 'ready':
      return { status: state.notice === 'discarded' ? 'discarded' : 'ready', primary: 'start', canDiscard: false };
    case 'recording':
      return { status: 'recording', primary: 'finish', secondary: 'pause', canDiscard: true };
    case 'paused':
      return { status: 'paused', primary: 'use', secondary: 'resume', canDiscard: true };
    case 'processing':
      return { status: 'processing', primary: 'processing', canDiscard: true };
    case 'success':
      return { status: 'success', primary: 'review', secondary: 'record_again', canDiscard: false };
    case 'failure':
      return {
        status: state.reason === 'permission_denied' ? 'permission_denied' : 'failure',
        primary: state.retryable ? 'retry' : 'restart',
        canDiscard: !['permission_denied', 'interrupted', 'recording'].includes(state.reason)
      };
  }
};
