import React from 'react';
import { View, type ViewStyle } from 'react-native';
import type { Doc } from '../api';
import type { QueuedCapture } from '../capture/queue';
import {
  Button,
  color,
  EmptyState,
  ListRow,
  radius,
  Row,
  Screen,
  SectionHeader,
  shellGeometry,
  shellType,
  space,
  Stack,
  Txt,
  type DotVoice
} from '../design';
import { formatMoney, t } from '../i18n';

/**
 * MATERIALS — every capture and where it stands. Adding happens through
 * Donna's launcher; this surface renders the persisted states (the dot
 * carries the voice: accent = needs you, alert = failed). The recovery view opens
 * it with one quiet intro line + the recent-count pill. Queued rows on
 * top are the one on-device exception: transport state — "not with
 * {brand} yet" — which the backend cannot know. A blocked queued capture
 * offers retry/remove; nothing rests here without a way out.
 */
export type MaterialsScreenProps = {
  documents: Doc[];
  refreshing: boolean;
  onRefresh: () => void;
  eyebrow?: string | null;
  onEyebrowPress?: () => void;
  onBack?: () => void;
  queued?: QueuedCapture[];
  onRetryQueued?: (id: string) => void;
  onDiscardQueued?: (id: string) => void;
  onOpenDocument: (doc: Doc) => void;
};

const INTRO: ViewStyle = {
  minHeight: shellGeometry.materials.introHeight,
  paddingHorizontal: shellGeometry.materials.introPaddingX,
  paddingVertical: space.md,
  justifyContent: 'center',
  backgroundColor: color.card,
  borderBottomWidth: 1,
  borderBottomColor: color.ruleSoft
};
const INTRO_PILL: ViewStyle = {
  backgroundColor: color.accentWash,
  borderRadius: radius.pill,
  minWidth: shellGeometry.materials.pillMinWidth,
  minHeight: shellGeometry.materials.pillHeight,
  paddingHorizontal: shellGeometry.materials.pillPaddingX,
  paddingVertical: space.xs,
  alignItems: 'center',
  justifyContent: 'center'
};
const INTRO_COPY: ViewStyle = { flex: 1, minWidth: 0 };

const stateLabel = (doc: Doc): string => {
  switch (doc.capture_state) {
    case 'stored':
      return t('setup.storedLabel');
    case 'received':
      return t('capture.status_received');
    case 'processing':
      return t('capture.status_processing');
    case 'attached':
      return t('capture.status_attached');
    case 'needs_info':
    case 'duplicate':
      return t('capture.status_needs_info');
    case 'failed':
      return t('capture.status_failed');
  }
};

const stateVoice = (doc: Doc): DotVoice => {
  if (doc.capture_state === 'failed') return 'alert';
  if (doc.capture_state === 'needs_info' || doc.capture_state === 'duplicate') return 'accent';
  return 'quiet';
};

export const MaterialsScreen = ({
  documents,
  refreshing,
  onRefresh,
  eyebrow,
  onEyebrowPress,
  onBack,
  queued = [],
  onRetryQueued,
  onDiscardQueued,
  onOpenDocument
}: MaterialsScreenProps) => (
  <Screen
    title={t('materials.title')}
    eyebrow={eyebrow}
    onEyebrowPress={onEyebrowPress}
    onBack={onBack}
    scroll
    floatingChrome
    refreshing={refreshing}
    onRefresh={onRefresh}
  >
    <View style={INTRO}>
      <Row gap="md">
        <View style={INTRO_COPY}>
          <Txt
            v="body"
            em
            numberOfLines={1}
            style={{ lineHeight: shellType.rowTitleLine, letterSpacing: shellType.rowTitleTracking }}
          >
            {t('materials.introTitle')}
          </Txt>
          <Txt
            v="meta"
            tone="mute"
            numberOfLines={1}
            style={{ marginTop: shellGeometry.materials.introCopyGap }}
          >
            {t('materials.introSub')}
          </Txt>
        </View>
        <View style={INTRO_PILL}>
          <Txt v="meta" em tone="mute" tabular>
            {t('materials.recentPill', { count: documents.length })}
          </Txt>
        </View>
      </Row>
    </View>
    {queued.length > 0 ? (
      <>
        <SectionHeader label={t('materials.queuedSection')} count={queued.length} first />
        {queued.map((entry) => (
          <React.Fragment key={entry.id}>
            <ListRow
              dot={entry.state === 'blocked' ? 'alert' : 'quiet'}
              title={entry.file.filename}
              subtitle={entry.state === 'blocked' ? entry.error : null}
              trailingMeta={entry.state === 'blocked' ? t('materials.queuedFailed') : t('materials.queuedWaiting')}
            />
            {entry.state === 'blocked' ? (
              <Stack padX="rowX" padY="sm">
                <Row gap="sm">
                  <Button title={t('common.retry')} kind="chip" onPress={() => onRetryQueued?.(entry.id)} />
                  <Button title={t('materials.queuedDiscard')} kind="chip" onPress={() => onDiscardQueued?.(entry.id)} />
                </Row>
              </Stack>
            ) : null}
          </React.Fragment>
        ))}
      </>
    ) : null}
    <SectionHeader label={t('capture.recent')} count={documents.length} first={queued.length === 0} />
    {documents.length === 0 && queued.length === 0 ? <EmptyState text={t('materials.empty')} /> : null}
    {documents.map((doc) => {
      const voice = stateVoice(doc);
      return (
        <ListRow
          key={doc.id}
          dot={voice}
          title={doc.counterparty ?? doc.filename}
          subtitle={doc.counterparty ? doc.filename : null}
          trailing={doc.total_amount != null && doc.currency ? formatMoney(doc.total_amount, doc.currency) : null}
          trailingMeta={stateLabel(doc)}
          trailingTone={voice === 'quiet' ? 'mute' : voice}
          onPress={() => onOpenDocument(doc)}
        />
      );
    })}
  </Screen>
);
