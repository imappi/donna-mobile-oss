// Fixture data for the mock backend — the demo books.
//
// PROVENANCE RULE (README.md): every identity here is INVENTED and
// neutral. No real customers, no market-partner names, no identities from
// any other repo's demo data. "Fernwood" and friends exist
// only in this file.
//
// Dates are generated relative to "now" so the demo always looks alive.

const DAY = 24 * 60 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const daysAgo = (n) => new Date(Date.now() - n * DAY);
export const tsDaysAgo = (n) => daysAgo(n).toISOString();

/** Calendar-anchored history stays in prior months, even on the month's last day. */
export const monthDay = (offset, day, now = new Date()) => {
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0).getDate();
  return new Date(now.getFullYear(), now.getMonth() + offset, Math.min(day, last), 12);
};
const monthName = (date) => date.toLocaleDateString('en-GB', { month: 'long' });
const previousMonth = (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1);
const previousMonthName = (date) => monthName(previousMonth(date));
// Filenames carry their own date the way people name scans: "-04aug", "-aug".
// Always derived from the record's date, so a filename never disagrees with it.
const SHORT_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const mon = (date) => SHORT_MONTHS[date.getMonth()];
const dayMon = (date) => `${pad(date.getDate())}${mon(date)}`;

export const ENTITY = {
  id: 'ent-fernwood',
  display_name: 'Fernwood',
  currency: 'EUR',
  country: 'IE',
  entity_type: 'sole_trader'
};

export const PRINCIPAL = {
  id: 'owner-demo',
  display_name: 'Sam Field',
  email: 'demo@example.test'
};

// Sam's second, much quieter set of books — exists so the entity
// switcher has something real to switch to. Invented neutral identity,
// per the provenance rules.
export const ENTITY_2 = {
  id: 'ent-hazelmoor',
  display_name: 'Hazelmoor Lettings',
  currency: 'EUR',
  country: 'IE',
  entity_type: 'sole_trader'
};

export const DEMO_LOGIN = { email: 'demo@example.test', password: 'receipts' };

// Review-only Finland phone onboarding account. The visible flow uses a
// phone/code/name sequence; these credentials only cross the existing typed
// session seam so the preview lands in genuine, empty backend-owned books.
export const ONBOARDING_ENTITY = {
  id: 'ent-onboarding-preview',
  display_name: 'My business',
  currency: 'EUR',
  country: 'FI',
  entity_type: 'sole_trader'
};

export const ONBOARDING_PRINCIPAL = {
  id: 'owner-onboarding-preview',
  display_name: 'New owner',
  email: 'onboarding@preview.test'
};

export const ONBOARDING_LOGIN = {
  email: 'onboarding@preview.test',
  password: 'finland-preview'
};

export const buildOnboardingBook = () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    cards: [],
    documents: [],
    activity: [],
    chat: [],
    status: () => ({
      as_of: new Date().toISOString(),
      needs_you_count: 0,
      donna_working_count: 0,
      headline: null,
      periods: [
        {
          period_start: isoDate(monthStart),
          period_end: isoDate(monthEnd),
          label: monthStart.toLocaleDateString('en-FI', { month: 'long' }),
          state: 'ready',
          lifecycle: 'open',
          completion: { settled: 0, total: 0 },
          blockers: []
        }
      ]
    })
  };
};

const card = (partial) => ({
  entity_id: ENTITY.id,
  state: 'open',
  detail: null,
  occurred_on: null,
  amount: null,
  currency: null,
  counterparty: null,
  blocks_close: false,
  transaction_id: null,
  document_id: null,
  ...partial
});

