import React from 'react';
import type { AppliableChatAction, ChatMessage, Doc, Receipt } from '../api';
import {
  ArtifactContextCard,
  type ConversationIdentity,
  ArtifactSurface,
  Button,
  Row,
  Stack,
  Txt,
  type StatusPillTone
} from '../design';
import { formatDate, formatMoney, t } from '../i18n';
import { documentContext } from './homePresentation';
import { stateForDocument, type HomeItemState } from './homeStream';

export type DocumentDetailScreenProps = {
  document: Doc;
  image?: ConversationIdentity['image'];
  messages: ChatMessage[];
  receipts?: Receipt[];
  sending: boolean;
  retrying?: boolean;
  resolvingDuplicateAction?: 'create' | 'replace' | 'cancel' | null;
  applyingActionId?: string | null;
  onSend: (text: string) => void;
  onRetry?: () => void;
  onResolveDuplicate?: (action: 'create' | 'replace' | 'cancel') => void;
  onApplyAction?: (action: AppliableChatAction) => void;
  onBack?: () => void;
};

const STATE: Record<HomeItemState, { label: () => string; tone: Exclude<StatusPillTone, 'machine'> }> = {
  needs_input: { label: () => t('home.state.needsInput'), tone: 'accent' },
  processing: { label: () => t('home.state.processing'), tone: 'quiet' },
  handled: { label: () => t('home.state.handled'), tone: 'quiet' },
  stalled: { label: () => t('home.state.stalled'), tone: 'alert' }
};

const documentType = (document: Doc): string => {
  switch (document.document_type) {
    case 'receipt':
      return t('home.type.receipt');
    case 'supplier_bill':
      return t('home.type.bill');
    case 'sales_invoice':
      return t('home.type.invoice');
    case 'bank_statement':
      return t('home.type.statement');
    default:
      return t('home.type.document');
  }
};

const documentDescription = (document: Doc): string => {
  switch (document.capture_state) {
    case 'stored':
      return t('setup.recordsStored');
    case 'received':
      return t('artifact.documentReceived');
    case 'processing':
      return t('artifact.documentProcessing');
    case 'attached':
      return t('artifact.documentAttached');
    case 'needs_info':
      return t('artifact.documentNeedsInfo');
    case 'duplicate':
      return t('artifact.documentDuplicate');
    case 'failed':
      return document.failure_message ?? t('artifact.documentFailed');
  }
};

const DocumentActions = ({
  document,
  retrying,
  resolvingDuplicateAction,
  onRetry,
  onResolveDuplicate
}: DocumentDetailScreenProps) => {
  if (document.capture_state === 'failed' && onRetry) {
    return <Button title={t('artifact.retryDocument')} kind="primary" loading={retrying} onPress={onRetry} />;
  }
  if (document.capture_state === 'duplicate' && onResolveDuplicate) {
    return (
      <Stack gap="md">
        <Txt v="sm" em>
          {t('artifact.approvalAction')}
        </Txt>
        <Row gap="sm" wrap>
          <Button
            title={t('artifact.keepBoth')}
            kind="primary"
            loading={resolvingDuplicateAction === 'create'}
            disabled={Boolean(resolvingDuplicateAction)}
            onPress={() => onResolveDuplicate('create')}
          />
          <Button
            title={t('artifact.replaceOriginal')}
            kind="chip"
            loading={resolvingDuplicateAction === 'replace'}
            disabled={Boolean(resolvingDuplicateAction)}
            onPress={() => onResolveDuplicate('replace')}
          />
          <Button
            title={t('artifact.removeCopy')}
            kind="chip"
            loading={resolvingDuplicateAction === 'cancel'}
            disabled={Boolean(resolvingDuplicateAction)}
            onPress={() => onResolveDuplicate('cancel')}
          />
        </Row>
      </Stack>
    );
  }
  return null;
};

export const DocumentDetailScreen = (props: DocumentDetailScreenProps) => {
  const { document, messages, sending, onSend, onBack, applyingActionId, onApplyAction } = props;
  const type = documentType(document);
  const state = STATE[stateForDocument(document)];
  const day = document.document_date ?? document.captured_at?.slice(0, 10) ?? document.uploaded_at.slice(0, 10);
  const meta = [
    day ? formatDate(day) : null,
    document.total_amount != null && document.currency
      ? formatMoney(document.total_amount, document.currency)
      : null
  ]
    .filter(Boolean)
    .join(' · ');
  const context = documentContext(document, type);
  const hasAction =
    (document.capture_state === 'failed' && Boolean(props.onRetry)) ||
    (document.capture_state === 'duplicate' && Boolean(props.onResolveDuplicate));

  return (
    <ArtifactSurface
      headerTitle={context}
      image={props.image}
      messages={messages}
      receipts={props.receipts}
      sending={sending}
      composerPlaceholder={t('artifact.composer')}
      onSend={onSend}
      onBack={onBack}
      applyingActionId={applyingActionId}
      onApplyAction={onApplyAction}
    >
      <ArtifactContextCard
        title={document.presentation?.title ?? context}
        meta={[type, meta].filter(Boolean).join(' · ')}
        stateLabel={document.capture_state === 'stored' ? t('setup.storedLabel') : state.label()}
        stateTone={state.tone}
        description={document.presentation?.description ?? documentDescription(document)}
        presentation={document.presentation}
      >
        {hasAction ? <DocumentActions {...props} /> : null}
      </ArtifactContextCard>
    </ArtifactSurface>
  );
};
