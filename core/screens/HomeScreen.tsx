import React, { useCallback, useMemo } from 'react';
import {
  RefreshControl,
  SectionList,
  type SectionListData,
  type SectionListRenderItemInfo,
  type ViewStyle
} from 'react-native';
import type { BusinessSetup, Doc, QueueCard, QueueResponse } from '../api';
import type { QueuedCapture } from '../capture/queue';
import {
  color,
  FirstReceipt,
  EmptyState,
  PeriodHeader,
  Screen,
  stream,
  StreamCard,
  Button, Card, Row, Stack, Txt,
  type StreamCardProps
} from '../design';
import { formatDate, formatMoney, formatMonth, t } from '../i18n';
import { buildHomeSections, buildHomeStream, homeFeedState, type HomeItemState, type HomeStreamEntry } from './homeStream';
import { documentContext, queuedCaptureContext, queueCardContext } from './homePresentation';
import { SETUP_SUGGESTIONS } from '../onboarding/setup';

export type HomeScreenProps = {
  queue?: QueueResponse;
  documents: Doc[];
  queued: QueuedCapture[];
  eyebrow?: string | null;
  onEyebrowPress?: () => void;
  loading: boolean;
  loadFailed?: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenCard: (card: QueueCard) => void;
  onOpenDocument: (document: Doc) => void;
  onOpenQueuedCapture: (capture: QueuedCapture) => void;
  onSnapReceipt: () => void;
  onAddFile: () => void;
  ownerName?: string;
  setup?: BusinessSetup;
  setupBusy?: boolean;
  onOpenSetup?: () => void;
  onDeferSetup?: () => void;
};

const LIST_CONTENT_STYLE: ViewStyle = {
  paddingHorizontal: stream.horizontalInset,
  paddingTop: stream.topInset,
  paddingBottom: stream.bottomInset
};

const STATE_PRESENTATION: Record<HomeItemState, { label: () => string; tone: StreamCardProps['stateTone'] }> = {
  needs_input: { label: () => t('home.state.needsInput'), tone: 'accent' },
  processing: { label: () => t('home.state.processing'), tone: 'quiet' },
  handled: { label: () => t('home.state.handled'), tone: 'quiet' },
  stalled: { label: () => t('home.state.stalled'), tone: 'alert' }
};

const cardType = (
  card: QueueCard
): Pick<StreamCardProps, 'iconName' | 'iconTone'> & { label: string } => {
  if (card.class === 'ask') {
    return { label: t('home.type.question'), iconName: 'help-circle', iconTone: 'gold' };
  }
  if (card.class === 'approval') {
    return { label: t('home.type.approval'), iconName: 'check-circle', iconTone: 'peach' };
  }
  return { label: t('home.type.update'), iconName: 'activity', iconTone: 'rose' };
};

const documentType = (
  document: Doc
): Pick<StreamCardProps, 'iconName' | 'iconTone'> & { label: string } => {
  switch (document.document_type) {
    case 'receipt':
      return { label: t('home.type.receipt'), iconName: 'file', iconTone: 'gold' };
    case 'supplier_bill':
      return { label: t('home.type.bill'), iconName: 'file', iconTone: 'peach' };
    case 'sales_invoice':
      return { label: t('home.type.invoice'), iconName: 'file-plus', iconTone: 'rose' };
    case 'bank_statement':
      return { label: t('home.type.statement'), iconName: 'align-left', iconTone: 'peach' };
    default:
      return { label: t('home.type.document'), iconName: 'file', iconTone: 'gold' };
  }
};

const metadata = (type: string, day: string): string =>
  [type, day ? formatDate(day) : null].filter(Boolean).join(' · ');

const entryPresentation = (
  entry: HomeStreamEntry
): Pick<
  StreamCardProps,
  'iconName' | 'iconTone' | 'title' | 'meta' | 'amount' | 'stateLabel' | 'stateTone'
> => {
  const state = STATE_PRESENTATION[entry.state];
  if (entry.kind === 'card') {
    const type = cardType(entry.card);
    return {
      iconName: type.iconName,
      iconTone: type.iconTone,
      title: queueCardContext(entry.card),
      meta: metadata(type.label, entry.day),
      amount:
        entry.card.amount != null && entry.card.currency
          ? formatMoney(entry.card.amount, entry.card.currency)
          : null,
      stateLabel: state.label(),
      stateTone: state.tone
    };
  }
  if (entry.kind === 'document') {
    const type = documentType(entry.document);
    if (entry.document.purpose === 'prior_records' && entry.document.capture_state === 'stored') return {
      iconName: 'file', iconTone: 'gold', title: t('setup.storedTitle'), meta: metadata(type.label, entry.day),
      amount: null, stateLabel: t('setup.storedLabel'), stateTone: 'quiet'
    };
    return {
      iconName: type.iconName,
      iconTone: type.iconTone,
      title: documentContext(entry.document, type.label),
      meta: metadata(type.label, entry.day),
      amount:
        entry.document.total_amount != null && entry.document.currency
          ? formatMoney(entry.document.total_amount, entry.document.currency)
          : null,
      stateLabel: state.label(),
      stateTone: state.tone
    };
  }
  return {
    iconName: 'upload-cloud',
    iconTone: 'rose',
    title: queuedCaptureContext(entry.capture, t('home.type.upload')),
    meta: metadata(t('home.type.upload'), entry.day),
    amount: null,
    stateLabel: state.label(),
    stateTone: state.tone
  };
};