// ── Queue cards: 6 asks + 4 approvals + 5 FYI receipts ─────────────────────
export const buildCards = () => [
  card({
    id: 'client_evidence_request:ask-cafe',
    class: 'ask',
    title: 'Was this Café Verano charge business or personal?',
    detail: 'Card payment · Café Verano',
    occurred_on: isoDate(daysAgo(3)),
    created_at: tsDaysAgo(2),
    amount: -84.0,
    currency: 'EUR',
    counterparty: 'Café Verano',
    blocks_close: true,
    transaction_id: 'tx-1041',
    document_id: 'doc-r22',
    source: { kind: 'client_evidence_request', id: 'ask-cafe' },
    ask: {
      question: 'Was the €84.00 at Café Verano a business meal or personal?',
      evidence_type: 'business_purpose',
      allows_text: true,
      allows_documents: false,
      choices: [
        { id: 'business_meal', label: 'Business meal' },
        { id: 'personal', label: 'Personal' }
      ],
      answered_text: null,
      answered_at: null
    }
  }),
  card({
    id: 'client_evidence_request:ask-fuel',
    class: 'ask',
    title: 'Was the Meadow Fuel Station fill-up for the van?',
    detail: 'Card payment · Meadow Fuel Station',
    occurred_on: isoDate(daysAgo(5)),
    created_at: tsDaysAgo(4),
    amount: -92.3,
    currency: 'EUR',
    counterparty: 'Meadow Fuel Station',
    blocks_close: true,
    transaction_id: 'tx-1038',
    source: { kind: 'client_evidence_request', id: 'ask-fuel' },
    ask: {
      question: 'Was the €92.30 at Meadow Fuel Station for the work van or a personal vehicle?',
      evidence_type: 'business_purpose',
      allows_text: true,
      allows_documents: false,
      choices: [
        { id: 'work_van', label: 'Work van' },
        { id: 'personal', label: 'Personal' }
      ],
      answered_text: null,
      answered_at: null
    }
  }),
  card({
    id: 'client_evidence_request:ask-fabrics',
    class: 'ask',
    title: 'Receipt missing for Atelier Fabrics',
    detail: 'Bank payment · Atelier Fabrics',
    occurred_on: isoDate(daysAgo(9)),
    created_at: tsDaysAgo(7),
    amount: -212.4,
    currency: 'EUR',
    counterparty: 'Atelier Fabrics',
    blocks_close: true,
    transaction_id: 'tx-1022',
    source: { kind: 'client_evidence_request', id: 'ask-fabrics' },
    ask: {
      question: 'Could you snap the receipt for €212.40 at Atelier Fabrics? A photo is perfect.',
      evidence_type: 'supporting_document',
      allows_text: true,
      allows_documents: true,
      choices: null,
      answered_text: null,
      answered_at: null
    }
  }),
  card({
    id: 'client_evidence_request:ask-insurance',
    class: 'ask',
    title: 'Which account paid the Northgate Insurance renewal?',
    detail: 'Northgate Insurance · annual renewal',
    occurred_on: isoDate(daysAgo(12)),
    created_at: tsDaysAgo(10),
    amount: -640.0,
    currency: 'EUR',
    counterparty: 'Northgate Insurance',
    source: { kind: 'client_evidence_request', id: 'ask-insurance' },
    ask: {
      question:
        'The Northgate Insurance renewal (€640.00) doesn’t show in the business account. Was it paid from another account?',
      evidence_type: 'bank_statement',
      allows_text: true,
      allows_documents: true,
      choices: null,
      answered_text: null,
      answered_at: null
    }
  }),
  card({
    id: 'client_evidence_request:ask-mobile',
    class: 'ask',
    title: 'Is the Loop Mobile plan fully business use?',
    detail: 'Direct debit · Loop Mobile',
    occurred_on: isoDate(daysAgo(6)),
    created_at: tsDaysAgo(5),
    amount: -45.0,
    currency: 'EUR',
    counterparty: 'Loop Mobile',
    transaction_id: 'tx-1033',
    source: { kind: 'client_evidence_request', id: 'ask-mobile' },
    ask: {
      question: 'Is the Loop Mobile €45.00/month plan used only for the business, or partly personal?',
      evidence_type: 'business_purpose',
      allows_text: true,
      allows_documents: false,
      choices: [
        { id: 'all_business', label: 'All business' },
        { id: 'mixed', label: 'Partly personal' }
      ],
      answered_text: null,
      answered_at: null
    }
  }),
  card({
    id: 'client_evidence_request:ask-inv2041',
    class: 'ask',
    blocks_close: true,
    title: 'How was invoice INV-2041 paid?',
    detail: 'Sales invoice · Kestrel Studio',
    occurred_on: isoDate(monthDay(-1, 18)),
    created_at: tsDaysAgo(8),
    amount: 980.0,
    currency: 'EUR',
    counterparty: 'Kestrel Studio',
    document_id: 'doc-inv-2041',
    source: { kind: 'client_evidence_request', id: 'ask-inv2041' },
    ask: {
      question:
        'Invoice INV-2041 to Kestrel Studio (€980.00) looks paid, but no bank line matches. How did the payment arrive?',
      evidence_type: 'payment_method',
      allows_text: true,
      allows_documents: true,
      choices: null,
      answered_text: null,
      answered_at: null
    }
  }),

  card({
    id: 'outbound_action:act-reminder-harbour',
    class: 'approval',
    title: 'Send a payment reminder to Harbour Joinery?',
    detail: 'INV-2038 · 18 days overdue',
    occurred_on: isoDate(daysAgo(18)),
    created_at: tsDaysAgo(1),
    amount: 1450.0,
    currency: 'EUR',
    counterparty: 'Harbour Joinery',
    source: { kind: 'outbound_action', id: 'act-reminder-harbour' },
    approval: {
      action_type: 'payment_reminder',
      description: 'A friendly first reminder for INV-2038 (€1,450.00), drafted and ready to send.',
      hold_reason: 'You approve outgoing payment reminders before they’re sent.',
      party_name: 'Harbour Joinery',
      batch_key: 'payment_reminder:first',
      decided_at: null
    }
  }),
  card({
    id: 'outbound_action:act-reminder-brightpost',
    class: 'approval',
    title: 'Send a payment reminder to Rowan & Chase?',
    detail: 'INV-2035 · 24 days overdue',
    occurred_on: isoDate(daysAgo(24)),
    created_at: tsDaysAgo(1),
    amount: 760.0,
    currency: 'EUR',
    counterparty: 'Rowan & Chase',
    source: { kind: 'outbound_action', id: 'act-reminder-brightpost' },
    approval: {
      action_type: 'payment_reminder',
      description: 'A friendly first reminder for INV-2035 (€760.00), drafted and ready to send.',
      hold_reason: 'You approve outgoing payment reminders before they’re sent.',
      party_name: 'Rowan & Chase',
      batch_key: 'payment_reminder:first',
      decided_at: null
    }
  }),
  card({
    id: 'outbound_action:act-issue-kestrel',
    class: 'approval',
    title: 'Issue the monthly invoice to Kestrel Studio?',
    detail: `Recurring · ${monthName(new Date())}`,
    occurred_on: isoDate(daysAgo(0)),
    created_at: tsDaysAgo(0),
    amount: 680.0,
    currency: 'EUR',
    counterparty: 'Kestrel Studio',
    source: { kind: 'outbound_action', id: 'act-issue-kestrel' },
    approval: {
      action_type: 'issue_invoice',
      description: 'The usual monthly retainer invoice for Kestrel Studio (€680.00), ready to issue.',
      hold_reason: 'New invoices go out only with your approval.',
      party_name: 'Kestrel Studio',
      batch_key: null,
      decided_at: null
    }
  }),
  card({
    id: 'authority_grant:grant-receipt-chase',
    class: 'approval',
    title: 'Let Donna chase missing receipts automatically?',
    detail: 'Standing authority',
    created_at: tsDaysAgo(2),
    source: { kind: 'authority_grant', id: 'grant-receipt-chase' },
    approval: {
      action_type: 'authority_grant',
      description:
        'Donna would send you a short receipt request the day a purchase shows up without one, instead of batching them at month end.',
      hold_reason: 'Standing authority needs your say-so once.',
      party_name: null,
      batch_key: null,
      decided_at: null
    }
  }),

  card({
    id: 'reconciliation_batch:fyi-july-recon',
    class: 'fyi',
    state: 'done',
    title: 'Reconciled 14 bank lines',
    detail: 'Matched to receipts and invoices on file',
    created_at: tsDaysAgo(1),
    source: { kind: 'reconciliation_batch', id: 'fyi-july-recon' },
    fyi: {
      description: '14 bank lines matched their receipts and invoices — nothing needed from you.',
      done_at: tsDaysAgo(1),
      corrective_verbs: ['veto_flag'],
      marked_wrong_at: null
    }
  }),
  card({
    id: 'outbound_action:fyi-cloudbill',
    class: 'fyi',
    state: 'done',
    title: 'Filed Cloudbill under software, as usual',
    detail: 'Monthly subscription · €29.00',
    created_at: tsDaysAgo(2),
    amount: -29.0,
    currency: 'EUR',
    counterparty: 'Cloudbill',
    document_id: 'doc-r06',
    occurred_on: isoDate(daysAgo(6)),
    source: { kind: 'outbound_action', id: 'fyi-cloudbill' },
    fyi: {
      description: 'The monthly Cloudbill charge (€29.00) went to software, same as every month.',
      done_at: tsDaysAgo(2),
      corrective_verbs: ['veto_flag'],
      marked_wrong_at: null
    }
  }),
  card({
    id: 'reconciliation_match:fyi-brightpost',
    class: 'fyi',
    state: 'done',
    title: 'Matched Brightpost Couriers to its receipt',
    detail: 'Card payment · €36.90',
    created_at: tsDaysAgo(3),
    amount: -36.9,
    currency: 'EUR',
    counterparty: 'Brightpost Couriers',
    document_id: 'doc-r03',
    occurred_on: isoDate(daysAgo(7)),
    source: { kind: 'reconciliation_match', id: 'fyi-brightpost' },
    fyi: {
      description: 'The €36.90 Brightpost Couriers charge matched the delivery receipt you sent.',
      done_at: tsDaysAgo(3),
      corrective_verbs: ['veto_flag'],
      marked_wrong_at: null
    }
  }),
  card({
    id: 'digest:fyi-july-summary',
    class: 'fyi',
    state: 'done',
    title: `Sent your ${previousMonthName(daysAgo(9))} summary`,
    created_at: tsDaysAgo(9),
    source: { kind: 'digest', id: 'fyi-july-summary' },
    fyi: {
      description: `Your ${previousMonthName(daysAgo(9))} books summary was sent by email.`,
      done_at: tsDaysAgo(9),
      corrective_verbs: ['veto_flag'],
      marked_wrong_at: null
    }
  }),
  card({
    id: 'outbound_action:fyi-parking',
    class: 'fyi',
    state: 'done',
    title: 'Filed Quayside Parking under travel',
    detail: 'Card payment · €4.50',
    created_at: tsDaysAgo(4),
    amount: -4.5,
    currency: 'EUR',
    counterparty: 'Quayside Parking',
    document_id: 'doc-r14',
    occurred_on: isoDate(daysAgo(5)),
    source: { kind: 'outbound_action', id: 'fyi-parking' },
    fyi: {
      description: 'The €4.50 Quayside Parking charge went to travel — a regular spot for you.',
      done_at: tsDaysAgo(4),
      corrective_verbs: ['veto_flag'],
      marked_wrong_at: null
    }
  })
];

