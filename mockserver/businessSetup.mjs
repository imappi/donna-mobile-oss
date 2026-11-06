import crypto from 'node:crypto';

// Public registry only. No tax account, identity verification or permission to act.
export const PRH_COMPANIES_URL = 'https://avoindata.prh.fi/opendata-ytj-api/v3/companies';
export class SetupError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
export const businessId = (input) => {
  const value = typeof input === 'string' ? input.trim().replace(/^(\d{7})(\d)$/, '$1-$2') : '';
  if (!/^\d{7}-\d$/.test(value) || value.startsWith('0000000')) throw new SetupError('BUSINESS_ID_INVALID');
  const remainder = [...value.slice(0, 7)].reduce((sum, digit, i) => sum + Number(digit) * [7, 9, 10, 5, 8, 4, 2][i], 0) % 11;
  if (remainder === 1 || Number(value[8]) !== (remainder === 0 ? 0 : 11 - remainder)) throw new SetupError('BUSINESS_ID_INVALID');
  return value;
};
const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const current = (items = []) => items.find(item => item.version === 1 && !item.endDate);

export const registryIdentity = (company, id, fetchedAt) => {
  if (company?.businessId?.value !== id || company.endDate) return null;
  const name = (company.names ?? []).find(item => item.type === '1' && item.version === 1 && !item.endDate);
  const form = current(company.companyForms);
  if (typeof name?.name !== 'string' || !name.name.trim() || name.name.length > 1000 || !form?.type) return null;
  const address = company.addresses?.find(item => item.type === 1) ?? company.addresses?.find(item => item.type === 2);
  const city = address?.postOffices?.find(item => item.languageCode === '1')?.city ?? address?.postOffices?.[0]?.city ?? '';
  // Postal locality is NOT a service area or the legal municipality of domicile.
  const street = address?.street ? [address.co, address.street, address.buildingNumber, address.entrance,
    [address.apartmentNumber, address.apartmentIdSuffix].filter(Boolean).join('')].filter(Boolean).join(' ') : '';
  return { business_id: id, legal_name: text(name.name, 1000), legal_form: form.type === 'OY' ? 'limited_company' : 'other',
    legal_form_code: text(form.type, 8), registered_address: text([street, address?.postCode, city].filter(Boolean).join(', '), 1000),
    source: 'prh_ytj', fetched_at: fetchedAt, authority_verified: false };
};

export const lookupBusiness = async (input, { fetchImpl = fetch, now = () => new Date().toISOString() } = {}) => {
  const id = businessId(input);
  try {
    const response = await fetchImpl(`${PRH_COMPANIES_URL}?businessId=${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000), redirect: 'error'
    });
    if (!response.ok) throw new Error('Registry unavailable');
    const data = await response.json();
    if (!Array.isArray(data.companies)) throw new Error('Invalid registry response');
    const matches = data.companies.filter(company => company?.businessId?.value === id);
    return matches.length === 1 ? registryIdentity(matches[0], id, now()) : null;
  } catch { throw new SetupError('REGISTRY_UNAVAILABLE', 503); }
};

const initial = () => ({ identity: null, business_stage: null, suggestion_dismissed: false });
export const setupSnapshot = (book) => {
  const setup = book.businessSetup ?? initial();
  const prior = book.documents.filter(doc => doc.purpose === 'prior_records' && doc.capture_state === 'stored').map(doc => doc.id);
  const next = !setup.identity ? 'identify_business' : !setup.business_stage ? 'business_stage'
    : setup.business_stage === 'existing' ? (prior.length ? 'done' : 'prior_records')
      : book.documents.some(doc => doc.purpose !== 'prior_records') ? 'done' : 'first_receipt';
  return { ...setup, suggestion_available: book.documents.length > 0, prior_record_ids: prior, next_step: next,
    capabilities: { receipt_capture: 'available', tax_preparation: 'not_configured', external_actions: 'not_authorized' } };
};

export const stageRegistryCandidate = (book, identity) => {
  if (!identity) return { candidate: null };
  book.registryCandidates ??= new Map();
  for (const [id, candidate] of book.registryCandidates) if (candidate.expires < Date.now()) book.registryCandidates.delete(id);
  if (book.registryCandidates.size >= 20) book.registryCandidates.delete(book.registryCandidates.keys().next().value);
  const candidateId = crypto.randomUUID();
  book.registryCandidates.set(candidateId, { identity, expires: Date.now() + 15 * 60 * 1000 });
  return { candidate: { candidate_id: candidateId, ...identity } };
};

export const updateBusinessSetup = (book, action) => {
  const previous = book.businessSetup ?? initial();
  let next;
  switch (action?.type) {
    case 'confirm_registry': {
      const candidate = book.registryCandidates?.get(action.candidate_id);
      if (!candidate || candidate.expires < Date.now()) throw new SetupError('REGISTRY_CANDIDATE_EXPIRED', 409);
      if (previous.identity && previous.identity.business_id !== candidate.identity.business_id) throw new SetupError('BUSINESS_ID_LOCKED', 409);
      next = { ...previous, identity: candidate.identity, suggestion_dismissed: false };
      break;
    }
    case 'confirm_manual': {
      const id = businessId(action.business_id);
      if (previous.identity && previous.identity.business_id !== id) throw new SetupError('BUSINESS_ID_LOCKED', 409);
      if (!['sole_trader', 'limited_company', 'other'].includes(action.legal_form) || typeof action.legal_name !== 'string' || !action.legal_name.trim() || action.legal_name.length > 1000) throw new SetupError('BUSINESS_DETAILS_INVALID');
      next = { ...previous, suggestion_dismissed: false, identity: { business_id: id, legal_name: action.legal_name.trim(),
        legal_form: action.legal_form, legal_form_code: null, registered_address: '', source: 'owner', fetched_at: null, authority_verified: false } };
      break;
    }
    case 'set_stage':
      if (!['new', 'existing'].includes(action.business_stage)) throw new SetupError('BUSINESS_STAGE_INVALID');
      next = { ...previous, business_stage: action.business_stage, suggestion_dismissed: false };
      break;
    case 'defer': next = { ...previous, suggestion_dismissed: true }; break;
    default: throw new SetupError('SETUP_ACTION_INVALID');
  }
  // The accepted legal identity is stored separately; never overwrite the spoken
  // service description, trading/display name, service area or owner name.
  book.businessSetup = next;
  return setupSnapshot(book);
};
