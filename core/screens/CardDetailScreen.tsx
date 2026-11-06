import React, { useState } from 'react';
import type { AppliableChatAction, ChatMessage, Decision, QueueCard, Receipt } from '../api';
import {
  ArtifactContextCard,
  type ConversationIdentity,
  ArtifactSurface,
  Button,
  Input,
  Row,
  Stack,
  Txt,
  type StatusPillTone
} from '../design';
import { formatDate, formatMoney, t } from '../i18n';
import { queueCardContext } from './homePresentation';
import { stateForCard, type HomeItemState } from './homeStream';

/**
 * The mobile face of the persisted queue artifact. Conversation turns remain
 * non-terminal; the card-class action below is the only decision lane.
 */
export type CardDetailScreenProps = {
  card: QueueCard;
  image?: ConversationIdentity['image'];
  messages: ChatMessage[];
  deciding: boolean;
  sending: boolean;
  receipt?: Receipt | null;
  receipts?: Receipt[];
  onDecide: (decision: Decision) => void;
  onSend: (text: string) => void;
  onAttachPhoto?: () => void;
  attaching?: boolean;
  applyingActionId?: string | null;
  onApplyAction?: (action: AppliableChatAction) => void;
  onBack?: () => void;
};

const STATE: Record<HomeItemState, { label: () => string; tone: Exclude<StatusPillTone, 'machine'> }> = {
  needs_input: { label: () => t('home.state.needsInput'), tone: 'accent' },
  processing: { label: () => t('home.state.processing'), tone: 'quiet' },
  handled: { label: () => t('home.state.handled'), tone: 'quiet' },
  stalled: { label: () => t('home.state.stalled'), tone: 'alert' }
};

const cardType = (card: QueueCard): string => {
  if (card.class === 'ask') return t('home.type.question');
  if (card.class === 'approval') return t('home.type.approval');
  return t('home.type.update');
};

const AskActions = ({ card, deciding, onDecide, onAttachPhoto, attaching }: CardDetailScreenProps) => {
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState('');
  const ask = card.ask;
  if (!ask) return null;
  if (card.state !== 'open') {
    return ask.answered_text ? (
      <Stack gap="xs">
        <Txt v="meta" tone="mute">
          {t('artifact.yourAnswer')}
        </Txt>
        <Txt v="body">{ask.answered_text}</Txt>
      </Stack>
    ) : null;
  }
  return (
    <Stack gap="sm">
      {ask.choices?.length ? (
        <Row gap="sm" wrap>
          {ask.choices.map((choice) => (
            <Button
              key={choice.id}
              title={choice.label}
              kind="chip"
              size="decision"
              disabled={deciding}
              onPress={() => onDecide({ type: 'answer', answer: { choice_id: choice.id } })}
            />
          ))}
        </Row>
      ) : null}
      {ask.allows_text && (writing || !ask.choices?.length) ? (
        <Input
          placeholder={t('card.answerPlaceholder')}
          value={text}
          onChangeText={setText}
          editable={!deciding}
          onSubmitEditing={() => {
            if (text.trim()) onDecide({ type: 'answer', answer: { text: text.trim() } });
          }}
          returnKeyType="send"
        />
      ) : null}
      {ask.allows_text && ask.choices?.length && !writing ? <Button title={t('artifact.otherAnswer')} kind="text" onPress={() => setWriting(true)} /> : null}
      {(ask.allows_text && (writing || !ask.choices?.length)) || (ask.allows_documents && onAttachPhoto) ? <Row gap="sm" wrap>
        {ask.allows_text && (writing || !ask.choices?.length) ? (
          <Button
            title={t('card.answer')}
            kind="primary"
            size="decision"
            loading={deciding}
            disabled={!text.trim()}
            onPress={() => onDecide({ type: 'answer', answer: { text: text.trim() } })}
          />
        ) : null}
        {ask.allows_documents && onAttachPhoto ? (
          <Button title={t('card.attachPhoto')} kind="chip" loading={attaching} onPress={onAttachPhoto} />
        ) : null}
      </Row> : null}
    </Stack>
  );
};

const ApprovalActions = ({ card, deciding, onDecide }: CardDetailScreenProps) => {
  if (!card.approval || card.state !== 'open') return null;
  return (
    <Row gap="sm">
      <Button
        title={t('card.approve')}
        size="decision"
        grow
        kind="primary"
        loading={deciding}
        onPress={() => onDecide({ type: 'approve' })}
      />
      <Button
        title={t('card.reject')}
        size="decision"
        kind="chip"
        disabled={deciding}
        onPress={() => onDecide({ type: 'reject' })}
      />
    </Row>
  );
};

const FyiActions = ({ card, deciding, onDecide }: CardDetailScreenProps) => {
  const fyi = card.fyi;
  if (!fyi || fyi.marked_wrong_at || card.state === 'flagged') return null;
  return (
    <Button
      title={t('card.markWrong')}
      kind="chip"
      loading={deciding}
      onPress={() => onDecide({ type: 'veto_flag' })}
    />
  );
};

export const CardDetailScreen = (props: CardDetailScreenProps) => {
  const {
    card,
    messages,
    receipt,
    receipts = [],
    sending,
    onSend,
    onBack,
    applyingActionId,
    onApplyAction
  } = props;
  const state = STATE[stateForCard(card)];
  const meta = [
    cardType(card),
    card.occurred_on ? formatDate(card.occurred_on) : null,
    card.amount != null && card.currency ? formatMoney(card.amount, card.currency) : null
  ]
    .filter(Boolean)
    .join(' · ');
  const title = card.presentation?.title ?? card.ask?.question ?? card.title;
  const description = card.presentation?.description ?? card.approval?.description ?? card.fyi?.description ?? null;
  // A rich presentation replaces the legacy summary, but ordinary cards must
  // retain context such as an overdue invoice number or payment reference.
  const secondary = (card.state === 'open' ? card.approval?.hold_reason : null)
    ?? (card.presentation ? null : card.detail ?? null);
  const hasContextAction =
    (card.class === 'ask' && card.state !== 'open' && !receipts.length && !receipt && Boolean(card.ask?.answered_text)) ||
    (card.class === 'fyi' && card.state !== 'flagged' && !card.fyi?.marked_wrong_at);
  const actionContent = !hasContextAction
    ? null
    : card.class === 'ask'
      ? <AskActions {...props} />
      : <FyiActions {...props} />;
  const conversationActions =
    card.state === 'open' ? card.class === 'approval' ? <ApprovalActions {...props} /> : card.class === 'ask' ? <AskActions {...props} /> : null : null;
  const receiptHistory = [...receipts, ...(receipt ? [receipt] : [])].filter(
    (candidate, index, all) =>
      all.findIndex(
        (other) =>
          (other.audit_event_ids[0] ?? other.summary) ===
          (candidate.audit_event_ids[0] ?? candidate.summary)
      ) === index
  );

  return (
    <ArtifactSurface
      headerTitle={queueCardContext(card)}
      image={props.image}
      messages={messages}
      receipts={receiptHistory}
      sending={sending}
      composerPlaceholder={t('artifact.composer')}
      onSend={onSend}
      onBack={onBack}
      applyingActionId={applyingActionId}
      onApplyAction={onApplyAction}
      composerActions={conversationActions}
    >
      <ArtifactContextCard
        title={title}
        meta={meta}
        stateLabel={state.label()}
        stateTone={state.tone}
        description={description}
        secondary={secondary}
        presentation={card.presentation}
      >
        {actionContent}
      </ArtifactContextCard>
    </ArtifactSurface>
  );
};