// ── Documents: ~30 in mixed states ─────────────────────────────────────────
const doc = (partial) => ({
  entity_id: ENTITY.id,
  captured_at: null,
  document_type: null,
  document_date: null,
  total_amount: null,
  currency: null,
  counterparty: null,
  needs_info_card_id: null,
  failure_message: null,
  duplicate_of: null,
  ...partial
});

export const buildDocuments = () => {
  const attached = [
    ['doc-r01', (d) => `receipt-harbour-timber-${dayMon(d)}.jpg`, 'receipt', 8, 'Harbour Timber Supplies', -486.2],
    ['doc-r02', (d) => `receipt-atelier-fabrics-${dayMon(d)}.jpg`, 'receipt', 10, 'Atelier Fabrics', -158.0],
    ['doc-r03', (d) => `receipt-brightpost-${dayMon(d)}.jpg`, 'receipt', 6, 'Brightpost Couriers', -36.9],
    ['doc-r04', (d) => `fuel-meadow-${dayMon(d)}.jpg`, 'receipt', 13, 'Meadow Fuel Station', -88.1],
    ['doc-r05', (d) => `receipt-cafe-verano-${dayMon(d)}.jpg`, 'receipt', 15, 'Café Verano', -42.5],
    ['doc-r06', (d) => `cloudbill-invoice-${mon(d)}.pdf`, 'supplier_bill', 5, 'Cloudbill', -29.0],
    ['doc-r07', (d) => `loop-mobile-${mon(d)}.pdf`, 'supplier_bill', 5, 'Loop Mobile', -45.0],
    ['doc-r08', (d) => `greenlane-electric-${mon(d)}.pdf`, 'supplier_bill', 19, 'Greenlane Electric', -164.7],
    ['doc-r09', 'northgate-policy-2026.pdf', 'contract', 12, 'Northgate Insurance', -640.0],
    ['doc-r10', 'inv-2036-rowan-chase.pdf', 'sales_invoice', 30, 'Rowan & Chase', 540.0],
    ['doc-r11', 'inv-2037-kestrel-studio.pdf', 'sales_invoice', 27, 'Kestrel Studio', 680.0],
    ['doc-r12', 'inv-2038-harbour-joinery.pdf', 'sales_invoice', 18, 'Harbour Joinery', 1450.0],
    // A statement is named for the month it covers: the one before it was issued.
    ['doc-r13', (d) => `bank-statement-${mon(previousMonth(d))}.pdf`, 'bank_statement', 16, null, null],
    ['doc-r14', (d) => `receipt-quayside-${dayMon(d)}.jpg`, 'receipt', 4, 'Quayside Parking', -4.5],
    ['doc-r15', (d) => `receipt-harbour-timber-${dayMon(d)}.jpg`, 'receipt', 7, 'Harbour Timber Supplies', -102.6],
    ['doc-r16', 'foam-supplier-quote.pdf', 'contract', 22, 'Bram Foam Works', null],
    ['doc-r17', (d) => `receipt-workshop-tools-${dayMon(d)}.jpg`, 'receipt', 11, 'Toolhouse', -74.9],
    ['doc-r18', 'inv-2039-atelier-north.pdf', 'sales_invoice', 14, 'Atelier North', 320.0],
    ['doc-r19', (d) => `receipt-fabric-dye-${dayMon(d)}.jpg`, 'receipt', 17, 'Atelier Fabrics', -63.2],
    ['doc-r20', (d) => `bank-statement-${mon(previousMonth(d))}.pdf`, 'bank_statement', 46, null, null],
    ['doc-r21', 'inv-2040-harbour-joinery.pdf', 'sales_invoice', 9, 'Harbour Joinery', 890.0],
    ['doc-r22', (d) => `receipt-cafe-verano-${dayMon(d)}.jpg`, 'receipt', 3, 'Café Verano', -84.0]
  ].map(([id, filename, type, age, party, amount]) => {
    const date = daysAgo(id === 'doc-r22' ? age : age + 1);
    return doc({
      id,
      filename: typeof filename === 'function' ? filename(date) : filename,
      capture_state: 'attached',
      uploaded_at: tsDaysAgo(age),
      captured_at: tsDaysAgo(age),
      document_type: type,
      document_date: isoDate(date),
      total_amount: amount,
      currency: amount != null ? 'EUR' : null,
      counterparty: party
    });
  });
  const cafeVerano = attached.find((d) => d.id === 'doc-r22');

  const inFlight = [
    doc({
      id: 'doc-p01',
      filename: 'receipt-timber-today.jpg',
      capture_state: 'processing',
      uploaded_at: tsDaysAgo(0),
      captured_at: tsDaysAgo(0),
      document_type: null
    }),
    doc({
      id: 'doc-p02',
      filename: `bank-statement-${mon(daysAgo(0))}-partial.pdf`,
      capture_state: 'processing',
      uploaded_at: tsDaysAgo(0),
      document_type: 'bank_statement'
    }),
    doc({
      id: 'doc-p03',
      filename: 'receipt-glue-supplies.jpg',
      capture_state: 'received',
      uploaded_at: tsDaysAgo(0)
    }),
    doc({
      id: 'doc-inv-2041',
      filename: 'inv-2041-kestrel-studio.pdf',
      capture_state: 'needs_info',
      uploaded_at: tsDaysAgo(15),
      document_type: 'sales_invoice',
      document_date: isoDate(monthDay(-1, 18)),
      total_amount: 980.0,
      currency: 'EUR',
      counterparty: 'Kestrel Studio',
      needs_info_card_id: 'client_evidence_request:ask-inv2041'
    }),
    doc({
      id: 'doc-n02',
      filename: `receipt-blurry-${dayMon(daysAgo(13))}.jpg`,
      capture_state: 'needs_info',
      uploaded_at: tsDaysAgo(13),
      document_type: 'receipt',
      needs_info_card_id: null
    }),
    doc({
      id: 'doc-f01',
      filename: 'scan-crumpled-receipt.jpg',
      capture_state: 'failed',
      uploaded_at: tsDaysAgo(2),
      document_type: null,
      failure_message: 'This photo was too blurry to read. A flatter, closer shot usually works.'
    }),
    doc({
      id: 'doc-f02',
      filename: 'statement-password.pdf',
      capture_state: 'failed',
      uploaded_at: tsDaysAgo(6),
      document_type: null,
      failure_message: 'This PDF is password-protected, so it can’t be opened.'
    }),
    doc({
      id: 'doc-d01',
      filename: cafeVerano.filename.replace(/\.jpg$/, '-2.jpg'),
      capture_state: 'duplicate',
      uploaded_at: tsDaysAgo(1),
      document_type: 'receipt',
      duplicate_of: 'doc-r22'
    })
  ];

  const history = [-1, -2].flatMap(offset => [
    ['cloudbill', 'supplier_bill', 6, 'Cloudbill', -29],
    ['timber', 'receipt', 14, 'Harbour Timber Supplies', -186.4],
    ['courier', 'receipt', 22, 'Brightpost Couriers', -52.8]
  ].map(([key, type, day, party, amount]) => {
    const date = monthDay(offset, day);
    return doc({ id: `doc-history-${-offset}-${key}`, filename: `${key}-${isoDate(date)}.pdf`,
      capture_state: 'attached', document_type: type, document_date: isoDate(date),
      uploaded_at: date.toISOString(), captured_at: date.toISOString(),
      counterparty: party, total_amount: amount, currency: 'EUR' });
  }));
  return [...inFlight, ...attached, ...history];
};

