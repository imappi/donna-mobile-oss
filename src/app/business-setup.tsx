import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, type BusinessIdentity, type BusinessSetupAction, type RegistryCandidate } from '@core/api';
import { BusinessSetupScreen } from '@core/screens/BusinessSetupScreen';
import { t } from '@core/i18n';
import { entityGate } from '@/state/entityGate';
import { useSession } from '@/state/session';
import { useBusinessSetup } from '@/state/hooks';
import { useCaptureActions } from '@/state/captureActions';

function SetupController({ entityId, initialName }: { entityId: string; initialName: string }) {
  const { api } = useSession();
  const query = useBusinessSetup();
  const client = useQueryClient();
  const router = useRouter();
  const { addPriorRecords, snapReceipt } = useCaptureActions();
  const [businessId, setBusinessId] = useState('');
  const [legalName, setLegalName] = useState(initialName);
  const [legalForm, setLegalForm] = useState<BusinessIdentity['legal_form']>('sole_trader');
  const [manual, setManual] = useState(false);
  const [candidate, setCandidate] = useState<RegistryCandidate | null>(null);
  const [lookupEmpty, setLookupEmpty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [editingStage, setEditingStage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const back = () => router.replace('/actions');
  const failure = (cause: unknown) => setError(t(cause instanceof ApiError && cause.code === 'BUSINESS_ID_INVALID' ? 'setup.invalidId'
    : cause instanceof ApiError && cause.code === 'REGISTRY_CANDIDATE_EXPIRED' ? 'setup.expired' : 'setup.unavailable'));
  const update = async (action: BusinessSetupAction) => {
    setBusy(true); setError(null);
    try {
      const result = await api.updateBusinessSetup(entityId, action);
      client.setQueryData(['business-setup', entityId], result.setup);
      setCandidate(null);
      setEditingIdentity(false);
      setEditingStage(false);
      if (action.type === 'defer') back();
    } catch (cause) { failure(cause); } finally { setBusy(false); }
  };
  const lookup = async () => {
    setBusy(true); setError(null); setCandidate(null); setLookupEmpty(false);
    try { const result = await api.lookupBusiness(entityId, businessId); setCandidate(result.candidate); setLookupEmpty(!result.candidate); }
    catch (cause) { failure(cause); } finally { setBusy(false); }
  };
  return <BusinessSetupScreen setup={query.data} loading={query.isLoading} busy={busy} error={error ?? (query.isError ? t('setup.unavailable') : null)}
    businessId={businessId} legalName={legalName} legalForm={legalForm} manual={manual} candidate={candidate} lookupEmpty={lookupEmpty}
    editingIdentity={editingIdentity} editingStage={editingStage}
    onEditIdentity={() => {
      const identity = query.data?.identity;
      if (!identity) return;
      setBusinessId(identity.business_id); setLegalName(identity.legal_name); setLegalForm(identity.legal_form);
      setManual(identity.source === 'owner'); setCandidate(null); setError(null); setEditingIdentity(true); setEditingStage(false);
    }}
    onEditStage={() => { setEditingStage(true); setEditingIdentity(false); setError(null); }}
    onCancelEdit={() => { setEditingIdentity(false); setEditingStage(false); setCandidate(null); setError(null); }}
    onBusinessId={value => { setBusinessId(value); setCandidate(null); setLookupEmpty(false); setError(null); }}
    onLegalName={setLegalName} onLegalForm={setLegalForm} onManual={value => { setManual(value); setCandidate(null); setError(null); }}
    onLookup={lookup} onConfirm={() => manual ? update({ type: 'confirm_manual', business_id: businessId, legal_name: legalName, legal_form: legalForm })
      : candidate ? update({ type: 'confirm_registry', candidate_id: candidate.candidate_id }) : undefined}
    onStage={value => update({ type: 'set_stage', business_stage: value })}
    onAddRecords={addPriorRecords} onCaptureReceipt={snapReceipt}
    onLater={() => update({ type: 'defer' })} onBack={back} onRetry={() => query.refetch()} />;
}

export default function BusinessSetupRoute() {
  const { state } = useSession();
  const gate = entityGate(state);
  if (gate === 'wait') return null;
  if (gate === '/unlock' || gate === '/onboarding/phone') return <Redirect href={gate} />;
  if (state.phase !== 'signedIn') return null;
  const entity = state.entities.find(item => item.id === state.entityId);
  if (entity?.country !== 'FI') return <Redirect href="/actions" />;
  return <><Head><title>{t('setup.title')}</title></Head>
    <SetupController key={state.entityId} entityId={state.entityId} initialName={entity.business_profile ? entity.display_name : ''} /></>;
}
