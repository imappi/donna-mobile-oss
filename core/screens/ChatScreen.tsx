import React from 'react';
import type { AppliableChatAction, ChatMessage } from '../api';
import { ArtifactSurface, Button, Stack, Txt, type ConversationIdentity } from '../design';
import { t } from '../i18n';

export type ChatScreenProps = {
  messages: ChatMessage[];
  sending: boolean;
  loading?: boolean;
  failed?: boolean;
  identity?: ConversationIdentity;
  onBack?: () => void;
  onRetry?: () => void;
  applyingActionId?: string | null;
  onSend: (text: string) => void;
  onApplyAction?: (action: AppliableChatAction) => void;
};

export const ChatScreen = ({ loading, failed, onRetry, ...props }: ChatScreenProps) => (
  <ArtifactSurface {...props} variant="chat" headerTitle={t('chat.title')} composerPlaceholder={t('chat.placeholder')}>
    {loading ? <Txt v="sm" tone="mute">{t('common.loading')}</Txt> : null}
    {failed ? <Stack gap="sm"><Txt v="sm">{t('common.error_generic')}</Txt><Button kind="text" title={t('common.retry')} onPress={onRetry} /></Stack> : null}
  </ArtifactSurface>
);
