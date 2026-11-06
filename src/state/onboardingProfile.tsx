import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { VoiceOnboardingDraft } from '@core/api';
import {
  emptyOnboardingFieldState,
  emptyOnboardingProfile,
  exactProfileFields,
  mergeVoiceDraft,
  restartVoiceProfile,
  type OnboardingProfileFieldState,
  type OnboardingProfileForm,
  type ProfileFieldName
} from '@core/onboarding/profile';

export {
  emptyOnboardingProfile,
  mergeVoiceDraft,
  profileConfirmationFromForm,
  restartVoiceProfile
} from '@core/onboarding/profile';
export type { OnboardingProfileFieldState, OnboardingProfileForm, ProfileFieldName } from '@core/onboarding/profile';

type OnboardingProfileContextValue = {
  values: OnboardingProfileForm;
  fieldState: OnboardingProfileFieldState;
  transcript: string | null;
  rawTranscript: string | null;
  processingMode: VoiceOnboardingDraft['processing_mode'] | null;
  cleanupMode: VoiceOnboardingDraft['cleanup_mode'] | null;
  source: 'typed' | 'voice';
  voiceRestartVersion: number;
  setOwnerName: (name: string) => void;
  beginTyped: () => void;
  applyVoiceDraft: (draft: VoiceOnboardingDraft) => void;
  restartVoice: () => void;
  updateField: (field: ProfileFieldName, value: string) => void;
  reset: () => void;
};

const OnboardingProfileContext = createContext<OnboardingProfileContextValue | null>(null);

type ProfileState = {
  values: OnboardingProfileForm;
  fieldState: OnboardingProfileFieldState;
  transcript: string | null;
  rawTranscript: string | null;
  processingMode: VoiceOnboardingDraft['processing_mode'] | null;
  cleanupMode: VoiceOnboardingDraft['cleanup_mode'] | null;
  source: 'typed' | 'voice';
  voiceRestartVersion: number;
};

type ProfileAction =
  | { type: 'SET_OWNER_NAME'; name: string }
  | { type: 'BEGIN_TYPED' }
  | { type: 'APPLY_VOICE_DRAFT'; draft: VoiceOnboardingDraft }
  | { type: 'RESTART_VOICE' }
  | { type: 'UPDATE_FIELD'; field: ProfileFieldName; value: string }
  | { type: 'RESET' };

const initialProfileState = (): ProfileState => ({
  values: emptyOnboardingProfile(),
  fieldState: emptyOnboardingFieldState(),
  transcript: null,
  rawTranscript: null,
  processingMode: null,
  cleanupMode: null,
  source: 'typed',
  voiceRestartVersion: 0
});

const profileReducer = (state: ProfileState, action: ProfileAction): ProfileState => {
  switch (action.type) {
    case 'SET_OWNER_NAME':
      return {
        ...state,
        values: { ...state.values, owner_name: action.name },
        fieldState: {
          ...state.fieldState,
          owner_name: {
            state: action.name.trim() ? 'confident' : 'missing',
            requires_exact_confirmation: true
          }
        }
      };
    case 'BEGIN_TYPED':
      return { ...state, source: 'typed' };
    case 'APPLY_VOICE_DRAFT': {
      const merged = mergeVoiceDraft(state.values, action.draft);
      return {
        values: merged.values,
        fieldState: merged.fieldState,
        transcript: action.draft.transcript,
        rawTranscript: action.draft.raw_transcript,
        processingMode: action.draft.processing_mode,
        cleanupMode: action.draft.cleanup_mode,
        source: 'voice',
        voiceRestartVersion: state.voiceRestartVersion
      };
    }
    case 'RESTART_VOICE': {
      const restarted = restartVoiceProfile();
      return {
        ...restarted,
        transcript: null,
        rawTranscript: null,
        processingMode: null,
        cleanupMode: null,
        source: 'voice',
        voiceRestartVersion: state.voiceRestartVersion + 1
      };
    }
    case 'UPDATE_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        fieldState: {
          ...state.fieldState,
          [action.field]: {
            state: action.value.trim() ? 'confident' : 'missing',
            requires_exact_confirmation: exactProfileFields.has(action.field)
          }
        }
      };
    case 'RESET':
      return initialProfileState();
  }
};

export const useOnboardingProfile = () => {
  const value = useContext(OnboardingProfileContext);
  if (!value) throw new Error('useOnboardingProfile outside OnboardingProfileProvider');
  return value;
};

export const OnboardingProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(profileReducer, undefined, initialProfileState);

  const setOwnerName = useCallback((name: string) => {
    dispatch({ type: 'SET_OWNER_NAME', name });
  }, []);

  const beginTyped = useCallback(() => dispatch({ type: 'BEGIN_TYPED' }), []);

  const applyVoiceDraft = useCallback((draft: VoiceOnboardingDraft) => {
    dispatch({ type: 'APPLY_VOICE_DRAFT', draft });
  }, []);

  const restartVoice = useCallback(() => {
    dispatch({ type: 'RESTART_VOICE' });
  }, []);

  const updateField = useCallback((field: ProfileFieldName, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo(
    () => ({
      values: state.values,
      fieldState: state.fieldState,
      transcript: state.transcript,
      rawTranscript: state.rawTranscript,
      processingMode: state.processingMode,
      cleanupMode: state.cleanupMode,
      source: state.source,
      voiceRestartVersion: state.voiceRestartVersion,
      setOwnerName,
      beginTyped,
      applyVoiceDraft,
      restartVoice,
      updateField,
      reset
    }),
    [applyVoiceDraft, beginTyped, reset, restartVoice, setOwnerName, state, updateField]
  );

  return <OnboardingProfileContext.Provider value={value}>{children}</OnboardingProfileContext.Provider>;
};
