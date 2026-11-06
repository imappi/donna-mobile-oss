import React from 'react';
import type { BooksStatus, PeriodStatus } from '../api';
import { Button, ReportBlock, ReportSurface, Txt, type ConversationIdentity } from '../design';
import { formatMonth, t } from '../i18n';

export type StatusScreenProps = {
  status?: BooksStatus; entityName: string; image?: ConversationIdentity['image'];
  refreshing: boolean; failed?: boolean; onRefresh: () => void;
  onOpenBlocker: (period: PeriodStatus, blocker: PeriodStatus['blockers'][number]) => void;
  onBack?: () => void; onChat: () => void; onTaxes: () => void; onMonth: (period: string) => void;
};

export const StatusScreen = ({ status, entityName, image, refreshing, failed, onRefresh, onOpenBlocker, onBack, onChat, onTaxes, onMonth }: StatusScreenProps) => (
  <ReportSurface eyebrow={entityName} title={t('status.title')} headline={status?.headline ?? undefined}
    image={image} refreshing={refreshing} onRefresh={onRefresh} onBack={onBack} onChat={onChat}>
    {failed ? <Txt v="sm">{t('common.error_generic')}</Txt> : null}
    {!status && !failed ? <Txt v="sm" tone="mute">{t('common.loading')}</Txt> : null}
    {(status?.periods ?? []).map(period => {
      const closed = period.lifecycle === 'closed' || period.lifecycle === 'locked';
      const pill = closed ? t(period.lifecycle === 'closed' ? 'status.closed' : 'status.locked') :
        t(period.state === 'ready' ? 'status.ready' : period.state === 'blocked' ? 'status.waiting' : 'common.appWorking');
      const month = formatMonth(period.period_start.slice(0, 7));
      return <ReportBlock key={period.period_start}
        block={{ id: period.period_start, title: month.charAt(0).toLocaleUpperCase() + month.slice(1),
          subtitle: period.completion ? t('status.recorded', period.completion) : undefined,
          pill, tone: closed ? 'machine' : period.state === 'blocked' ? 'accent' : 'quiet',
          rows: period.blockers.map(blocker => ({ label: blocker.label, value: blocker.count == null ? '' : String(blocker.count),
            owner: blocker.on === 'you' ? 'you' : 'donna', card_id: blocker.on === 'you' ? blocker.code : undefined })) }}
        onRow={code => { const blocker = period.blockers.find(item => item.code === code); if (blocker) onOpenBlocker(period, blocker); }}
        onTitle={status?.review_navigation ? () => onMonth(period.period_start.slice(0, 7)) : undefined} />;
    })}
    {status?.review_navigation ? <Button title={t('review.openTaxes')} kind="text" onPress={onTaxes} /> : null}
  </ReportSurface>
);