// ── Close status ───────────────────────────────────────────────────────────
export const buildStatus = (needsYouCount, cards = buildCards()) => {
  const now = new Date();
  const monthStart = (offset) => new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const monthEnd = (offset) => new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const monthLabel = (d) => d.toLocaleDateString('en-IE', { month: 'long' });
  const blockersIn = (offset) => cards.filter(card => card.state === 'open' && card.blocks_close &&
    (card.class === 'ask' || card.class === 'approval') &&
    (card.occurred_on || card.created_at).slice(0, 7) === isoDate(monthStart(offset)).slice(0, 7));
  const ownerBlockers = (offset) => blockersIn(offset).length ? [{
    code: 'client_evidence', label: 'A receipt or quick answer is still needed from you',
    on: 'you', count: blockersIn(offset).length, card_ids: blockersIn(offset).map(card => card.id)
  }] : [];
  return {
    as_of: new Date().toISOString(),
    needs_you_count: needsYouCount,
    donna_working_count: 6,
    headline: null, // computed live by the server from the counts
    periods: [
      {
        period_start: isoDate(monthStart(0)),
        period_end: isoDate(monthEnd(0)),
        label: monthLabel(monthStart(0)),
        state: 'blocked',
        lifecycle: 'open',
        completion: { settled: 41, total: 58 },
        blockers: [
          ...ownerBlockers(0),
          {
            code: 'posting_completeness',
            label: 'Donna is matching the latest bank lines',
            on: 'donna',
            count: 6,
            card_ids: null
          }
        ]
      },
      {
        period_start: isoDate(monthStart(-1)),
        period_end: isoDate(monthEnd(-1)),
        label: monthLabel(monthStart(-1)),
        state: blockersIn(-1).length ? 'blocked' : 'ready',
        lifecycle: 'reviewing',
        completion: { settled: 132 - blockersIn(-1).length, total: 132 },
        blockers: ownerBlockers(-1)
      },
      {
        period_start: isoDate(monthStart(-2)),
        period_end: isoDate(monthEnd(-2)),
        label: monthLabel(monthStart(-2)),
        state: 'ready',
        lifecycle: 'locked',
        completion: { settled: 117, total: 117 },
        blockers: []
      }
    ]
  };
};

