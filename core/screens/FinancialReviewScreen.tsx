import React from 'react';
import type { FinancialReview, ReviewNavigation } from '../api';
import { Button, ReportBlock, ReportSurface, Txt, type ConversationIdentity } from '../design';
import { t } from '../i18n';

export const FinancialReviewScreen = ({ review, kind, entityName, image, failed, refreshing, onRefresh, onBack, onChat, onAction, onRow }: {
  review?: FinancialReview; kind: 'taxes' | 'month'; entityName: string; image?: ConversationIdentity['image'];
  failed: boolean; refreshing: boolean; onRefresh: () => void; onBack: () => void; onChat: () => void;
  onAction: (action: ReviewNavigation) => void; onRow: (id: string) => void;
}) => <ReportSurface eyebrow={entityName} title={review?.title ?? t(kind === 'taxes' ? 'review.taxes' : 'review.month')}
  headline={review?.headline} footnote={review?.footnote} image={image} refreshing={refreshing}
  onRefresh={onRefresh} onBack={onBack} onChat={onChat}>
  {failed ? <><Txt v="sm">{t('common.error_generic')}</Txt><Button kind="text" title={t('common.retry')} onPress={onRefresh} /></> : null}
  {!review && !failed ? <Txt v="sm" tone="mute">{t('common.loading')}</Txt> : null}
  {review?.source === 'sample' ? <Txt v="meta" tone="mute">{t('review.sample')}</Txt> : null}
  {review?.source === 'not_configured' ? <Txt v="message">{t('review.unavailable')}</Txt> : null}
  {review?.blocks.map(block => <ReportBlock key={block.id} block={block} onAction={onAction} onRow={onRow} />)}
</ReportSurface>;
