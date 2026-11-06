import { WorkingIcon } from './WorkingIcon';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  View,
  type TextStyle,
  type ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppliableChatAction, ArtifactPresentation, ChatMessage, Receipt } from '../../api';
import { formatReceiptTime, t } from '../../i18n';
import { ArtifactEvidence, CompactHeader, ConversationBubble, type ConversationIdentity } from './RefinedContent';
import { resolveArtifactVerticalGeometry } from '../artifactGeometry';
import { artifact, color, radius, refinement, shadow, shellGeometry, shellType, space } from '../tokens';
import { Button } from './Button';
import { Input } from './Input';
import { Screen } from './Screen';
import { StatusPill, type StatusPillTone } from './StatusPill';
import { Txt } from './Txt';

export type ArtifactContextCardProps = {
  title: string;
  meta?: string | null;
  stateLabel: string;
  stateTone?: Exclude<StatusPillTone, 'machine'>;
  description?: string | null;
  secondary?: string | null;
  presentation?: ArtifactPresentation;
  children?: React.ReactNode;
};

const CONTEXT_CARD: ViewStyle = {
  backgroundColor: color.card,
  borderRadius: artifact.contextRadius,
  padding: artifact.contextPadding,
  ...shadow.streamCard
};
const META_ROW: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: space.sm,
  marginTop: artifact.titleMetaGap
};
const META_COPY: ViewStyle = { flex: 1, minWidth: 0 };
const META_TEXT: TextStyle = { flex: 1 };
const DESCRIPTION: TextStyle = { marginTop: artifact.copyGap };
const SECONDARY: TextStyle = { marginTop: artifact.copyGap };
const ACTION_AREA: ViewStyle = {
  marginTop: artifact.actionTopGap,
  paddingTop: artifact.actionPaddingTop,
  borderTopWidth: 1,
  borderTopColor: color.ruleSoft
};

export const ArtifactContextCard = ({
  title,
  meta,
  stateLabel,
  stateTone = 'quiet',
  description,
  secondary,
  presentation,
  children
}: ArtifactContextCardProps) => (
  <View style={CONTEXT_CARD}>
    <Txt v="detailTitle">{title}</Txt>
    <View style={META_ROW}>
      {meta ? (
        <Txt v="detailMeta" tone="mute" tabular style={META_TEXT}>
          {meta}
        </Txt>
      ) : (
        <View style={META_COPY} />
      )}
      <StatusPill label={stateLabel} tone={stateTone} detail />
    </View>
    {description ? (
      <Txt v="detailBody" style={DESCRIPTION}>
        {description}
      </Txt>
    ) : null}
    <ArtifactEvidence presentation={presentation} />
    {secondary ? (
      <Txt v="detailSecondary" tone="mute" style={SECONDARY}>
        {secondary}
      </Txt>
    ) : null}
    {children ? <View style={ACTION_AREA}>{children}</View> : null}
  </View>
);

export const ArtifactReceipt = ({ receipt }: { receipt: Receipt }) => {
  const [expanded, setExpanded] = useState(false);
  const time = receipt.at ? formatReceiptTime(receipt.at) : null;
  return <Pressable accessibilityRole="button" accessibilityLabel={t('artifact.receiptDetails')}
    accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}
    style={{ gap: refinement.receiptGap, paddingHorizontal: refinement.receiptPaddingX,
      paddingVertical: refinement.receiptPaddingY, borderRadius: artifact.receiptRadius, backgroundColor: color.inkWash }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: refinement.receiptGap }}>
      <WorkingIcon name="check" size={refinement.receiptIcon} color={color.ink} />
      <Txt v="receipt" tone="soft" style={{ flex: 1 }}>{receipt.summary}</Txt>
      {time ? <Txt v="receipt" tone="mute" tabular>{time}</Txt> : null}
    </View>
    {expanded ? receipt.audit_event_ids.map(id => <Txt v="machine" tone="mute" key={id}>{id}</Txt>) : null}
  </Pressable>;
};

