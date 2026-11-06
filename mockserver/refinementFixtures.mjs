// Opt-in, synthetic read models for the September mobile design handoff.
// No calculation here is an accounting result, and no action contacts an external service.
import { demoCopy as c } from './finnishFixtures.mjs';

const invoiceId = 'outbound_action:act-issue-kestrel';
const cafeId = 'client_evidence_request:ask-cafe';
const receiptId = 'doc-r01';
const iso = () => new Date().toISOString();
const money = value => new Intl.NumberFormat(process.env.DEMO_LOCALE === 'fi' ? 'fi-FI' : 'en-GB',
  { style: 'currency', currency: 'EUR' }).format(value).replace('-', '−');
export const reviewPeriod = (offset = -1) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toISOString().slice(0, 7);
};
const monthName = period => {
  const [year, month] = period.split('-').map(Number);
  const text = new Intl.DateTimeFormat(process.env.DEMO_LOCALE === 'fi' ? 'fi-FI' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)));
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
};
const msg = (id, author, text, extra = {}) => ({ id, author, text, at: iso(), ...extra });
const figures = () => [
  { label: c('VAT on sales', 'Myynnin ALV'), value: money(2340) },
  { label: c('Deductible VAT', 'Vähennettävä ALV'), value: money(-853.8) },
  { label: c('Payable', 'Maksettavaa'), value: money(1486.2), emphasized: true }
];

export function enrichRefinementBook(book) {
  book.refinementSample = true;
  for (const card of book.cards) {
    card.context_label = card.counterparty ?? ({
      'reconciliation_batch:fyi-july-recon': c('Bank transactions', 'Tilitapahtumat'),
      'digest:fyi-july-summary': c('Month summary', 'Kuukausiyhteenveto'),
      'authority_grant:grant-receipt-chase': c('Missing receipts', 'Puuttuvat kuitit')
    })[card.id] ?? card.title;
  }
  for (const doc of book.documents) {
    doc.context_label = doc.counterparty ?? (doc.document_type === 'bank_statement' ? c('Business account', 'Yritystili') : ({
      'doc-p01': c('Timber', 'Puutavara'), 'doc-p03': c('Adhesives', 'Liimatarvikkeet'),
      'doc-f01': c('Unreadable photo', 'Epäselvä kuva'), 'doc-f02': c('Protected PDF', 'Suojattu PDF'),
      'doc-n01': c('Receipt details', 'Kuitin tiedot')
    })[doc.id]);
  }
  const invoice = book.cards.find(card => card.id === invoiceId);
  invoice.presentation = {
    title: c('Monthly invoice to Kestrel Studio', 'Kuukausilasku Kestrel Studiolle'),
    description: c('The usual monthly invoice is ready. Shall I send it?', 'Tavallinen kuukausilasku on valmis. Lähetänkö sen?'),
    invoice: { number: 'INV-2042', due_on: reviewPeriod(0) + '-20', currency: 'EUR', total: 680,
      lines: [{ label: c('Monthly work', 'Kuukausityö'), amount: 560 }, { label: c('Materials', 'Tarvikkeet'), amount: 120 }] }
  };
  book.artifactThreads.set('queue_card:' + invoiceId, [
    msg('refine-invoice-1', 'donna', c('I’ll send it as soon as you approve. This only changes the sample books.', 'Lähetän sen heti kun hyväksyt. Tämä muuttaa vain esimerkkikirjoja.'))
  ]);
  book.cards.find(card => card.id === cafeId).presentation = {
    title: c('Was this lunch business?', 'Oliko tämä lounas työasiaa?'),
    description: c('Café Verano. Who was the meal for? Your answer helps classify this sample receipt.', 'Café Verano. Kenelle lounas oli? Vastauksesi auttaa luokittelemaan tämän esimerkkikuitin.'),
    evidence: { document_id: 'doc-r22', label: c('Receipt photo · Café Verano', 'Kuitin kuva · Café Verano') }
  };
  book.cards.find(card => card.id === cafeId).ask.choices = [
    { id: 'business_meal', label: c('Client lunch', 'Asiakaslounas') },
    { id: 'personal', label: c('Personal', 'Oma lounas') },
    { id: 'staff', label: c('Staff', 'Henkilöstö') }
  ];
  book.cards.find(card => card.id === cafeId).ask.allows_text = false;
  const reading = book.documents.find(doc => doc.id === 'doc-p01');
  reading.presentation = { title: c('Timber receipt', 'Puutavaran kuitti'),
    description: c('Reading the receipt. I’ll ask if anything is unclear.', 'Luen kuittia. Kerron, jos jokin jää epäselväksi.'),
    evidence: { document_id: reading.id, label: c('Receipt photo', 'Kuitin kuva') } };
  book.artifactThreads.set('queue_card:' + cafeId, []);
  const document = book.documents.find(doc => doc.id === receiptId);
  document.presentation = { title: c('Harbour Timber Supplies receipt', 'Harbour Timber Suppliesin kuitti'),
    description: c('Recorded as materials and matched to the bank transaction.', 'Kirjattu tarvikkeisiin ja täsmäytetty tilitapahtumaan.'),
    evidence: { document_id: document.id, label: c('Receipt · original document', 'Kuitti · alkuperäinen asiakirja') } };
  book.artifactThreads.set('document:' + receiptId, [
    msg('refine-receipt-1', 'donna', c('This receipt is in your books. You can ask about it or add context here.', 'Tämä kuitti on kirjanpidossasi. Voit kysyä siitä tai lisätä tietoja tähän.'))
  ]);
  book.artifactReceipts.set('document:' + receiptId, [{ summary: c('Receipt recorded and matched', 'Kuitti kirjattu ja täsmäytetty'),
    at: document.uploaded_at, changes: [{ target: document.id, applied: true, error: null }], audit_event_ids: ['sample-receipt-recorded'], actor: { type: 'donna', terminal: 'backend' } }]);
  const action = { id: 'refine-approve-invoice', kind: 'approve_card', label: c('Send invoice', 'Lähetä lasku'), state: 'available',
    summary: null, applied_at: null };
  book.chatActions.set(action.id, { kind: 'approve_card', card_id: invoiceId });
  book.chat = [
    msg('refine-chat-1', 'owner', c('How much VAT for last month?', 'Paljonko ALV:tä viime kuulta?')),
    msg('refine-chat-2', 'donna', c('In these sample books the estimate is €1,486.20. These are fictional preview figures, not a tax calculation. Nothing is filed or paid.', 'Näissä esimerkkikirjoissa arvio on 1 486,20 €. Luvut ovat kuvitteellisia esimerkkitietoja, eivät verolaskelma. Mitään ei ilmoiteta tai makseta.'), { figures: figures() }),
    msg('refine-chat-3', 'donna', c('Kestrel Studio’s monthly invoice (€680) is ready but unsent. Try approving it in these sample books?', 'Kestrel Studion kuukausilasku (680,00 €) on valmis mutta lähettämättä. Kokeillaanko hyväksyntää esimerkkikirjoissa?'), { actions: [action] }),
    msg('refine-chat-4', 'owner', '', { attachment: { document_id: document.id, label: c('Photo · Harbour Timber', 'Kuva · Harbour Timber') } }),
    msg('refine-chat-5', 'donna', c('This sample receipt is matched to its bank transaction. Its original stays with the item.', 'Tämä esimerkkikuitti on täsmäytetty tilitapahtumaan. Alkuperäinen pysyy tapahtuman mukana.')),
    msg('refine-chat-6', 'owner', c('Can I add the job this belongs to?', 'Voinko lisätä tähän liittyvän työmaan?')),
    msg('refine-chat-7', 'donna', c('Yes—add the job details in the receipt’s conversation. A comment alone does not change its bookkeeping.', 'Kyllä — lisää työmaan tiedot kuitin keskusteluun. Pelkkä kommentti ei muuta kirjausta.'))
  ];
}

