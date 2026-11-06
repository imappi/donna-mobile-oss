import React, { useState } from 'react';
import { BusinessProfileCard, Button, Card, Input, OnboardingLayout, Stack, Txt, type BusinessCardValue } from '../design';
import { t } from '../i18n';
import { CARD_FACT_FIELDS, CARD_FIELD_LABELS, profileFieldHint, visibleCardFactFields } from '../onboarding/card';
import { PROFILE_FIELDS, type OnboardingProfileFieldState, type OnboardingProfileForm, type ProfileFieldName } from '../onboarding/profile';

export type OnboardingProfileReviewScreenProps = {
  values: OnboardingProfileForm; fieldState: OnboardingProfileFieldState; rawTranscript?: string | null;
  samplePreview?: boolean; source: 'typed' | 'voice'; busy: boolean; error?: string | null;
  onChange: (field: ProfileFieldName, value: string) => void; onConfirm: (values: OnboardingProfileForm) => void; onSwitchToVoice: () => void;
};

export const OnboardingProfileReviewScreen = ({ values, fieldState, rawTranscript, samplePreview, source,
  busy, error, onChange, onConfirm, onSwitchToVoice }: OnboardingProfileReviewScreenProps) => {
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState(values);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showEmptyFields, setShowEmptyFields] = useState(false);
  const displayed = editing ? edits : values;
  const cardValue = (field: ProfileFieldName): BusinessCardValue => {
    const hintKey = profileFieldHint(field, fieldState);
    return { key: field, label: t(CARD_FIELD_LABELS[field]), value: displayed[field],
      hint: hintKey && displayed[field] === values[field] ? t(hintKey) : undefined };
  };
  const optionalValue = (field: ProfileFieldName) => (editing && showEmptyFields) ||
    (displayed[field].trim() && fieldState[field].state !== 'missing') ? cardValue(field) : undefined;
  const startEditing = () => { setEdits({ ...values }); setShowEvidence(false); setShowEmptyFields(false); setEditing(true); };
  const finishEditing = () => {
    for (const field of PROFILE_FIELDS) if (edits[field] !== values[field]) onChange(field, edits[field].trim());
    setEditing(false);
    setShowEvidence(false);
  };
  const facts = editing ? CARD_FACT_FIELDS.filter(field => showEmptyFields || values[field].trim()) : visibleCardFactFields(values, fieldState);
  const renderEditor = (fact: BusinessCardValue) => {
    const field = fact.key as ProfileFieldName;
    const identity = ['business_name', 'owner_name', 'profession'].includes(field);
    return <Stack gap="xs">
      {!identity ? <Txt v="onboardingNote" tone="soft">{fact.label}</Txt> : null}
      <Input variant="card" cardRole={field === 'business_name' ? 'company' : field === 'owner_name' ? 'owner' : field === 'profession' ? 'profession' : 'fact'}
        accessibilityLabel={fact.label} value={edits[field]} editable={!busy}
        multiline={field === 'description' || ['people_involved', 'payment_methods', 'spending_categories'].includes(field)}
        maxLength={field === 'owner_name' ? 120 : field === 'business_name' ? 160 : field === 'description' ? 600 : 240}
        onChangeText={value => setEdits(previous => ({ ...previous, [field]: value }))} />
    </Stack>;
  };

  return <OnboardingLayout page="card" title={t('onboarding.cardTitle')} body={t('onboarding.cardBody')} keyboard footer={
    <>
      {error ? <Txt v="body" tone="alert" accessibilityLiveRegion="polite">{error}</Txt> : null}
      <Button title={t('onboarding.cardConfirm')} kind="primary" size="onboarding" loading={busy}
        disabled={!displayed.owner_name.trim() || !displayed.business_name.trim()} onPress={() => onConfirm(displayed)} />
      <Button title={t('onboarding.recordAgain')}
        kind="text" size="onboarding" icon="microphone" disabled={busy} onPress={onSwitchToVoice} />
    </>
  }>
    {samplePreview ? <Card><Txt v="sm" tone="soft">{t('onboarding.voiceSamplePreview')}</Txt></Card> : null}
    <BusinessProfileCard company={cardValue('business_name')} owner={cardValue('owner_name')}
      profession={editing ? cardValue('profession') : optionalValue('profession')}
      description={optionalValue('description')} facts={facts.map(cardValue)}
      editLabel={t(editing ? 'onboarding.cardSaveEdits' : 'onboarding.cardEdit')} busy={busy}
      editing={editing} onEdit={editing ? finishEditing : startEditing} renderField={editing ? renderEditor : undefined}
      onEditFact={() => { if (!editing) setEdits({ ...values }); setEditing(true); setShowEmptyFields(true); }}
      editableFields={editing ? showEmptyFields ? PROFILE_FIELDS : ['business_name', 'owner_name', 'profession'] : []}>
      {editing && showEmptyFields ? <Stack gap="sm">
        {showEmptyFields ? <Button title={t('common.cancel')} kind="text" size="onboarding" onPress={() => setEditing(false)} /> : null}
        {rawTranscript ? <>
          <Button title={t(showEvidence ? 'onboarding.hideRawTranscript' : 'onboarding.showRawTranscript')}
            kind="text" size="onboarding" onPress={() => setShowEvidence(!showEvidence)} />
          {showEvidence ? <Stack gap="sm">
            <Txt v="onboardingNote" tone="soft">{t(source === 'voice' ? 'onboarding.profileRawTranscript' : 'onboarding.originalIntroduction')}</Txt>
            <Txt v="body">{rawTranscript}</Txt>
          </Stack> : null}
        </> : null}
      </Stack> : null}
    </BusinessProfileCard>
  </OnboardingLayout>;
};