export const HomeScreen = ({
  queue,
  documents,
  queued,
  eyebrow,
  onEyebrowPress,
  loading,
  loadFailed = false,
  refreshing,
  onRefresh,
  onOpenCard,
  onOpenDocument,
  onOpenQueuedCapture,
  onSnapReceipt, onAddFile, ownerName, setup, setupBusy, onOpenSetup, onDeferSetup
}: HomeScreenProps) => {
  const suggestion = setup?.suggestion_available && !setup.suggestion_dismissed && setup.next_step !== 'done' ? SETUP_SUGGESTIONS[setup.next_step] : null;
  const sections = useMemo(
    () => buildHomeSections(buildHomeStream({ cards: queue?.cards ?? [], documents, queued })),
    [queue?.cards, documents, queued]
  );
  const feedState = homeFeedState({ loading, failed: loadFailed, hasEntries: sections.length > 0 });
  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<HomeStreamEntry> }) => (
      <PeriodHeader label={formatMonth(section.key ?? 'undated')} />
    ),
    []
  );
  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<HomeStreamEntry>) => {
      const presentation = entryPresentation(item);
      const onPress =
        item.kind === 'card'
          ? () => onOpenCard(item.card)
          : item.kind === 'document'
            ? () => onOpenDocument(item.document)
            : () => onOpenQueuedCapture(item.capture);
      return (
        <StreamCard
          {...presentation}
          onPress={onPress}
          accessibilityLabel={[
            presentation.title,
            presentation.meta,
            presentation.amount,
            presentation.stateLabel
          ]
            .filter(Boolean)
            .join('. ')}
        />
      );
    },
    [onOpenCard, onOpenDocument, onOpenQueuedCapture]
  );

  return (
    <Screen
      title={t('home.title')}
      eyebrow={eyebrow}
      onEyebrowPress={onEyebrowPress}
      floatingChrome
      contentMode="canvas"
      groundVariant={feedState === 'empty' ? 'brand' : 'shell'}
    >
      <SectionList
        sections={sections}
        keyExtractor={(entry) => entry.key}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={LIST_CONTENT_STYLE}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.inkMute} />}
        ListHeaderComponent={
          <>
            {loadFailed && sections.length > 0 ? (
              <Stack padY="sm">
                <Txt v="sm" tone="soft" accessibilityLiveRegion="polite">{t('home.refreshFailed')}</Txt>
                <Button title={t('common.retry')} kind="text" onPress={onRefresh} />
              </Stack>
            ) : null}
            {suggestion && onOpenSetup && onDeferSetup ? (
              <Stack padY="md"><Card><Stack gap="sm">
                <Txt v="heading">{t(suggestion.title)}</Txt>
                <Txt v="body" tone="soft">{t(suggestion.body)}</Txt>
                <Row gap="sm" wrap>
                  <Button title={t(suggestion.action)} onPress={onOpenSetup} disabled={setupBusy} />
                  <Button title={t('setup.later')} kind="text" onPress={onDeferSetup} disabled={setupBusy} />
                </Row>
              </Stack></Card></Stack>
            ) : null}
          </>
        }
        ListEmptyComponent={
          feedState === 'loading' ? <EmptyState text={t('home.loading')} /> : feedState === 'unavailable'
          ? <EmptyState title={t('home.loadFailed')} text={t('home.loadFailedBody')}
              actionTitle={t('common.retry')} onAction={onRefresh} /> : (
            <FirstReceipt
              title={ownerName ? t('onboarding.firstBooksGreeting', { name: ownerName.trim().split(/\s+/)[0] }) : t('onboarding.firstBooksGeneric')}
              body={t('onboarding.firstBooksBody')}
              action={t('onboarding.booksEmptyAction')}
              addFile={t('onboarding.firstBooksAddFile')}
              ghost={t('onboarding.firstBooksGhost')}
              onCapture={onSnapReceipt}
              onAddFile={onAddFile}
            />
          )
        }
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
      />
    </Screen>
  );
};
