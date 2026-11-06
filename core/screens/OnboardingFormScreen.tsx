import React from 'react';
import { Button, OnboardingLayout, Row, Stack, Txt, type ButtonProps } from '../design';

export type OnboardingFormScreenProps = {
  title: string; body: string; children: React.ReactNode; primaryTitle: string;
  primaryDisabled?: boolean; busy?: boolean; error?: string | null; note?: string | null;
  secondaryTitle?: string; tertiaryTitle?: string; primaryIcon?: ButtonProps['icon'];
  onPrimary: () => void; onSecondary?: () => void; onTertiary?: () => void;
};

/** Shared v4 rhythm for each single-question first-run step. */
export const OnboardingFormScreen = ({
  title, body, children, primaryTitle, primaryDisabled, busy, error, note,
  secondaryTitle, tertiaryTitle, primaryIcon, onPrimary, onSecondary, onTertiary
}: OnboardingFormScreenProps) => (
  <OnboardingLayout title={title} body={body} keyboard footer={<>
    <Button title={primaryTitle} kind="primary" size="onboarding" loading={busy}
      disabled={primaryDisabled} icon={primaryIcon} onPress={onPrimary} />
    {secondaryTitle || tertiaryTitle ? <Row between wrap gap="md">
      {secondaryTitle && onSecondary ? <Button title={secondaryTitle} kind="text" size="onboarding"
        disabled={busy} onPress={onSecondary} /> : null}
      {tertiaryTitle && onTertiary ? <Button title={tertiaryTitle} kind="text" size="onboarding"
        disabled={busy} onPress={onTertiary} /> : null}
    </Row> : null}
  </>}>
    <Stack gap="md">
      {children}
      {note ? <Txt v="onboardingNote" tone="soft">{note}</Txt> : null}
      {error ? <Txt v="body" tone="alert" accessibilityLiveRegion="polite">{error}</Txt> : null}
    </Stack>
  </OnboardingLayout>
);
