import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Button, Screen, Stack, Txt } from '@core/design';
import { t } from '@core/i18n';
import { shell } from '@/shell';
import { useSession } from '@/state/session';

/** Explicit development entrance to the existing backend fixtures, not onboarding data. */
export default function SeededBooksRoute() {
  const { signIn } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (!__DEV__ || process.env.EXPO_PUBLIC_SEEDED_BOOKS !== 'true' || !shell.demoLogin) {
    return <Redirect href="/" />;
  }
  const openBooks = async () => {
    if (busy || !shell.demoLogin) return;
    setBusy(true);
    setError(false);
    try {
      await signIn(shell.demoLogin.email, shell.demoLogin.password);
      router.replace('/actions');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return <Screen title={t('preview.booksTitle')} scroll>
    <Stack padX="screenX" gap="lg">
      <Txt v="body" tone="soft">{t('preview.booksBody')}</Txt>
      {error ? <Txt v="body" tone="alert" accessibilityLiveRegion="polite">{t('common.error_generic')}</Txt> : null}
      <Button title={t('preview.booksOpen')} kind="primary" size="large" loading={busy} onPress={openBooks} />
    </Stack>
  </Screen>;
}
