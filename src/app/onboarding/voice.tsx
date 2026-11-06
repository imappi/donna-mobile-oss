import React from 'react';
import { AppState, Linking } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { ApiError } from '@core/api';
import { VoiceOnboardingScreen } from '@core/screens/VoiceOnboardingScreen';
import { t } from '@core/i18n';
import { useOnboardingProfile } from '@/state/onboardingProfile';
import { useSession } from '@/state/session';
import { shell } from '@/shell';
import {
  MAX_VOICE_RECORDING_BYTES,
  MAX_VOICE_RECORDING_SECONDS,
  formatVoiceDuration,
  initialVoiceOnboardingState,
  recordingMimeType,
  voiceDisplayDuration,
  voiceOnboardingReducer,
  voiceScreenPresentation,
  type VoiceFailure
} from '@/state/voiceOnboardingMachine';

const recordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64000,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    extension: '.m4a',
    outputFormat: 'mpeg4' as const,
    audioEncoder: 'aac' as const
  },
  isMeteringEnabled: true,
  directory: 'cache' as const
};

const filenameFromUri = (uri: string) => uri.split('/').pop() || 'business-introduction.m4a';

const removeTemporaryAudio = async (uri: string | null) => {
  if (!uri) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
};

const safeRecorderUri = (recorder: ReturnType<typeof useAudioRecorder>) => {
  try {
    return recorder.uri;
  } catch {
    return null;
  }
};

const safeRecorderIsRecording = (recorder: ReturnType<typeof useAudioRecorder>) => {
  try {
    return recorder.isRecording;
  } catch {
    return false;
  }
};

const failureFromCause = (cause: unknown): VoiceFailure => {
  if (cause instanceof ApiError) {
    if (cause.code === 'VOICE_AUDIO_TOO_LARGE') return 'oversized';
    if (cause.code === 'VOICE_TRANSCRIPTION_FAILED') return 'transcription';
    if (cause.code === 'VOICE_EXTRACTION_FAILED' || cause.code === 'VOICE_EXTRACTION_INVALID') return 'extraction';
    if (cause.code === 'VOICE_AUDIO_INVALID' || cause.code === 'VOICE_AUDIO_TYPE_UNSUPPORTED') return 'recording';
  }
  if (cause instanceof Error && /recording file|native shared object/i.test(cause.message)) return 'recording';
  if (cause instanceof TypeError) return 'connectivity';
  return 'unknown';
};

