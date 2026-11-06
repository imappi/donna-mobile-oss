import { WorkingIcon } from './WorkingIcon';
import React from 'react';
import { Pressable, View } from 'react-native';
import type { ArtifactPresentation, ChatMessage, DisplayFigure } from '../../api';
import { formatDate, formatMoney, t } from '../../i18n';
import { artifact, color, radius, refinement as r, shellGeometry, shellType, space, tapTarget, icon } from '../tokens';
import { Txt } from './Txt';
import { MascotOrb } from './MascotOrb';

export type ConversationIdentity = { name: string; detail: string; image?: React.ComponentProps<typeof MascotOrb>['image'] };
export const CompactHeader = ({ title, eyebrow = false, identity, onBack }: {
  title?: string; eyebrow?: boolean; identity?: ConversationIdentity; onBack?: () => void;
}) => <View style={{ minHeight: identity ? r.chatHeaderHeight : artifact.headerHeight,
  paddingLeft: artifact.headerPaddingX, paddingRight: identity ? r.chatHeaderRight : artifact.headerPaddingX,
  paddingTop: identity ? space.sm : artifact.headerPaddingTop, paddingBottom: artifact.headerPaddingBottom, flexDirection: 'row',
  alignItems: 'center', gap: identity ? r.chatBackGap : artifact.headerGap }}>
  {onBack ? <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')}
    style={{ width: tapTarget, height: tapTarget, borderRadius: radius.pill, backgroundColor: color.headerChip,
      alignItems: 'center', justifyContent: 'center', ...r.chromeShadow }}>
    <WorkingIcon name="chevron-left" size={r.headerGlyph} color={color.ink} />
  </Pressable> : null}
  {identity ? <>
    <MascotOrb working size={shellGeometry.chat.avatar} image={identity.image} imageSize={shellGeometry.chat.avatarImage} imageShift={shellGeometry.chat.avatarShift} />
    <View style={{ flex: 1, minWidth: 0, gap: r.reportHeaderGap }}>
      <Txt v="itemTitle" style={{ lineHeight: shellType.rowTitleLine, fontWeight: '600' }}>{identity.name}</Txt>
      <Txt v="meta" tone="mute" numberOfLines={1}>{identity.detail}</Txt>
    </View>
    <View accessibilityElementsHidden style={{ width: shellGeometry.chat.online, height: shellGeometry.chat.online,
      borderRadius: radius.pill, backgroundColor: color.accent }} />
  </> : <Txt v={eyebrow ? 'eyebrow' : 'itemTitle'} tone={eyebrow ? 'mute' : 'ink'} numberOfLines={1}
    style={{ flex: 1, fontWeight: '600' }}>{title}</Txt>}
</View>;

export const FigureRows = ({ figures }: { figures: DisplayFigure[] }) => <View style={{
  borderTopWidth: 1, borderTopColor: color.ruleSoft, paddingTop: space.sm, gap: space.hair }}>
  {figures.map((figure, index) => <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between',
    gap: space.md, ...(figure.emphasized ? { borderTopWidth: 1, borderTopColor: color.rule, paddingTop: space.hair, marginTop: r.reportHeaderGap } : {}) }}>
    <Txt v="reportRow" tone={figure.emphasized ? 'ink' : 'soft'} style={{ flex: 1, fontWeight: figure.emphasized ? '600' : '400' }}>{figure.label}</Txt>
    <Txt v="reportRow" tone={figure.emphasized ? 'ink' : 'soft'} tabular style={{ fontWeight: figure.emphasized ? '600' : '400' }}>{figure.value}</Txt>
  </View>)}
</View>;

export const EvidencePreview = ({ label, photo = false }: { label: string; photo?: boolean }) => <View style={{ minHeight: photo ? r.photoHeight : r.evidenceHeight,
  borderRadius: r.evidenceRadius, backgroundColor: photo ? color.card : color.paperDeep, borderWidth: photo ? 0 : 1, borderColor: color.ruleSoft,
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: r.receiptGap, padding: space.md }}>
  <WorkingIcon name="file-text" size={icon.size} color={color.inkMute} />
  <Txt v="meta" tone="mute" style={{ flexShrink: 1 }}>{label}</Txt>
