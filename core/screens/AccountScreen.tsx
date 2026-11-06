import React from 'react';
import type { Principal } from '../api';
import { Button, Card, Row, Screen, Stack, Txt } from '../design';
import { t } from '../i18n';

export type AccountScreenProps = {
  principal: Principal;
  confirmingDeletion: boolean;
  requestingDeletion: boolean;
  deletionMessage?: string | null;
  onStartDeletion: () => void;
  onCancelDeletion: () => void;
  onConfirmDeletion: () => void;
  onBack: () => void;
  onOpenSetup?: () => void;
};

/**
 * Small owner settings surface. It exposes only account capabilities backed
 * by the current contract; preferences do not appear before they can persist.
 */
export const AccountScreen = ({
  principal,
  confirmingDeletion,
  requestingDeletion,
  deletionMessage,
  onStartDeletion,
  onCancelDeletion,
  onConfirmDeletion,
  onBack, onOpenSetup
}: AccountScreenProps) => (
  <Screen title={t('account.title')} onBack={onBack} scroll>
    <Stack padX="screenX" gap="lg">
      <Card>
        <Stack gap="xs">
          <Txt v="eyebrow" tone="mute">
            {t('account.signedInAs')}
          </Txt>
          <Txt v="heading">{principal.display_name}</Txt>
          {principal.email ? (
            <Txt v="sm" tone="mute">
              {principal.email}
            </Txt>
          ) : null}
        </Stack>
      </Card>

      {onOpenSetup ? <Button title={t('setup.open')} onPress={onOpenSetup} /> : null}
      <Card>
        <Stack gap="md">
          <Stack gap="xs">
            <Txt v="heading">{t('account.deletionTitle')}</Txt>
            <Txt v="sm" tone="soft">
              {t('account.deletionIntro')}
            </Txt>
          </Stack>

          {deletionMessage ? (
            <Stack gap="xs" accessibilityLiveRegion="polite">
              <Txt v="body" em>
                {t('account.deletionRequested')}
              </Txt>
              <Txt v="sm" tone="soft">
                {deletionMessage}
              </Txt>
            </Stack>
          ) : confirmingDeletion ? (
            <Stack gap="md">
              <Txt v="sm" tone="alert">
                {t('account.deletionWarning')}
              </Txt>
              <Row gap="sm" wrap>
                <Button
                  title={t('account.deletionConfirm')}
                  kind="danger"
                  loading={requestingDeletion}
                  onPress={onConfirmDeletion}
                  testID="confirm-account-deletion"
                />
                <Button
                  title={t('common.cancel')}
                  disabled={requestingDeletion}
                  onPress={onCancelDeletion}
                />
              </Row>
            </Stack>
          ) : (
            <Button title={t('account.deletionStart')} onPress={onStartDeletion} />
          )}
        </Stack>
      </Card>
    </Stack>
  </Screen>
);
