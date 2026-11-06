import React from 'react';
import { Button, Screen, Stack, Txt } from '../design';
import { t } from '../i18n';

/**
 * The lock in front of a restored session. Same calm register as the
 * door (SignInScreen): brand, one line, one loud action — plus the
 * quiet way out for a device whose biometrics won't cooperate.
 */
export type UnlockScreenProps = {
  brandName: string;
  busy: boolean;
  onUnlock: () => void;
  onSignOut: () => void;
};

export const UnlockScreen = ({ brandName, busy, onUnlock, onSignOut }: UnlockScreenProps) => (
  <Screen>
    <Stack padX="screenX" gap="md" grow center>
      <Txt v="hero">{brandName}</Txt>
      <Txt v="sm" tone="mute">
        {t('auth.biometricPrompt')}
      </Txt>
      <Button title={t('auth.unlock')} kind="primary" size="large" loading={busy} onPress={onUnlock} />
      <Button title={t('auth.signOut')} kind="chip" disabled={busy} onPress={onSignOut} />
    </Stack>
  </Screen>
);