const GROW: ViewStyle = { flex: 1 };
const MESSAGE_ACTIONS: ViewStyle = { alignSelf: 'flex-start', gap: space.sm };
const COMPOSER_DOCK: ViewStyle = {
  position: 'absolute',
  left: artifact.composerInset,
  right: artifact.composerInset,
  gap: artifact.composerActionGap
};
const COMPOSER_ACTIONS: ViewStyle = {
  paddingHorizontal: artifact.composerActionInset
};
const COMPOSER: ViewStyle = {
  minHeight: artifact.composerHeight,
  flexDirection: 'row',
  alignItems: 'center',
  gap: space.sm,
  backgroundColor: color.card,
  borderRadius: radius.pill,
  paddingLeft: artifact.composerPaddingLeft,
  paddingRight: artifact.composerPaddingRight,
  ...refinement.composerShadow
};
const COMPOSER_INPUT: TextStyle = {
  flex: 1,
  minHeight: artifact.composerHeight,
  backgroundColor: 'transparent',
  borderWidth: 0,
  paddingHorizontal: 0,
  paddingVertical: 0,
  lineHeight: shellType.rowTitleLine
};
const SEND: ViewStyle = {
  width: artifact.sendSize,
  height: artifact.sendSize,
  borderRadius: radius.pill,
  alignItems: 'center',
  justifyContent: 'center'
};

const MessageActions = ({
  actions,
  applyingActionId,
  onApplyAction
}: {
  actions: AppliableChatAction[];
  applyingActionId?: string | null;
  onApplyAction?: (action: AppliableChatAction) => void;
}) => (
  <View style={MESSAGE_ACTIONS}>
    {actions.map((action) => (
      <React.Fragment key={action.id}>
        {action.summary && action.state === 'available' ? (
          <Txt v="sm" tone="mute">
            {action.summary}
          </Txt>
        ) : null}
        {action.state === 'available' ? (
          <Button
            title={action.label}
            kind="chip"
            size="action"
            loading={applyingActionId === action.id}
            onPress={() => onApplyAction?.(action)}
          />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          {action.state === 'applied' ? <WorkingIcon name="check" size={refinement.appliedIcon} color={color.inkMute} /> : null}
          <Txt v="receipt" tone="mute">
            {action.state === 'applied'
              ? t('chat.actionDone', { label: action.result_label ?? action.label })
              : t('chat.actionStale', { label: action.label })}
          </Txt>
          </View>
        )}
      </React.Fragment>
    ))}
  </View>
);

export type ArtifactSurfaceProps = {
  headerTitle: string;
  messages: ChatMessage[];
  receipts?: Receipt[];
  sending: boolean;
  composerPlaceholder: string;
  onSend: (text: string) => void;
  onBack?: () => void;
  applyingActionId?: string | null;
  onApplyAction?: (action: AppliableChatAction) => void;
  /** Compact, typed shortcuts that belong to the conversation dock, not the item card. */
  composerActions?: React.ReactNode;
  image?: ConversationIdentity['image'];
  children?: React.ReactNode;
  variant?: 'artifact' | 'chat';
  identity?: ConversationIdentity;
};