export default function VoiceOnboardingRoute() {
  const { state: session, api } = useSession();
  const profile = useOnboardingProfile();
  const { applyVoiceDraft, beginTyped, restartVoice, voiceRestartVersion } = profile;
  const entityId = session.phase === 'signedIn' ? session.entityId : null;
  const router = useRouter();
  const [state, dispatch] = React.useReducer(voiceOnboardingReducer, initialVoiceOnboardingState);
  const recorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(recorder, 250);
  const pendingAudio = React.useRef<string | null>(null);
  const pendingDuration = React.useRef(0);
  const requestController = React.useRef<AbortController | null>(null);
  const stopInFlight = React.useRef(false);
  const primaryInFlight = React.useRef(false);
  const requestVersion = React.useRef(0);
  const handledVoiceRestartVersion = React.useRef(0);

  const processAudio = React.useCallback(
    async (uri: string, durationSeconds: number) => {
      const version = ++requestVersion.current;
      try {
        const audioResponse = await fetch(uri);
        const audio = await audioResponse.blob();
        if (version !== requestVersion.current) return;
        if (audio.size > MAX_VOICE_RECORDING_BYTES) {
          dispatch({ type: 'PROCESS_FAILED', reason: 'oversized' });
          return;
        }
        const controller = new AbortController();
        requestController.current = controller;
        const mimeType = recordingMimeType(uri, audio.type);
        if (!entityId) throw new Error('A signed-in business is required.');
        const draft = await api.createVoiceOnboardingDraft(
          entityId,
          audio,
          filenameFromUri(uri),
          mimeType,
          durationSeconds,
          controller.signal
        );
        if (controller.signal.aborted || version !== requestVersion.current) return;
        if (draft.cleanup_mode !== 'model_cleanup') throw new ApiError(422, 'VOICE_EXTRACTION_FAILED', 'A clear introduction is not ready yet.');
        await removeTemporaryAudio(uri);
        if (version !== requestVersion.current) return;
        applyVoiceDraft(draft);
        pendingAudio.current = null;
        pendingDuration.current = 0;
        dispatch({ type: 'PROCESS_SUCCEEDED', draft });
        router.replace('/onboarding/profile');
      } catch (cause) {
        if (version !== requestVersion.current) return;
        if (cause instanceof Error && cause.name === 'AbortError') return;
        if (__DEV__) console.warn('[voice onboarding] processing failed', cause);
        dispatch({
          type: 'PROCESS_FAILED',
          reason: failureFromCause(cause),
          message: cause instanceof Error ? cause.message : undefined
        });
      } finally {
        if (version === requestVersion.current) requestController.current = null;
      }
    },
    [api, applyVoiceDraft, entityId, router]
  );

  const stopAndProcess = React.useCallback(async () => {
    if (stopInFlight.current) return;
    stopInFlight.current = true;
    const version = requestVersion.current;
    try {
      const durationSeconds = Math.max(0.1, recorderState.durationMillis / 1000);
      dispatch({ type: 'FINISH', durationSeconds });
      await recorder.stop();
      const uri = safeRecorderUri(recorder) ?? recorderState.url;
      if (!uri) throw new Error('Recording file was not available.');
      if (version !== requestVersion.current) {
        await removeTemporaryAudio(uri);
        return;
      }
      pendingAudio.current = uri;
      pendingDuration.current = durationSeconds;
      await processAudio(uri, durationSeconds);
    } catch (cause) {
      if (version !== requestVersion.current) return;
      if (__DEV__) console.warn('[voice onboarding] recording stop failed', cause);
      dispatch({
        type: 'PROCESS_FAILED',
        reason: failureFromCause(cause),
        message: cause instanceof Error ? cause.message : undefined
      });
    } finally {
      stopInFlight.current = false;
    }
  }, [processAudio, recorder, recorderState.durationMillis, recorderState.url]);

  const discard = React.useCallback(async () => {
    requestVersion.current += 1;
    requestController.current?.abort();
    if (safeRecorderIsRecording(recorder) || state.phase === 'paused') await recorder.stop().catch(() => {});
    const uri = pendingAudio.current ?? safeRecorderUri(recorder) ?? recorderState.url;
    pendingAudio.current = null;
    pendingDuration.current = 0;
    await removeTemporaryAudio(uri);
    dispatch({ type: 'CANCEL' });
  }, [recorder, recorderState.url, state.phase]);

  React.useEffect(() => {
    if (handledVoiceRestartVersion.current === voiceRestartVersion) return;
    handledVoiceRestartVersion.current = voiceRestartVersion;
    void discard();
  }, [discard, voiceRestartVersion]);

  React.useEffect(() => {
    if (state.phase === 'recording' && recorderState.durationMillis >= MAX_VOICE_RECORDING_SECONDS * 1000) {
      void stopAndProcess();
    }
  }, [recorderState.durationMillis, state.phase, stopAndProcess]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' && (state.phase === 'recording' || state.phase === 'paused')) {
        void (async () => {
          if (safeRecorderIsRecording(recorder) || state.phase === 'paused') await recorder.stop().catch(() => {});
          const uri = pendingAudio.current ?? safeRecorderUri(recorder) ?? recorderState.url;
          pendingAudio.current = null;
          pendingDuration.current = 0;
          await removeTemporaryAudio(uri);
          dispatch({ type: 'INTERRUPTED' });
        })();
      }
      if (nextState === 'active' && state.phase === 'failure' && state.reason === 'permission_denied') {
        void AudioModule.getRecordingPermissionsAsync().then((permission) => {
          if (permission.granted) dispatch({ type: 'PERMISSION_GRANTED' });
        });
      }
    });
    return () => subscription.remove();
  }, [recorder, recorderState.url, state]);

  React.useEffect(
    () => () => {
      requestVersion.current += 1;
      requestController.current?.abort();
      const uri = pendingAudio.current ?? safeRecorderUri(recorder);
      if (safeRecorderIsRecording(recorder)) {
        void recorder
          .stop()
          .then(() => removeTemporaryAudio(safeRecorderUri(recorder) ?? uri))
          .catch(() => removeTemporaryAudio(uri));
      } else {
        void removeTemporaryAudio(uri);
      }
    },
    [recorder]
  );

  if (session.phase === 'loading') return null;
  if (session.phase === 'locked') return <Redirect href="/unlock" />;
  if (session.phase !== 'signedIn') return <Redirect href="/onboarding/phone" />;

  const presentation = voiceScreenPresentation(state);
  const status =
    presentation.status === 'consent'
      ? t('onboarding.voicePermissionTitle')
      : presentation.status === 'permission_denied'
        ? t('onboarding.voicePermissionTitle')
      : presentation.status === 'ready'
        ? t('onboarding.readyToRecord')
        : presentation.status === 'discarded'
          ? t('onboarding.recordingDiscarded')
          : presentation.status === 'recording'
            ? t('onboarding.recording')
            : presentation.status === 'paused'
              ? t('onboarding.paused')
              : presentation.status === 'processing'
                ? t('onboarding.processingVoice')
              : presentation.status === 'success'
                  ? state.phase === 'success' && state.draft.processing_mode === 'sample_preview'
                    ? t('onboarding.voiceSampleSuccess')
                    : t('onboarding.voiceSuccess')
                  : t('onboarding.recordingFailedTitle');
  const detail =
    state.phase === 'failure'
      ? state.reason === 'permission_denied'
        ? t('onboarding.microphoneDenied')
        : state.reason === 'interrupted'
          ? t('onboarding.recordingInterrupted')
          : state.reason === 'recording'
            ? t('onboarding.recordingUnavailable')
          : state.reason === 'oversized'
            ? t('onboarding.recordingOversized')
            : state.reason === 'transcription'
              ? t('onboarding.transcriptionFailed')
              : state.reason === 'extraction'
                ? t('onboarding.extractionFailed')
                : t('onboarding.recordingFailed')
      : state.phase === 'consent'
        ? t('onboarding.voicePermissionBody')
        : state.phase === 'ready'
          ? t('onboarding.recordingLimit')
          : state.phase === 'processing'
            ? t('onboarding.voicePrivacy')
            : state.phase === 'success'
              ? state.draft.processing_mode === 'sample_preview'
                ? t('onboarding.voiceSamplePreview')
                : state.draft.transcript
            : null;
  const primaryTitle =
    presentation.primary === 'allow'
      ? t('onboarding.allowMicrophone')
      : presentation.primary === 'start'
        ? t('onboarding.startRecording')
        : presentation.primary === 'finish'
          ? t('onboarding.finishRecording')
          : presentation.primary === 'use'
            ? t('onboarding.useRecording')
            : presentation.primary === 'review'
              ? state.phase === 'success' && state.draft.processing_mode === 'sample_preview'
                ? t('onboarding.reviewSampleDetails')
                : t('onboarding.reviewDetails')
              : presentation.primary === 'retry'
                ? t('common.retry')
                : presentation.primary === 'processing'
                  ? t('onboarding.processingVoice')
                  : state.phase === 'failure' && state.reason === 'permission_denied'
                    ? t('onboarding.openSettings')
                    : t('onboarding.startOver');

  const primaryAction = async () => {
    if (presentation.primary === 'allow' || presentation.primary === 'start') {
      const version = requestVersion.current;
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (version !== requestVersion.current) return;
      dispatch({ type: permission.granted ? 'PERMISSION_GRANTED' : 'PERMISSION_DENIED' });
      if (!permission.granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: false });
      await recorder.prepareToRecordAsync(recordingOptions);
      if (version !== requestVersion.current) {
        await recorder.stop().catch(() => {});
        await removeTemporaryAudio(safeRecorderUri(recorder));
        return;
      }
      recorder.record({ forDuration: MAX_VOICE_RECORDING_SECONDS });
      dispatch({ type: 'START' });
      return;
    }
    if (presentation.primary === 'finish' || presentation.primary === 'use') {
      await stopAndProcess();
      return;
    }
    if (presentation.primary === 'review') {
      router.push('/onboarding/profile');
      return;
    }
    if (presentation.primary === 'retry' && pendingAudio.current) {
      dispatch({ type: 'RETRY' });
      await processAudio(pendingAudio.current, pendingDuration.current);
      return;
    }
    if (presentation.primary === 'retry') {
      dispatch({ type: 'PERMISSION_GRANTED' });
      return;
    }
    if (state.phase === 'failure' && state.reason === 'permission_denied') {
      const permission = await AudioModule.getRecordingPermissionsAsync();
      if (permission.granted) dispatch({ type: 'PERMISSION_GRANTED' });
      else await Linking.openSettings();
      return;
    }
    await discard();
  };

  return (
    <VoiceOnboardingScreen
      status={status}
      idle={state.phase === 'consent' || state.phase === 'ready' || (state.phase === 'failure' && state.reason === 'permission_denied')}
      permissionDenied={state.phase === 'failure' && state.reason === 'permission_denied'}
      success={state.phase === 'success'}
      detail={detail}
      elapsed={formatVoiceDuration(
        voiceDisplayDuration(state, recorderState.durationMillis / 1000)
      )}
      active={state.phase === 'recording'}
      paused={state.phase === 'paused'}
      mascot={shell.mascot}
      processing={state.phase === 'processing'}
      primaryTitle={primaryTitle}
      primaryIcon={
        presentation.primary === 'start' || presentation.primary === 'restart'
          ? 'microphone'
          : presentation.primary === 'finish' || presentation.primary === 'use'
            ? 'stop'
            : undefined
      }
      primaryDisabled={state.phase === 'processing'}
      secondaryTitle={
        presentation.secondary === 'pause'
          ? t('onboarding.pauseRecording')
          : presentation.secondary === 'resume'
            ? t('onboarding.resumeRecording')
            : presentation.secondary === 'record_again'
              ? t('onboarding.recordAgain')
            : undefined
      }
      secondaryIcon={
        presentation.secondary === 'resume'
          ? 'play'
          : presentation.secondary === 'record_again'
            ? 'microphone'
            : presentation.secondary
      }
      canDiscard={presentation.canDiscard}
      onPrimary={() => {
        if (primaryInFlight.current) return;
        primaryInFlight.current = true;
        void primaryAction().catch((cause) => {
          if (__DEV__) console.warn('[voice onboarding] action failed', cause);
          dispatch({
            type: 'PROCESS_FAILED',
            reason: failureFromCause(cause),
            message: cause instanceof Error ? cause.message : undefined
          });
        }).finally(() => { primaryInFlight.current = false; });
      }}
      onSecondary={
        presentation.secondary === 'pause'
          ? () => {
              try {
                recorder.pause();
                dispatch({ type: 'PAUSE' });
              } catch (cause) {
                if (__DEV__) console.warn('[voice onboarding] pause failed', cause);
                dispatch({ type: 'PROCESS_FAILED', reason: 'recording' });
              }
            }
          : presentation.secondary === 'resume'
            ? () => {
                try {
                  const remaining = Math.max(
                    1,
                    MAX_VOICE_RECORDING_SECONDS - Math.floor(recorderState.durationMillis / 1000)
                  );
                  recorder.record({ forDuration: remaining });
                  dispatch({ type: 'RESUME' });
                } catch (cause) {
                  if (__DEV__) console.warn('[voice onboarding] resume failed', cause);
                  dispatch({ type: 'PROCESS_FAILED', reason: 'recording' });
                }
              }
            : presentation.secondary === 'record_again'
              ? restartVoice
            : undefined
      }
      onDiscard={() => void discard()}
      onTypeInstead={() => {
        void discard().then(() => {
          beginTyped();
          router.replace('/onboarding/write');
        });
      }}
      onSkip={() => {
        void discard().then(() => {
          profile.reset();
          router.replace('/actions');
        });
      }}
    />
  );
}
