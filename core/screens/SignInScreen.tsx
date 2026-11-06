import React, { useState } from 'react';
import { Button, Input, Screen, Stack, Txt } from '../design';
import { t } from '../i18n';

/**
 * Sign in. The brand register may be expressive elsewhere; the door is
 * calm: name, two fields, one loud action, and the demo books for anyone
 * just looking (the App Store review path).
 */
export type SignInScreenProps = {
  brandName: string;
  demoAvailable?: boolean;
  busy: boolean;
  error?: string | null;
  onSignIn: (email: string, password: string) => void;
  onDemo?: () => void;
};

export const SignInScreen = ({
  brandName,
  demoAvailable,
  busy,
  error,
  onSignIn,
  onDemo
}: SignInScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Screen scroll keyboardAvoiding>
      <Stack padX="screenX" padY="lg" gap="md" grow center>
        <Txt v="hero" accessibilityRole="header">
          {brandName}
        </Txt>
        <Input
          accessibilityLabel={t('auth.email')}
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          editable={!busy}
        />
        <Input
          accessibilityLabel={t('auth.password')}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
          textContentType="password"
          secureTextEntry
          editable={!busy}
        />
        {error ? (
          <Txt v="sm" tone="alert" accessibilityLiveRegion="polite">
            {error}
          </Txt>
        ) : null}
        <Button
          title={t('auth.signIn')}
          kind="primary"
          size="large"
          loading={busy}
          disabled={!email.trim() || !password}
          onPress={() => onSignIn(email.trim(), password)}
        />
        {demoAvailable && onDemo ? (
          <Stack gap="xs">
            <Button title={t('auth.demo')} kind="chip" disabled={busy} onPress={onDemo} />
            <Txt v="meta" tone="mute">
              {t('auth.demoNote')}
            </Txt>
          </Stack>
        ) : null}
      </Stack>
    </Screen>
  );
};