export const ArtifactSurface = ({
  headerTitle,
  messages,
  receipts = [],
  sending,
  composerPlaceholder,
  onSend,
  onBack,
  applyingActionId,
  onApplyAction,
  composerActions,
  image,
  children,
  variant = 'artifact',
  identity
}: ArtifactSurfaceProps) => {
  const isChat = variant === 'chat';
  const [text, setText] = useState('');
  const [keyboardOverlap, setKeyboardOverlap] = useState<number | null>(null);
  const [dockHeight, setDockHeight] = useState<number>(artifact.composerHeight);
  const scroller = useRef<ScrollView>(null);
  const inFlight = useRef(false);
  const previousMessageCount = useRef(messages.length);
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'web' ? shellGeometry.referenceSafeBottom : insets.bottom;

  useEffect(() => {
    if (!sending) inFlight.current = false;
  }, [sending]);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => setKeyboardOverlap(Dimensions.get('screen').height - event.endCoordinates.screenY)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOverlap(null)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const previous = previousMessageCount.current;
    previousMessageCount.current = messages.length;
    // Open item details at the title, not halfway through their context card.
    if (previous === 0 || messages.length <= previous) return;
    const timer = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages.length]);

  useEffect(() => {
    if (keyboardOverlap === null) return;
    const frame = requestAnimationFrame(() => scroller.current?.scrollToEnd({ animated: true }));
    return () => cancelAnimationFrame(frame);
  }, [keyboardOverlap]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || sending || inFlight.current) return;
    inFlight.current = true;
    setText('');
    onSend(trimmed);
  };

  const { composerBottom } = resolveArtifactVerticalGeometry({
    keyboardOverlap,
    safeBottom,
    dockHeight
  });

  return (
    <Screen floatingChrome contentMode="canvas" headerContent={<CompactHeader title={headerTitle} identity={identity} onBack={onBack} />}>
      <View style={GROW}>
        <ScrollView
          ref={scroller}
          style={[GROW, { marginBottom: composerBottom + dockHeight + refinement.chatBottomGap }]}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: isChat ? shellGeometry.chat.threadPaddingX : artifact.contentPaddingX,
            paddingTop: isChat ? shellGeometry.chat.threadPaddingTop : artifact.contentPaddingTop,
            paddingBottom: artifact.composerThreadGap,
            gap: isChat ? space.sm : artifact.contentGap
          }}
        >
          {children}
          {messages.map((message, index) => (
            <React.Fragment key={message.id}>
            <ConversationBubble key={message.id} message={message} variant={variant} image={image}>
              {message.actions?.length ? <MessageActions actions={message.actions} applyingActionId={applyingActionId} onApplyAction={onApplyAction} /> : null}
            </ConversationBubble>
            {isChat && message.author === 'donna' && messages[index + 1]?.author === 'owner' ? <Txt v="pill" tone="mute" style={{ marginHorizontal: space.hair, marginBottom: space.sm, fontWeight: '400' }}>{t('chat.messageMeta', { name: identity?.name ?? headerTitle })}</Txt> : null}
            </React.Fragment>
          ))}
          {receipts.map((receipt) => (
            <ArtifactReceipt
              key={receipt.audit_event_ids[0] ?? receipt.summary}
              receipt={receipt}
            />
          ))}
        </ScrollView>
        <View
          onLayout={(event) => setDockHeight(event.nativeEvent.layout.height)}
          style={[COMPOSER_DOCK, { bottom: composerBottom }]}
        >
          {composerActions ? <View style={COMPOSER_ACTIONS}>{composerActions}</View> : null}
          <View style={[COMPOSER, isChat && { minHeight: shellGeometry.chat.composerHeight, borderWidth: 1, borderColor: color.ruleSoft, boxShadow: 'none' }]}>
            <Input
              placeholder={composerPlaceholder}
              value={text}
              onChangeText={setText}
              editable={!sending}
              onSubmitEditing={send}
              returnKeyType="send"
              accessibilityLabel={composerPlaceholder}
              style={[COMPOSER_INPUT, isChat && { minHeight: shellGeometry.chat.composerHeight }]}
            />
            <Pressable
              onPress={send}
              disabled={!text.trim() || sending}
              accessibilityRole="button"
              accessibilityLabel={t(isChat ? 'chat.send' : 'artifact.sendComment')}
              style={[SEND, isChat && { width: shellGeometry.chat.send, height: shellGeometry.chat.send }, { backgroundColor: isChat || (text.trim() && !sending) ? color.ink : color.inkWash }]}
            >
              <WorkingIcon
                name="arrow-up"
                size={refinement.headerGlyph}
                color={isChat || (text.trim() && !sending) ? color.paper : color.inkMute}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
};