// ── The second book (Hazelmoor Lettings) ───────────────────────────────────
// A near-quiet book: one question open, one decide-and-notify receipt,
// two documents. Switching to it should FEEL like a different, calmer
// business — that contrast is the demo.
export const buildSecondBook = () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthLabel = monthStart.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' });
  const cards = [
    card({
      entity_id: ENTITY_2.id,
      id: 'client_evidence_request:ask-glenview',
      class: 'ask',
      title: 'Was the Glenview Hardware purchase for the cottage?',
      detail: 'Card payment · Glenview Hardware',
      occurred_on: isoDate(daysAgo(6)),
      created_at: tsDaysAgo(5),
      amount: -137.4,
      currency: 'EUR',
      counterparty: 'Glenview Hardware',
      blocks_close: true,
      transaction_id: 'tx-h204',
      source: { kind: 'client_evidence_request', id: 'ask-glenview' },
      ask: {
        question: 'Was the €137.40 at Glenview Hardware for Rowanberry Cottage repairs or personal?',
        evidence_type: 'business_purpose',
        allows_text: true,
        allows_documents: true,
        choices: [
          { id: 'cottage_repairs', label: 'Cottage repairs' },
          { id: 'personal', label: 'Personal' }
        ],
        answered_text: null,
        answered_at: null
      }
    }),
    card({
      entity_id: ENTITY_2.id,
      id: 'outbound_action:fyi-rent-aug',
      class: 'fyi',
      state: 'done',
      title: 'Rent invoice issued',
      detail: `Rowanberry Cottage · ${monthName(daysAgo(3))}`,
      document_id: 'doc-h01',
      occurred_on: isoDate(daysAgo(3)),
      created_at: tsDaysAgo(3),
      amount: 1150.0,
      currency: 'EUR',
      counterparty: 'Rowanberry Cottage tenancy',
      source: { kind: 'outbound_action', id: 'fyi-rent-aug' },
      fyi: {
        description: `${monthName(daysAgo(3))} rent invoiced under your standing instruction, on the same terms as last month.`,
        done_at: tsDaysAgo(3),
        corrective_verbs: ['veto_flag'],
        marked_wrong_at: null
      }
    })
  ];
  const documents = [
    doc({
      entity_id: ENTITY_2.id,
      id: 'doc-h01',
      filename: `rent-invoice-rowanberry-${mon(daysAgo(3))}.pdf`,
      capture_state: 'attached',
      uploaded_at: tsDaysAgo(3),
      captured_at: tsDaysAgo(3),
      document_type: 'sales_invoice',
      document_date: isoDate(daysAgo(3)),
      total_amount: 1150.0,
      currency: 'EUR',
      counterparty: 'Rowanberry Cottage tenancy'
    }),
    doc({
      entity_id: ENTITY_2.id,
      id: 'doc-h02',
      filename: `boiler-service-${mon(daysAgo(25))}.pdf`,
      capture_state: 'attached',
      uploaded_at: tsDaysAgo(24),
      captured_at: tsDaysAgo(24),
      document_type: 'receipt',
      document_date: isoDate(daysAgo(25)),
      total_amount: -180.0,
      currency: 'EUR',
      counterparty: 'Bracken Heating'
    })
  ];
  const activity = [
    {
      id: 'ev-h01',
      at: tsDaysAgo(3),
      kind: 'card_resolved',
      title: `${monthName(daysAgo(3))} rent invoiced`,
      body: 'Rowanberry Cottage · €1,150.00, under your standing instruction.',
      deep_link: { screen: 'queue', card_id: 'outbound_action:fyi-rent-aug', document_id: null }
    },
    {
      id: 'ev-h02',
      at: tsDaysAgo(5),
      kind: 'card_created',
      title: '1 question about a Glenview Hardware purchase',
      body: null,
      deep_link: { screen: 'queue', card_id: 'client_evidence_request:ask-glenview', document_id: null }
    }
  ];
  const status = (needsYouCount) => ({
    as_of: new Date().toISOString(),
    needs_you_count: needsYouCount,
    donna_working_count: 1,
    headline: null, // computed live by the server from the counts
    periods: [
      {
        period_start: isoDate(monthStart),
        period_end: isoDate(monthEnd),
        label: monthLabel,
        state: needsYouCount > 0 ? 'blocked' : 'ready',
        lifecycle: 'open',
        completion: { settled: 11, total: 12 },
        blockers:
          needsYouCount > 0
            ? [
                {
                  code: 'client_evidence',
                  label: 'One purchase needs a quick answer from you',
                  on: 'you',
                  count: 1,
                  card_ids: ['client_evidence_request:ask-glenview']
                }
              ]
            : []
      }
    ]
  });
  const chatWelcome =
    'Hi Sam. Hazelmoor is quiet — the rent invoice went out under your standing instruction, and one Glenview Hardware purchase needs a quick answer when you have a second.';
  return { cards, documents, activity, status, chatWelcome };
};

