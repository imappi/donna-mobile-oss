import React from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import type { FinancialReview, ReviewNavigation } from '../../api';
import { t } from '../../i18n';
import { color, radius, refinement as r, shadow } from '../tokens';
import { CompactHeader, type ConversationIdentity } from './RefinedContent';
import { Screen } from './Screen';
import { Txt } from './Txt';
import { StatusPill } from './StatusPill';
import { Button } from './Button';
import { FloatingDonnaButton } from './FloatingMenu';

export type ReportBlockData = FinancialReview['blocks'][number];
export const ReportBlock = ({ block, onAction, onRow, onTitle }: {
  block: ReportBlockData; onAction?: (action: ReviewNavigation) => void;
  onRow?: (id: string) => void; onTitle?: () => void;
}) => <View style={{ backgroundColor: color.card, borderRadius: radius.streamCard,
  padding: r.reportPadding, gap: r.reportCardGap, ...shadow.streamCard }}>
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: r.reportCardGap }}>
    <Pressable disabled={!onTitle} onPress={onTitle} accessibilityRole={onTitle ? 'button' : undefined}
      style={{ flex: 1, minWidth: 0, gap: r.reportHeaderGap }}>
      <Txt v="reportHeading">{block.title}</Txt>
      {block.subtitle ? <Txt v="meta" tone="mute" tabular>{block.subtitle}</Txt> : null}
    </Pressable>
    {block.pill ? <StatusPill label={block.pill} tone={block.tone ?? 'quiet'} /> : null}
  </View>
  {block.figure ? <View style={{ gap: r.reportHeaderGap }}>
    <Txt v="reportFigure" tabular>{block.figure}</Txt>
    {block.figure_label ? <Txt v="meta" tone="mute">{block.figure_label}</Txt> : null}
  </View> : null}
  {block.text ? <Txt v="message">{block.text}</Txt> : null}
  {block.rows?.length ? <View>{block.rows.map((row, index) =>
    <Pressable key={index} disabled={!row.card_id || !onRow} onPress={() => row.card_id && onRow?.(row.card_id)}
      accessibilityRole={row.card_id && onRow ? 'button' : undefined}
      style={{ minHeight: r.reportRowHeight, flexDirection: 'row', alignItems: 'center', gap: r.reportRowGap,
        borderBottomWidth: index === (block.rows?.length ?? 0) - 1 ? 0 : 1, borderBottomColor: color.ruleSoft }}>
      {row.owner ? <View style={{ width: r.reportDot, height: r.reportDot, borderRadius: radius.pill,
        backgroundColor: row.owner === 'you' ? color.accent : 'transparent',
        borderWidth: row.owner === 'you' ? 0 : r.reportDotBorder, borderColor: color.inkMute }} /> : null}
      <Txt v="reportRow" tone={row.owner === 'you' ? 'ink' : 'soft'} style={{ flex: 1, minWidth: 0 }}>{row.label}</Txt>
      {row.value ? <Txt v="reportRow" tone="soft" tabular>{row.value}</Txt> : null}
    </Pressable>)}</View> : null}
  {block.action ? <View style={{ alignSelf: 'flex-start' }}>
    <Button title={block.action.label} kind="chip" size="action" onPress={() => block.action && onAction?.(block.action)} />
  </View> : null}
</View>;

export const ReportSurface = ({ eyebrow, title, headline, footnote, image, refreshing, onRefresh, onBack, onChat, children }: {
  eyebrow: string; title: string; headline?: string; footnote?: string;
  image?: ConversationIdentity['image']; refreshing?: boolean; onRefresh?: () => void;
  onBack?: () => void; onChat: () => void; children: React.ReactNode;
}) => <Screen floatingChrome contentMode="canvas" headerContent={<CompactHeader title={eyebrow.toLocaleUpperCase()} eyebrow onBack={onBack} />}>
  <ScrollView keyboardShouldPersistTaps="handled"
    refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={color.inkMute} /> : undefined}
    contentContainerStyle={{ paddingTop: r.reportTop, paddingHorizontal: r.reportInset, paddingBottom: r.reportBottom, gap: r.reportGap }}>
    <View style={{ paddingHorizontal: r.reportHeadingX, paddingTop: r.reportHeadingTop,
      paddingBottom: r.reportHeadingBottom, gap: r.reportGap }}>
      <Txt v="title">{title}</Txt>
      {headline ? <Txt v="reportLead" tone="soft">{headline}</Txt> : null}
    </View>
    {children}
    {footnote ? <Txt v="meta" tone="mute" style={{ paddingHorizontal: r.reportHeadingX, paddingTop: r.reportHeadingTop, lineHeight: r.reportFootLine }}>{footnote}</Txt> : null}
  </ScrollView>
  <FloatingDonnaButton accessibilityLabel={t('review.ask')} image={image} open={false} onPress={onChat} />
</Screen>;
