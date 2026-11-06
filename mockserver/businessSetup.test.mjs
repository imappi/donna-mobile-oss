import assert from 'node:assert/strict';
import test from 'node:test';
import { businessId, lookupBusiness, registryIdentity, setupSnapshot, stageRegistryCandidate, updateBusinessSetup } from './businessSetup.mjs';

const id = '1234567-1'; // Synthetic fixtures, never submitted to the public registry.
const company = () => ({ businessId: { value: id }, names: [
  { name: 'Previous Name Oy', type: '1', version: 2, endDate: '2025-01-01' },
  { name: 'Alternative', type: '2', version: 1 },
  { name: 'Metsäpolun Huolto Oy', type: '1', version: 1 }
], companyForms: [{ type: 'OY', version: 1 }], addresses: [{ type: 1, street: 'Testipolku', buildingNumber: '42',
  entrance: 'B', apartmentNumber: '7', postCode: '00100', postOffices: [{ city: 'Helsinki', languageCode: '1' }] }] });
const book = () => ({ documents: [], entity: { display_name: 'Owner’s trading name', business_profile: { operating_area: 'Finland' } } });

test('Books waits until the first capture to offer setup; Account details remain available immediately', () => {
  const target = book();
  assert.equal(setupSnapshot(target).suggestion_available, false);
  assert.equal(setupSnapshot(target).next_step, 'identify_business');
  target.documents.push({ id: 'receipt', capture_state: 'received' });
  assert.equal(setupSnapshot(target).suggestion_available, true);
  updateBusinessSetup(target, { type: 'defer' });
  assert.equal(setupSnapshot(target).suggestion_dismissed, true);
});

test('Business ID validation accepts canonical and unhyphenated forms, rejects invalid check digits', () => {
  assert.equal(businessId('12345671'), id);
  assert.equal(businessId(` ${id} `), id);
  for (const value of ['', null, {}, '1234567-2', '0000000-0', 'hello', '1234567-1extra']) assert.throws(() => businessId(value), { code: 'BUSINESS_ID_INVALID' });
});

test('PRH mapping uses the current legal name and preserves an exact identity without inventing operating area', () => {
  const value = registryIdentity(company(), id, '2026-09-05T00:00:00Z');
  assert.equal(value.legal_name, 'Metsäpolun Huolto Oy');
  assert.equal(value.legal_form, 'limited_company');
  assert.equal(value.registered_address, 'Testipolku 42 B 7, 00100, Helsinki');
  assert.equal(value.authority_verified, false);
  assert.equal('operating_area' in value, false);
  assert.equal(registryIdentity({ ...company(), endDate: '2025-01-01' }, id, ''), null);
  assert.equal(registryIdentity(company(), '7654321-2', ''), null);
});

test('lookup is exact, bounded, source-labelled and does not fall back to sample data', async () => {
  let calls = 0;
  const value = await lookupBusiness(id, { fetchImpl: async (url, options) => {
    calls++; assert.equal(new URL(url).searchParams.get('businessId'), id); assert.ok(options.signal);
    return { ok: true, json: async () => ({ companies: [company()] }) };
  } });
  assert.equal(calls, 1); assert.equal(value.source, 'prh_ytj');
  assert.equal(await lookupBusiness(id, { fetchImpl: async () => ({ ok: true, json: async () => ({ companies: [] }) }) }), null);
  await assert.rejects(lookupBusiness(id, { fetchImpl: async () => { throw new Error('offline'); } }), { code: 'REGISTRY_UNAVAILABLE' });
  await assert.rejects(lookupBusiness(id, { fetchImpl: async () => ({ ok: true, json: async () => ({ broken: true }) }) }), { code: 'REGISTRY_UNAVAILABLE' });
});

test('candidate lookup never persists an identity; explicit confirmation is entity scoped and cannot grant authority', () => {
  const target = book(); const before = setupSnapshot(target);
  const { candidate } = stageRegistryCandidate(target, registryIdentity(company(), id, '2026-09-05T00:00:00Z'));
  assert.deepEqual(setupSnapshot(target), before);
  assert.throws(() => updateBusinessSetup(book(), { type: 'confirm_registry', candidate_id: candidate.candidate_id }), { code: 'REGISTRY_CANDIDATE_EXPIRED' });
  const saved = updateBusinessSetup(target, { type: 'confirm_registry', candidate_id: candidate.candidate_id, authority_verified: true, legal_name: 'Injected name' });
  assert.equal(saved.identity.legal_name, 'Metsäpolun Huolto Oy');
  assert.equal(saved.identity.authority_verified, false);
  assert.equal(target.entity.display_name, 'Owner’s trading name');
  assert.equal(target.entity.business_profile.operating_area, 'Finland');
  assert.equal(saved.next_step, 'business_stage');
  target.registryCandidates.get(candidate.candidate_id).expires = 0;
  assert.throws(() => updateBusinessSetup(target, { type: 'confirm_registry', candidate_id: candidate.candidate_id }), { code: 'REGISTRY_CANDIDATE_EXPIRED' });
});

test('manual toiminimi path remains explicitly owner-supplied and does not enable tax actions', () => {
  const target = book();
  const saved = updateBusinessSetup(target, { type: 'confirm_manual', business_id: id, legal_name: 'Metsäpolun Huolto', legal_form: 'sole_trader', source: 'prh_ytj' });
  assert.equal(saved.identity.source, 'owner'); assert.equal(saved.identity.fetched_at, null);
  assert.equal(saved.capabilities.tax_preparation, 'not_configured');
  assert.equal(saved.capabilities.external_actions, 'not_authorized');
  assert.throws(() => updateBusinessSetup(target, { type: 'confirm_manual', business_id: '7654321-2', legal_name: 'Another company', legal_form: 'sole_trader' }), { code: 'BUSINESS_ID_LOCKED' });
});

test('next useful action adapts to business stage; Later is persistent and never blocks receipt capture', () => {
  const target = book();
  assert.equal(setupSnapshot(target).next_step, 'identify_business');
  updateBusinessSetup(target, { type: 'confirm_manual', business_id: id, legal_name: 'Metsäpolun Huolto', legal_form: 'sole_trader' });
  assert.equal(updateBusinessSetup(target, { type: 'set_stage', business_stage: 'new' }).next_step, 'first_receipt');
  assert.equal(updateBusinessSetup(target, { type: 'set_stage', business_stage: 'existing' }).next_step, 'prior_records');
  updateBusinessSetup(target, { type: 'defer' });
  assert.equal(setupSnapshot(target).suggestion_dismissed, true);
  assert.equal(setupSnapshot(target).capabilities.receipt_capture, 'available');
  target.documents.push({ id: 'waiting', purpose: 'prior_records', capture_state: 'received' });
  assert.equal(setupSnapshot(target).next_step, 'prior_records');
  target.documents.push({ id: 'stored', purpose: 'prior_records', capture_state: 'stored' });
  assert.equal(setupSnapshot(target).next_step, 'done');
  assert.equal(setupSnapshot(target).capabilities.tax_preparation, 'not_configured');
});