</View>;

export const ArtifactEvidence = ({ presentation }: { presentation?: ArtifactPresentation }) => {
  const invoice = presentation?.invoice;
  if (!invoice && !presentation?.evidence) return null;
  return <View style={{ marginTop: r.invoiceRuleGap, paddingTop: r.invoiceRuleGap, borderTopWidth: 1, borderTopColor: color.ruleSoft, gap: r.invoiceGap }}>
    {invoice ? <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
        <Txt v="meta" tone="mute" tabular>{invoice.number}</Txt>
        {invoice.due_on ? <Txt v="meta" tone="mute" tabular>{t('artifact.due', { date: formatDate(invoice.due_on) })}</Txt> : null}
      </View>
      {invoice.lines.map((line, index) => <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
        <Txt v="reportRow" tone="soft" style={{ flex: 1 }}>{line.label}</Txt>
        <Txt v="reportRow" tabular>{formatMoney(line.amount, invoice.currency)}</Txt>
      </View>)}
      <View style={{ borderTopWidth: 1, borderTopColor: color.rule, paddingTop: space.sm, flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
        <Txt v="itemTitle" style={{ fontWeight: '600' }}>{t('artifact.total')}</Txt>
        <Txt v="itemTitle" style={{ fontWeight: '600' }} tabular>{formatMoney(invoice.total, invoice.currency)}</Txt>
      </View>
    </> : null}
    {presentation?.evidence ? <EvidencePreview label={presentation.evidence.label} /> : null}
  </View>;
};

export const ConversationBubble = ({ message, variant = 'chat', image, children }: {
  message: ChatMessage; variant?: 'chat' | 'artifact'; image?: ConversationIdentity['image']; children?: React.ReactNode;
}) => {
  const owner = message.author === 'owner';
  const item = variant === 'artifact';
  if (message.attachment) return <View style={{ alignSelf: 'flex-end', width: r.photoWidth, maxWidth: '100%',
    borderRadius: radius.bubble, borderBottomRightRadius: radius.chip * 2, padding: r.photoPadding, backgroundColor: color.inkWash }}>
    <EvidencePreview label={message.attachment.label} photo />
  </View>;
  return <View style={{ flexDirection: 'row', gap: r.messageAvatarGap, alignItems: 'flex-end',
    alignSelf: owner ? 'flex-end' : 'flex-start', maxWidth: item ? owner ? artifact.ownerBubbleMax : artifact.bubbleMax :
      owner ? shellGeometry.chat.ownerBubbleMax : shellGeometry.chat.donnaBubbleMax }}>
    {item && !owner ? <MascotOrb working size={r.messageAvatar} image={image} imageSize={r.messageAvatarImage} imageShift={r.messageAvatarShift} /> : null}
    <View style={{ flexShrink: 1, minWidth: 0, borderRadius: radius.bubble, borderBottomLeftRadius: owner ? radius.bubble : radius.chip * 2,
      borderBottomRightRadius: owner ? radius.chip * 2 : radius.bubble,
      backgroundColor: owner ? item ? color.ink : color.inkWash : color.card,
      borderWidth: !owner && !item ? 1 : 0, borderColor: color.ruleSoft,
      paddingHorizontal: artifact.bubblePaddingX, paddingVertical: item ? artifact.bubblePaddingY : shellGeometry.chat.bubblePaddingY, gap: r.receiptGap, ...(!owner && item ? r.bubbleShadow : {}) }}>
      <Txt v="message" tone={owner && item ? 'paper' : 'ink'}>{message.text}</Txt>
      {message.figures?.length ? <FigureRows figures={message.figures} /> : null}
      {children}
    </View>
  </View>;
};
