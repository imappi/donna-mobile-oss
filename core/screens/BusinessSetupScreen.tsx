import React from 'react';
import type { BusinessIdentity, BusinessSetup, RegistryCandidate } from '../api';
import { Button, Card, Input, Row, Screen, Stack, Txt } from '../design';
import { t } from '../i18n';

export const IdentityDetails = ({ identity }: { identity: BusinessIdentity }) => <Stack gap="sm">
  <Txt v="heading">{identity.legal_name}</Txt>
  <Txt v="body">{identity.business_id} · {t(`setup.form_${identity.legal_form}`)}</Txt>
  {identity.legal_form_code && identity.legal_form === 'other' ? <Txt v="sm">{identity.legal_form_code}</Txt> : null}
  {identity.registered_address ? <Stack gap="xs"><Txt v="meta" tone="soft">{t('setup.registeredAddress')}</Txt><Txt v="body">{identity.registered_address}</Txt></Stack> : null}
  <Txt v="sm" tone="soft">{t(identity.source === 'prh_ytj' ? 'setup.registrySource' : 'setup.ownerSource')}</Txt>
  {identity.fetched_at ? <Txt v="sm" tone="soft">{t('setup.fetchedAt', { date: identity.fetched_at.slice(0, 10) })}</Txt> : null}
</Stack>;

export type BusinessSetupScreenProps = {
  setup?: BusinessSetup; loading: boolean; busy: boolean; error: string | null;
  businessId: string; legalName: string; legalForm: BusinessIdentity['legal_form']; manual: boolean;
  candidate: RegistryCandidate | null; lookupEmpty: boolean;
  editingIdentity: boolean; editingStage: boolean;
  onEditIdentity: () => void; onEditStage: () => void; onCancelEdit: () => void;
  onBusinessId: (value: string) => void; onLegalName: (value: string) => void;
  onLegalForm: (value: BusinessIdentity['legal_form']) => void; onManual: (value: boolean) => void;
  onLookup: () => void; onConfirm: () => void; onStage: (value: 'new' | 'existing') => void;
  onAddRecords: () => void; onCaptureReceipt: () => void; onLater: () => void; onBack: () => void; onRetry: () => void;
};