export function refinementStatus(book, status) {
  status.review_navigation = true;
  status.headline = status.needs_you_count
    ? c(`${status.needs_you_count} things need you. The rest is in Donna’s hands.`, `${status.needs_you_count} asiaa odottaa sinua. Loput ovat Donnan käsissä.`)
    : c('Nothing needs you right now. Donna is working in the background.', 'Mikään ei odota sinua juuri nyt. Donna työskentelee taustalla.');
  status.periods = status.periods.map(period => ({
    ...period,
    blockers: [
      ...book.cards.filter(card => card.state === 'open' && (card.class === 'ask' || card.class === 'approval') &&
        (card.occurred_on || card.created_at).slice(0, 7) === period.period_start.slice(0, 7))
        .map(card => ({ code: card.id, label: card.title, on: 'you', count: 1, card_ids: [card.id] })),
      ...period.blockers.filter(blocker => blocker.on === 'donna').map(blocker => ({ ...blocker,
        label: c('Matching the latest bank transactions', 'Uusimpia tilitapahtumia täsmäytetään') }))
    ]
  }));
  return status;
}

export function buildFinancialReview(book, kind, period = reviewPeriod()) {
  const base = { kind, source: 'not_configured', title: c(kind === 'taxes' ? 'Taxes' : 'Month', kind === 'taxes' ? 'Verot' : 'Kuukausi'),
    headline: '', footnote: '', blocks: [], as_of: iso() };
  // No invented report is returned for an arbitrary date or a real onboarding book.
  if (!book.refinementSample || ![reviewPeriod(), reviewPeriod(0), reviewPeriod(-2)].includes(period)) return base;
  base.source = 'sample';
  base.footnote = c('Fictional preview figures only. Donna does not file returns, pay taxes or send messages outside these sample books.',
    'Vain kuvitteellisia esimerkkitietoja. Donna ei lähetä ilmoituksia, maksa veroja tai lähetä viestejä esimerkkikirjojen ulkopuolelle.');
  const ask = { kind: 'chat', label: c('Ask Donna', 'Kysy Donnalta') };
  const month = monthName(period);
  if (kind === 'taxes') {
    base.headline = c('A calm overview of taxes and the details still needed. No external action is enabled.', 'Verot ja vielä tarvittavat tiedot yhdessä näkymässä. Ulkoiset toiminnot eivät ole käytössä.');
    base.blocks = [
      { id: 'vat', title: 'ALV · ' + month, subtitle: c('Sample period · not a filing', 'Esimerkkikausi · ei veroilmoitus'), pill: c('Preparing', 'Kootaan'), tone: 'quiet',
        figure: money(1486.2), figure_label: c('Payable, sample estimate', 'Maksettavaa, esimerkkiarvio'),
        rows: [{ label: c('VAT on sales', 'Myynnin ALV'), value: money(2340) },
          { label: c('Deductible VAT', 'Vähennettävä ALV'), value: money(-853.8) },
          { label: c('3 receipts unread — estimate may change', '3 kuittia lukematta — arvio voi muuttua'), value: '', owner: 'you' }] },
      { id: 'previous-vat', title: c('Previous VAT period', 'Edellinen ALV-kausi'), subtitle: c('Payment has not been verified', 'Maksua ei ole vahvistettu'), pill: c('Check', 'Tarkista'), tone: 'quiet' },
      { id: 'prepayment', title: c('Tax prepayment', 'Ennakkovero'), subtitle: c('Sample instalment · €640', 'Esimerkkierä · 640,00 €'), pill: c('Check', 'Tarkista'), tone: 'accent',
        text: c('Share your latest prepayment decision to compare the confirmed amounts and dates with your books.', 'Lisää uusin ennakkoveropäätöksesi, jotta vahvistettuja summia ja päivämääriä voidaan verrata kirjanpitoosi.'), action: ask },
      { id: 'return', title: c('Annual tax return', 'Veroilmoitus'), subtitle: c('Preparation not configured', 'Valmistelu ei ole käytössä'), pill: c('Later', 'Myöhemmin'), tone: 'quiet',
        rows: [{ label: c('Sample months ready', 'Esimerkkikuukausia valmiina'), value: '7 / 12' }, { label: c('Open questions', 'Avoimia kysymyksiä'), value: String(book.cards.filter(card => card.class === 'ask' && card.state === 'open').length) }] },
      { id: 'pension', title: 'YEL', subtitle: c('Add your insurance decision when available', 'Lisää vakuutuspäätöksesi, kun se on saatavilla'), pill: c('Later', 'Myöhemmin'), tone: 'quiet' }
    ];
  } else {
    base.title = month;
    base.headline = c('Sample month: €9,840 in sales and €3,120.40 in costs. The estimated result before taxes is €6,719.60.',
      'Esimerkkikuukausi: myyntiä 9 840 € ja kuluja 3 120,40 €. Tulos ennen veroja on arviolta 6 719,60 €.');
    const invoices = book.cards.filter(card => card.class === 'approval' && card.state === 'open' && card.approval?.action_type !== 'authority_grant');
    base.blocks = [
      { id: 'figures', title: c('The figures', 'Luvut'), subtitle: c('Sample period · figures are illustrative', 'Esimerkkikausi · luvut ovat havainnollistavia'),
        rows: [{ label: c('Sales', 'Myynti'), value: money(9840) }, { label: c('Costs', 'Kulut'), value: money(-3120.4) },
          { label: c('Result', 'Tulos'), value: money(6719.6) }, { label: c('VAT estimate', 'ALV-arvio'), value: money(1486.2) }] },
      { id: 'invoices', title: c('Invoices awaiting a decision', 'Päätöstä odottavat laskut'), subtitle: c(`${invoices.length} items`, `${invoices.length} asiaa`),
        pill: c(invoices.length ? 'Waiting for you' : 'Up to date', invoices.length ? 'Odottaa sinua' : 'Ajan tasalla'), tone: invoices.length ? 'accent' : 'quiet',
        rows: invoices.map(card => ({ label: card.context_label, value: money(card.amount), owner: 'you', card_id: card.id })),
        ...(invoices[0] ? { action: { kind: 'queue_card', card_id: invoices[0].id, label: c('Review invoice', 'Tarkista lasku') } } : {}) },
      { id: 'costs', title: c('Largest costs', 'Suurimmat kulut'), subtitle: month,
        rows: [{ label: c('Harbour Timber · materials', 'Harbour Timber · tarvikkeet'), value: money(1240) }, { label: c('Fuel', 'Polttoaine'), value: money(412.3) }, { label: 'Toolhouse', value: money(312.4) }] }
    ];
  }
  return base;
}