// ── Activity ───────────────────────────────────────────────────────────────
export const buildActivity = (documents = buildDocuments()) => [
  {
    id: 'ev-001',
    at: tsDaysAgo(0),
    kind: 'card_created',
    title: '2 reminders are ready for your approval',
    body: 'Harbour Joinery and Rowan & Chase are overdue.',
    deep_link: { screen: 'queue', card_id: 'outbound_action:act-reminder-harbour', document_id: null }
  },
  {
    id: 'ev-002',
    at: tsDaysAgo(1),
    kind: 'card_resolved',
    title: 'Reconciled 14 bank lines',
    body: null,
    deep_link: { screen: 'queue', card_id: 'reconciliation_batch:fyi-july-recon', document_id: null }
  },
  {
    id: 'ev-003',
    at: tsDaysAgo(2),
    kind: 'document_attached',
    title: `${documents.find((d) => d.id === 'doc-r14').filename} is in your books`,
    body: null,
    deep_link: { screen: 'capture', card_id: null, document_id: 'doc-r14' }
  },
  {
    id: 'ev-004',
    at: tsDaysAgo(4),
    kind: 'period_update',
    title: `${previousMonthName(daysAgo(4))} is ready to close`,
    body: 'Everything reconciled. Donna will close it on the 5th unless you say otherwise.',
    deep_link: { screen: 'status', card_id: null, document_id: null }
  },
  {
    id: 'ev-005',
    at: tsDaysAgo(9),
    kind: 'digest',
    title: `Your ${previousMonthName(daysAgo(9))} summary`,
    body: 'Income €4,980 · Spending €2,210 · 3 questions answered.',
    deep_link: { screen: 'status', card_id: null, document_id: null }
  }
];

// ── Chat ───────────────────────────────────────────────────────────────────
export const buildChat = () => {
  const welcomeAt = new Date(Date.now() - 3600e3);
  return [
    {
      id: 'msg-welcome',
      author: 'donna',
      text: `Morning Sam. ${monthName(welcomeAt)} is moving along — three purchases need a receipt or a quick fact from you. Everything else is in my hands.`,
      at: welcomeAt.toISOString()
    },
    {
      id: 'msg-owner-vat',
      author: 'owner',
      text: 'Do I owe VAT on the fabric order?',
      at: new Date(Date.now() - 1800e3).toISOString()
    },
    {
      id: 'msg-donna-vat',
      author: 'donna',
      text: 'The standard rate applies unless the receipt says otherwise. Send it here and I’ll check the source before I post anything.',
      at: new Date(Date.now() - 1200e3).toISOString()
    }
  ];
};