export const BusinessSetupScreen = (props: BusinessSetupScreenProps) => {
  const { setup, loading, busy, error, businessId, legalName, legalForm, manual, candidate, lookupEmpty } = props;
  const step = props.editingIdentity ? 'identify_business' : props.editingStage ? 'business_stage' : setup?.next_step;
  return <Screen title={t('setup.title')} onBack={props.onBack} scroll keyboardAvoiding>
    <Stack padX="screenX" padY="lg" gap="lg">
      {!setup?.identity || step === 'identify_business' ? <Txt v="body" tone="soft">{t('setup.intro')}</Txt> : null}
      {loading ? <Txt v="body">{t('setup.loading')}</Txt> : null}
      {error ? <Txt v="sm" tone="alert" accessibilityLiveRegion="polite">{error}</Txt> : null}
      {!loading && !setup ? <Button title={t('common.retry')} onPress={props.onRetry} /> : null}
      {setup?.identity && !props.editingIdentity ? <Card><Stack gap="md"><IdentityDetails identity={setup.identity} />
        <Button title={t('setup.editIdentity')} kind="text" disabled={busy} onPress={props.onEditIdentity} />
      </Stack></Card> : null}
      {step === 'identify_business' ? <Stack gap="md">
        <Txt v="heading">{t(manual ? 'setup.manualTitle' : 'setup.lookupTitle')}</Txt>
        <Txt v="body" tone="soft">{t('setup.lookupBenefit')}</Txt>
        <Stack gap="xs"><Txt v="sm">{t('setup.businessId')}</Txt>
          <Input variant="onboarding" accessibilityLabel={t('setup.businessId')} value={businessId}
            maxLength={9} autoCapitalize="none" autoCorrect={false} editable={!busy && !setup?.identity} onChangeText={props.onBusinessId} />
        </Stack>
        {setup?.identity ? <Txt v="sm" tone="soft">{t('setup.idLocked')}</Txt> : null}
        {manual ? <>
          <Stack gap="xs"><Txt v="sm">{t('setup.legalName')}</Txt>
            <Input variant="onboarding" accessibilityLabel={t('setup.legalName')} value={legalName} maxLength={1000} editable={!busy} onChangeText={props.onLegalName} />
          </Stack>
          <Txt v="sm">{t('setup.legalForm')}</Txt>
          <Row gap="sm" wrap accessibilityRole="radiogroup" accessibilityLabel={t('setup.legalForm')}>{(['sole_trader', 'limited_company', 'other'] as const).map(form =>
            <Button key={form} title={t(`setup.form_${form}`)} accessibilityRole="radio" accessibilityState={{ checked: legalForm === form }}
              icon={legalForm === form ? 'checkmark' : undefined} disabled={busy} onPress={() => props.onLegalForm(form)} />)}</Row>
          <Txt v="sm" tone="soft">{t('setup.manualNote')}</Txt>
          <Button title={t('setup.confirmManual')} kind="primary" size="large" disabled={!businessId.trim() || !legalName.trim()} loading={busy} onPress={props.onConfirm} />
        </> : candidate ? <>
          <Card><IdentityDetails identity={candidate} /></Card>
          <Txt v="sm" tone="soft">{t('setup.matchNote')}</Txt>
          <Button title={t('setup.confirmMatch')} kind="primary" size="large" loading={busy} onPress={props.onConfirm} />
        </> : <>
          {lookupEmpty ? <Txt v="body" accessibilityLiveRegion="polite">{t('setup.noMatch')}</Txt> : null}
          <Button title={t('setup.search')} kind="primary" size="large" disabled={!businessId.trim()} loading={busy} onPress={props.onLookup} />
        </>}
        <Button title={t(manual ? 'setup.useLookup' : 'setup.useManual')} kind="text" disabled={busy} onPress={() => props.onManual(!manual)} />
        <Txt v="sm" tone="soft">{t('setup.coverage')}</Txt>
      </Stack> : null}
      {step === 'business_stage' ? <Stack gap="md">
        <Txt v="heading">{t('setup.stageTitle')}</Txt><Txt v="body" tone="soft">{t('setup.stageBenefit')}</Txt>
        <Button title={t('setup.newBusiness')} disabled={busy} onPress={() => props.onStage('new')} />
        <Button title={t('setup.existingBusiness')} disabled={busy} onPress={() => props.onStage('existing')} />
      </Stack> : null}
      {step === 'prior_records' ? <Stack gap="md">
        <Txt v="heading">{t('setup.recordsTitle')}</Txt><Txt v="body">{t('setup.recordsBenefit')}</Txt>
        <Txt v="body" tone="soft">{t(setup?.identity?.legal_form === 'sole_trader' ? 'setup.recordsSole' : 'setup.recordsCompany')}</Txt>
        <Txt v="body" tone="soft">{t('setup.recordsCurrent')}</Txt>
        <Txt v="sm" tone="soft">{t('setup.recordsPreview')}</Txt>
        <Button title={t('setup.addRecords')} kind="primary" size="large" disabled={busy} onPress={props.onAddRecords} />
        <Txt v="sm" tone="soft">{t('setup.accountantHelp')}</Txt>
      </Stack> : null}
      {step === 'first_receipt' ? <Stack gap="md">
        <Txt v="heading">{t('setup.firstTitle')}</Txt><Txt v="body" tone="soft">{t('setup.firstBenefit')}</Txt>
        <Button title={t('setup.captureReceipt')} kind="primary" size="large" onPress={props.onCaptureReceipt} />
      </Stack> : null}
      {step === 'done' ? <Stack gap="md">
        <Txt v="heading">{t('setup.readyTitle')}</Txt>
        <Txt v="body" tone="soft">{t(setup?.prior_record_ids.length ? 'setup.recordsStored' : 'setup.readyBody')}</Txt>
        <Button title={t('setup.returnToApp')} kind="primary" size="large" onPress={props.onBack} />
        {setup?.business_stage === 'existing' ? <Button title={t('setup.addMoreRecords')} kind="text" disabled={busy} onPress={props.onAddRecords} /> : null}
      </Stack> : null}
      {setup ? <Stack gap="sm">
        {props.editingIdentity || props.editingStage ? <Button title={t('common.cancel')} kind="text" disabled={busy} onPress={props.onCancelEdit} />
          : setup.business_stage ? <Button title={t('setup.changeStage')} kind="text" disabled={busy} onPress={props.onEditStage} /> : null}
        <Txt v="sm" tone="soft">{t('setup.authorityNote')}</Txt>
        <Txt v="sm" tone="soft">{t('setup.taxNotReady')}</Txt>
        {step !== 'done' ? <Button title={t('setup.later')} kind="text" disabled={busy} onPress={props.onLater} /> : null}
      </Stack> : null}
    </Stack>
  </Screen>;
};
