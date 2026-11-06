import React, { useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { ApiError } from '@core/api';
import { TypedOnboardingScreen } from '@core/screens/TypedOnboardingScreen';
import { t } from '@core/i18n';
import { useOnboardingProfile } from '@/state/onboardingProfile';
import { useSession } from '@/state/session';

export default function TypedOnboardingRoute() {
  const { state, api } = useSession();
  const profile = useOnboardingProfile();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  React.useEffect(() => () => { requestVersion.current += 1; }, []);

  if (state.phase === 'loading') return null;
  if (state.phase === 'locked') return <Redirect href="/unlock" />;
  if (state.phase !== 'signedIn') return <Redirect href="/onboarding/phone" />;

  const prepare = async () => {
    if (busy || !value.trim()) return;
    const version = ++requestVersion.current;
    setBusy(true);
    setError(null);
    Keyboard.dismiss();
    try {
      const draft = await api.createTextOnboardingDraft(state.entityId, value);
      if (version !== requestVersion.current) return;
      if (draft.cleanup_mode !== 'model_cleanup') {
        throw new ApiError(422, 'VOICE_EXTRACTION_FAILED', 'A clear introduction is not ready yet.');
      }
      profile.reset();
      profile.applyVoiceDraft(draft);
      profile.beginTyped();
      router.replace('/onboarding/profile');
    } catch {
      if (version === requestVersion.current) setError(t('onboarding.extractionFailed'));
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  };

  return <TypedOnboardingScreen
    value={value} busy={busy} error={error}
    onChange={(text) => { setValue(text); setError(null); }}
    onContinue={() => void prepare()}
    onVoice={() => { profile.restartVoice(); router.replace('/onboarding/voice'); }}
    onSkip={() => { profile.reset(); router.replace('/actions'); }}
  />;
}
