// The mock backend — implements contract/mobile-api.yaml end to end with
// fixture data and scripted state transitions, so `npm run mock` + Expo Go
// is the entire product experience with zero real backend. This is also
// the demo mode an App Store review signs into.
//
// Zero dependencies. In-memory state; restart = fresh demo.
import http from 'node:http';
import { readSettings, updateSettings } from './settings.mjs';
import { buildFinancialReview, enrichRefinementBook, refinementStatus } from './refinementFixtures.mjs';
import crypto from 'node:crypto';
import { demoCopy, localizeSeedActivity, localizeSeedCards, localizeSeedChat, localizeSeedDocuments, localizeStatus } from './finnishFixtures.mjs';
import { lookupBusiness, SetupError, setupSnapshot, stageRegistryCandidate, updateBusinessSetup } from './businessSetup.mjs';
import { createPushRegistrations } from './pushRegistrations.mjs';
import {
  DEMO_LOGIN,
  ENTITY,
  ENTITY_2,
  ONBOARDING_ENTITY,
  ONBOARDING_LOGIN,
  ONBOARDING_PRINCIPAL,
  PRINCIPAL,
  buildActivity,
  buildCards,
  buildDocuments,
  buildOnboardingBook,
  buildSecondBook,
  buildStatus
} from './fixtures.mjs';
import {
  MAX_ONBOARDING_AUDIO_BYTES,
  MAX_ONBOARDING_AUDIO_SECONDS,
  VoiceOnboardingError,
  codexCleanupAvailable,
  confirmOnboardingProfile,
  createCodexTranscriptCleanup,
  createLocalWhisperVoiceDraft,
  createOpenAIVoiceDraft,
  createOpenAITranscriptCleanup,
  prepareVoiceDraft,
  localWhisperAvailable,
  resolveOnboardingAudioMimeType
} from './onboardingVoice.mjs';

const PORT = Number(process.env.PORT || 4141);

// ── State ──────────────────────────────────────────────────────────────────
// Per-entity books: everything a set of books owns lives under its
// entity id, so the switcher demo shows two genuinely different books.
const secondBook = buildSecondBook();
const onboardingBook = buildOnboardingBook();
const accounts = {
  demo: { principal: PRINCIPAL, entities: [ENTITY, ENTITY_2], defaultEntityId: ENTITY.id },
  onboarding: {
    principal: ONBOARDING_PRINCIPAL,
    entities: [ONBOARDING_ENTITY],
    defaultEntityId: ONBOARDING_ENTITY.id
  }
};
const state = {
  books: {
    [ENTITY.id]: {
      entity: ENTITY,
      cards: localizeSeedCards(buildCards()),
      documents: localizeSeedDocuments(buildDocuments()),
      activity: localizeSeedActivity(buildActivity()),
      status: buildStatus,
      chat: localizeSeedChat([
        {
          id: 'msg-welcome',
          author: 'donna',
          text: 'Morning Sam. August is moving along — three purchases need a receipt or a quick fact from you. Everything else is in my hands.',
          at: new Date(Date.now() - 3600e3).toISOString()
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
      ]),
      artifactThreads: new Map(),
      artifactReceipts: new Map(),
      parse: new Map(), // documentId -> { parse_status, parse_stage, ... }
      chatActions: new Map() // actionId -> the server-held payload the terminal never sees
    },
    [ENTITY_2.id]: {
      entity: ENTITY_2,
      cards: localizeSeedCards(secondBook.cards),
      documents: localizeSeedDocuments(secondBook.documents),
      activity: localizeSeedActivity(secondBook.activity),
      status: secondBook.status,
      chat: localizeSeedChat([
        {
          id: 'msg-welcome-hazelmoor',
          author: 'donna',
          text: secondBook.chatWelcome,
          at: new Date(Date.now() - 7200e3).toISOString()
        }
      ]),
      artifactThreads: new Map(),
      artifactReceipts: new Map(),
      parse: new Map(),
      chatActions: new Map()
    },
    [ONBOARDING_ENTITY.id]: {
      entity: ONBOARDING_ENTITY,
      cards: onboardingBook.cards,
      documents: onboardingBook.documents,
      activity: onboardingBook.activity,
      status: onboardingBook.status,
      chat: onboardingBook.chat,
      artifactThreads: new Map(),
      artifactReceipts: new Map(),
      parse: new Map(),
      chatActions: new Map()
    }
  },
  sessions: new Map(), // access_token -> { refresh_token, accountKey }
  pushRegistrations: createPushRegistrations(() => uid('reg')),
  storage: new Map() // object key -> byte length
};
if (process.env.DEMO_REFINEMENT === 'true') enrichRefinementBook(state.books[ENTITY.id]);
const uploadOwners = new Map(); // Scoped intents for background-record intake.

const uid = (prefix) => `${prefix}-${crypto.randomBytes(5).toString('hex')}`;

const needsYouCount = (book) =>
  book.cards.filter((c) => (c.class === 'ask' || c.class === 'approval') && c.state === 'open').length;

const findCard = (book, id) => book.cards.find((c) => c.id === id);
const findDoc = (book, id) => book.documents.find((d) => d.id === id);

const findArtifact = (book, kind, id) =>
  kind === 'queue_card' ? findCard(book, id) : kind === 'document' ? findDoc(book, id) : null;

const artifactThreadKey = (kind, id) => `${kind}:${id}`;

const artifactReply = (artifact, kind) => {
  if (kind === 'document') {
    if (artifact.capture_state === 'stored') return 'This file was received as background material. It has not been reconciled, posted or used to file taxes.';
    if (artifact.capture_state === 'failed') {
      return 'I still have the original upload. Trying it again will not change your books unless the read completes.';
    }
    if (artifact.capture_state === 'processing' || artifact.capture_state === 'received') {
      return 'I am still reading this document. I will keep this thread with it when the result lands.';
    }
    return 'This stays attached to the item, so I can use it when I check the document and its accounting context.';
  }
  if (artifact.class === 'approval' && artifact.state === 'open') {
    return 'Nothing has been sent or applied yet. I will keep the approval open until you use the quick actions by the composer.';
  }
  if (artifact.class === 'ask' && artifact.state === 'open') {
    return 'Your question does not close this item. I will keep the requested answer open until you send it above.';
  }
  return 'I have added that to this item’s history and will keep it with the persisted record.';
};

const receipt = (summary, targets, checks = null) => ({
  summary,
  at: new Date().toISOString(),
  changes: targets.map((target) => ({ target, applied: true, error: null })),
  checks,
  audit_event_ids: [uid('audit')],
  actor: { type: 'owner', terminal: 'mobile' }
});

const pushActivity = (book, event) => {
  book.activity.unshift({ id: uid('ev'), at: new Date().toISOString(), body: null, deep_link: null, ...event });
};

// ── Scripted transitions ───────────────────────────────────────────────────
// An answered ask resolves shortly after (Donna "processes" the answer).
const scheduleAskResolution = (book, card) => {
  setTimeout(() => {
    if (card.state !== 'answered') return;
    card.state = 'resolved';
    pushActivity(book, {
      kind: 'card_resolved',
      title: 'Thanks — your answer settled it',
      body: card.title,
      deep_link: { screen: 'queue', card_id: card.id, document_id: null }
    });
  }, 8000);
};

// A registered document walks the parse pipeline on a timer, mirroring the
// reference lifecycle: pending → processing (stage advancing) → terminal.
const PARSE_STAGES = ['fetching', 'extracting', 'writing', 'enriching', 'finalizing'];
const startParseRun = (book, doc) => {
  const wantsFailure = /fail|blurry|password/i.test(doc.filename);
  const wantsAsk = /cash|unknown/i.test(doc.filename);
  const parse = {
    id: doc.id,
    parse_status: 'pending',
    parse_stage: null,
    parse_progress_current: null,
    parse_progress_total: null,
    parse_error: null,
    duplicate_of: null,
    parse_completed_at: null
  };
  book.parse.set(doc.id, parse);
  doc.capture_state = 'received';

  let step = -1;
  const tick = setInterval(() => {
    step += 1;
    if (step === 0) {
      parse.parse_status = 'processing';
      parse.parse_stage = 'fetching';
      doc.capture_state = 'processing';
      return;
    }
    if (step < PARSE_STAGES.length) {
      parse.parse_stage = PARSE_STAGES[step];
      parse.parse_progress_current = step;
      parse.parse_progress_total = PARSE_STAGES.length;
      return;
    }
    clearInterval(tick);
    parse.parse_stage = null;
    parse.parse_progress_current = null;
    parse.parse_progress_total = null;
    parse.parse_completed_at = new Date().toISOString();
    if (wantsFailure) {
      parse.parse_status = 'failed';
      parse.parse_error = {
        code: 'DOCUMENT_EXTRACTION_UNREADABLE',
        safe_user_message: 'This photo was too blurry to read. A flatter, closer shot usually works.',
        retryable: true
      };
      doc.capture_state = 'failed';
      doc.failure_message = parse.parse_error.safe_user_message;
      return;
    }
    parse.parse_status = 'completed';
    doc.document_type = doc.document_type || 'receipt';
    if (wantsAsk) {
      const askCard = {
        id: `client_evidence_request:${uid('ask')}`,
        entity_id: book.entity.id,
        class: 'ask',
        state: 'open',
        title: `What was ${doc.filename} for?`,
        detail: 'New capture',
        occurred_on: null,
        created_at: new Date().toISOString(),
        amount: null,
        currency: null,
        counterparty: null,
        blocks_close: false,
        transaction_id: null,
        document_id: doc.id,
        source: { kind: 'client_evidence_request', id: uid('ask') },
        ask: {
          question: `Donna read ${doc.filename} but couldn’t tell what it was for. A few words is plenty.`,
          evidence_type: 'business_purpose',
          allows_text: true,
          allows_documents: false,
          choices: null,
          answered_text: null,
          answered_at: null
        }
      };
      book.cards.unshift(askCard);
      doc.capture_state = 'needs_info';
      doc.needs_info_card_id = askCard.id;
      pushActivity(book, {
        kind: 'card_created',
        title: '1 new question about a capture',
        deep_link: { screen: 'queue', card_id: askCard.id, document_id: doc.id }
      });
      return;
    }
    doc.capture_state = 'attached';
    pushActivity(book, {
      kind: 'document_attached',
      title: `${doc.filename} is in your books`,
      deep_link: { screen: 'capture', card_id: null, document_id: doc.id }
    });
  }, 1600);
};

// ── Mileage (shared by POST /mileage and the chat-apply seam) ──────────────
const recordMileageIntoBook = (book, { date, distance, unit, purpose }) => {
  const fyi = {
    id: `mileage_record:${uid('mile')}`,
    entity_id: book.entity.id,
    class: 'fyi',
    state: 'done',
    title: `Logged ${distance} ${unit} — ${purpose}`,
    detail: null,
    occurred_on: date,
    created_at: new Date().toISOString(),
    amount: null,
    currency: null,
    counterparty: null,
    blocks_close: false,
    transaction_id: null,
    document_id: null,
    source: { kind: 'mileage_record', id: uid('mile') },
    fyi: {
      description: `A ${distance} ${unit} business journey on ${date} (“${purpose}”) is in your books at the standard rate.`,
      done_at: new Date().toISOString(),
      corrective_verbs: ['veto_flag'],
      marked_wrong_at: null
    }
  };
  book.cards.unshift(fyi);
  return {
    receipt: receipt(`Logged ${distance} ${unit} for “${purpose}” — it’s in your books.`, [fyi.id]),
    card: fyi
  };
};

// ── Chat appliable actions (the 2026-08-26 grammar) ────────────────────────
// The mock's stand-in for the strong model: crude pattern-spotting that
// mints TYPED actions whose payloads stay server-side. A new Donna
// message carrying actions supersedes every prior available one (the
// reference backend's proposal-supersede rule).
const supersedePriorChatActions = (book) => {
  for (const message of book.chat) {
    for (const action of message.actions || []) {
      if (action.state === 'available') action.state = 'superseded';
    }
  }
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const mintChatActions = (book, text) => {
  const actions = [];
  const mileage = text.match(/(\d+(?:[.,]\d+)?)\s*(km|kilometres?|kilometers?|mi|miles?)\b/i);
  if (mileage) {
    const distance = Number(mileage[1].replace(',', '.'));
    const unit = /^k/i.test(mileage[2]) ? 'km' : 'mi';
    const purpose = text.length <= 80 ? text : `${text.slice(0, 77)}…`;
    const id = uid('act');
    book.chatActions.set(id, { kind: 'record_mileage', date: todayIso(), distance, unit, purpose });
    actions.push({
      id,
      kind: 'record_mileage',
      label: demoCopy(`Log ${distance} ${unit} — business journey`, `Kirjaa ${distance} ${unit} – työajo`),
      summary: demoCopy(`I’ll put a ${distance} ${unit} journey in your books at the standard rate, dated today.`,
        `Kirjaan kirjanpitoosi tälle päivälle ${distance} ${unit} työajoa kilometrikorvauksen vakiotaksalla.`),
      state: 'available',
      applied_at: null
    });
  }
  if (!actions.length) {
    const lower = text.toLowerCase();
    for (const askCard of book.cards) {
      if (askCard.class !== 'ask' || askCard.state !== 'open' || !askCard.ask?.choices || !askCard.counterparty) continue;
      if (!lower.includes(askCard.counterparty.toLowerCase())) continue;
      const choice = askCard.ask.choices.find((c) => lower.includes(c.label.split(' ')[0].toLowerCase()));
      if (!choice) continue;
      const id = uid('act');
      book.chatActions.set(id, { kind: 'answer_card', card_id: askCard.id, choice_id: choice.id });
      actions.push({
        id,
        kind: 'answer_card',
        label: demoCopy(`Answer: ${choice.label} — ${askCard.counterparty}`, `Vastaa: ${choice.label} – ${askCard.counterparty}`),
        summary: demoCopy(`That settles the open question on ${askCard.counterparty} — I’ll code it and move on.`,
          `Tämä ratkaisee avoimen kysymyksen (${askCard.counterparty}). Kirjaan sen ja jatkan eteenpäin.`),
        state: 'available',
        applied_at: null
      });
      break;
    }
  }
  return actions;
};

// ── Decision handling (the closed grammar) ─────────────────────────────────
const decide = (book, card, body) => {
  const type = body?.type;
  const already = () => ({ applied: false, already: card.state, card, receipt: undefined });

  if (type === 'answer') {
    if (card.class !== 'ask') return { status: 409, error: 'Only ask cards take answers.', code: 'DECISION_TYPE_INVALID' };
    if (card.state !== 'open') return { status: 200, body: already() };
    const text = body?.answer?.text?.trim() || null;
    const choiceId = body?.answer?.choice_id || null;
    const documentIds = body?.answer?.document_ids || [];
    const choice = choiceId ? card.ask.choices?.find((c) => c.id === choiceId) : null;
    if (!text && !choice && documentIds.length === 0) {
      return { status: 400, error: 'An answer needs text, a choice, or a document.', code: 'ANSWER_EMPTY' };
    }
    card.state = 'answered';
    card.ask.answered_text = choice ? choice.label : text;
    card.ask.answered_at = new Date().toISOString();
    for (const documentId of documentIds) {
      const doc = findDoc(book, documentId);
      if (doc && doc.capture_state === 'needs_info') {
        doc.capture_state = 'attached';
        doc.needs_info_card_id = null;
      }
    }
    scheduleAskResolution(book, card);
    return {
      status: 200,
      body: {
        applied: true,
        already: null,
        card,
        receipt: receipt(
          book.refinementSample && card.ask.answered_text ? demoCopy('Answered · ', 'Vastattu · ') + card.ask.answered_text :
          demoCopy('Your answer was received. Donna takes it from here.', 'Vastauksesi on vastaanotettu. Donna jatkaa tästä.'),
          [card.source.kind + ':' + card.source.id, ...documentIds]
        )
      }
    };
  }

  if (type === 'approve' || type === 'reject') {
    if (card.class !== 'approval') {
      return { status: 409, error: 'Only approval cards take approve/reject.', code: 'DECISION_TYPE_INVALID' };
    }
    if (card.state !== 'open') return { status: 200, body: already() };
    card.state = type === 'approve' ? 'approved' : 'rejected';
    card.approval.decided_at = new Date().toISOString();
    if (type === 'approve') {
      const fyi = {
        id: `outbound_action:${uid('sent')}`,
        entity_id: book.entity.id,
        class: 'fyi',
        state: 'done',
        title: card.approval.action_type === 'issue_invoice'
          ? demoCopy('Invoice issued', 'Lasku lähetetty')
          : card.approval.action_type === 'authority_grant'
            ? demoCopy('Standing authority recorded', 'Jatkuva valtuutus tallennettu')
            : demoCopy('Reminder sent', 'Maksumuistutus lähetetty'),
        detail: card.counterparty || null,
        occurred_on: null,
        created_at: new Date().toISOString(),
        amount: card.amount,
        currency: card.currency,
        counterparty: card.counterparty,
        blocks_close: false,
        transaction_id: null,
        document_id: null,
        source: { kind: 'outbound_action', id: uid('sent') },
        fyi: {
          description: demoCopy(
            `${card.title.replace(/\?$/, '')} — done, moments after you approved it.`,
            'Toiminto on toteutettu hyväksyntäsi mukaisesti.'
          ),
          done_at: new Date().toISOString(),
          corrective_verbs: ['veto_flag'],
          marked_wrong_at: null
        }
      };
      book.cards.unshift(fyi);
    }
    return {
      status: 200,
      body: {
        applied: true,
        already: null,
        card,
        receipt: receipt(
          type === 'approve'
            ? demoCopy('Approved and executed. The result is in Books.', 'Hyväksytty ja toteutettu. Tulos näkyy kirjanpidossa.')
            : `Declined${body?.note ? ` — noted: “${body.note.trim()}”` : ''}. Nothing was sent.`,
          [card.source.kind + ':' + card.source.id],
          [{ name: 'authority', status: 'pass', detail: 'Owner decision recorded with actor attribution.' }]
        )
      }
    };
  }

  if (type === 'veto_flag') {
    if (card.class !== 'fyi') {
      return { status: 409, error: 'Only fyi cards take veto_flag.', code: 'DECISION_TYPE_INVALID' };
    }
    if (card.fyi.marked_wrong_at) return { status: 200, body: { applied: false, already: 'flagged', card } };
    card.state = 'flagged';
    card.fyi.marked_wrong_at = new Date().toISOString();
    return {
      status: 200,
      body: {
        applied: true,
        already: null,
        card,
        receipt: receipt(
          'Flagged. Donna will unwind this and learn from the correction — nothing else changes until she does.',
          [card.source.kind + ':' + card.source.id]
        )
      }
    };
  }

  return { status: 400, error: `Unknown decision type '${type}'.`, code: 'DECISION_TYPE_UNKNOWN' };
};

// ── HTTP plumbing ──────────────────────────────────────────────────────────
const json = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Authorization, Content-Type, x-upsert, X-Audio-Filename, X-Audio-Duration-Seconds',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(payload);
};

const readBody = (req, maxBytes = 2 * 1024 * 1024) =>
  new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      if (tooLarge || !raw.length) return resolve({ raw, body: undefined, tooLarge });
      try {
        resolve({ raw, body: JSON.parse(raw.toString('utf8')), tooLarge: false });
      } catch {
        resolve({ raw, body: undefined, tooLarge: false });
      }
    });
  });

const mintSession = (accountKey) => {
  const account = accounts[accountKey];
  const access_token = uid('tok');
  const refresh_token = uid('ref');
  state.sessions.set(access_token, { refresh_token, accountKey });
  return {
    access_token,
    refresh_token,
    expires_in: 3600,
    principal: account.principal,
    entities: account.entities,
    default_entity_id: account.defaultEntityId
  };
};

const sessionForRequest = (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return token ? state.sessions.get(token) ?? null : null;
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  if (method === 'OPTIONS') return json(res, 204, {});

  // Signed-upload target (step 2 of the upload flow).
  if (method === 'PUT' && path.startsWith('/mock-storage/')) {
    const { raw, tooLarge } = await readBody(req, 10 * 1024 * 1024);
    if (tooLarge) {
      return json(res, 413, { error: 'Files up to 10 MB are supported.', code: 'EVIDENCE_FILE_SIZE_INVALID' });
    }
    state.storage.set(path.slice('/mock-storage/'.length), raw.length);
    return json(res, 200, { stored: true });
  }

  const isVoiceDraft = /^\/entities\/[^/]+\/onboarding\/voice-draft$/.test(path);
  const receivesBody = method === 'POST' || method === 'PUT' || method === 'DELETE';
  const { raw, body, tooLarge } = receivesBody
    ? await readBody(req, isVoiceDraft ? MAX_ONBOARDING_AUDIO_BYTES : undefined)
    : { raw: Buffer.alloc(0), body: undefined, tooLarge: false };
  if (tooLarge) {
    return json(res, 413, {
      error: isVoiceDraft ? 'Recordings up to 8 MB are supported.' : 'The request body is too large.',
      code: isVoiceDraft ? 'VOICE_AUDIO_TOO_LARGE' : 'REQUEST_BODY_TOO_LARGE'
    });
  }

  // ── auth (unauthenticated) ──
  if (method === 'POST' && path === '/auth/sessions') {
    const email = body?.email?.toLowerCase();
    const accountKey =
      email === DEMO_LOGIN.email && body?.password === DEMO_LOGIN.password
        ? 'demo'
        : email === ONBOARDING_LOGIN.email && body?.password === ONBOARDING_LOGIN.password
          ? 'onboarding'
          : null;
    if (!accountKey) return json(res, 401, { error: 'Those details are not valid.', code: 'AUTH_INVALID' });
    return json(res, 200, mintSession(accountKey));
  }
  if (method === 'POST' && path === '/auth/sessions/refresh') {
    const known = [...state.sessions.values()].find((s) => s.refresh_token === body?.refresh_token);
    if (!known) return json(res, 401, { error: 'Refresh token expired.', code: 'AUTH_REQUIRED' });
    return json(res, 200, mintSession(known.accountKey));
  }

  const activeSession = sessionForRequest(req);
  if (!activeSession) {
    return json(res, 401, { error: 'Access token required.', code: 'AUTH_REQUIRED' });
  }
  const activeAccount = accounts[activeSession.accountKey];

  if (method === 'DELETE' && path === '/auth/sessions/current') {
    const token = (req.headers.authorization || '').slice(7);
    state.sessions.delete(token);
    return json(res, 204, {});
  }

  if (method === 'GET' && path === '/me') {
    return json(res, 200, {
      principal: activeAccount.principal,
      entities: activeAccount.entities,
      default_entity_id: activeAccount.defaultEntityId
    });
  }

  if (method === 'POST' && path === '/me/deletion-request') {
    if (!activeAccount.deletionRequestedAt) activeAccount.deletionRequestedAt = new Date().toISOString();
    return json(res, 200, {
      requested_at: activeAccount.deletionRequestedAt,
      message:
        'Your deletion request is recorded. Your books stay readable for the statutory retention period for your jurisdiction, then everything is erased — you’ll get a confirmation when it’s done. (Demo books: the mock resets on restart.)'
    });
  }

  const entityMatch = path.match(/^\/entities\/([^/]+)(\/.*)?$/);
  if (entityMatch) {
    const [, entityRaw, restRaw] = entityMatch;
    let entityId;
    try {
      entityId = decodeURIComponent(entityRaw);
    } catch {
      return json(res, 404, { error: 'No such entity.', code: 'ENTITY_NOT_FOUND' });
    }
    const rest = restRaw || '';
    if (!activeAccount.entities.some((entity) => entity.id === entityId)) {
      return json(res, 404, { error: 'No such entity.', code: 'ENTITY_NOT_FOUND' });
    }
    const book = state.books[entityId];
    if (!book) return json(res, 404, { error: 'No such entity.', code: 'ENTITY_NOT_FOUND' });

    if (rest === '/settings') {
      if (method === 'GET') return json(res, 200, readSettings(book, activeAccount.principal.id));
      if (method === 'POST') {
        try {
          const settings = updateSettings(book, activeAccount.principal.id, body);
          return json(res, 200, { settings, receipt: receipt('Preview settings saved. No external action or authority granted.', [`entity:${entityId}:settings`]) });
        } catch { return json(res, 400, { error: 'Settings could not be saved.', code: 'SETTINGS_INVALID' }); }
      }
    }

    if (rest.startsWith('/business-setup')) {
      if (book.entity.country !== 'FI') return json(res, 404, { error: 'Setup not available.', code: 'SETUP_UNAVAILABLE' });
      try {
        if (method === 'GET' && rest === '/business-setup') return json(res, 200, setupSnapshot(book));
        if (method === 'POST' && rest === '/business-setup/lookup') {
          return json(res, 200, stageRegistryCandidate(book, await lookupBusiness(body?.business_id)));
        }
        if (method === 'POST' && rest === '/business-setup') {
          return json(res, 200, { setup: updateBusinessSetup(book, body), receipt: receipt('Business setup preference saved. No authority granted.', [`entity:${entityId}:setup`]) });
        }
      } catch (cause) {
        if (cause instanceof SetupError) return json(res, cause.status, { error: 'Business setup could not be updated.', code: cause.code });
        return json(res, 503, { error: 'Business setup unavailable.', code: 'SETUP_UNAVAILABLE' });
      }
    }

    if (method === 'POST' && rest === '/onboarding/text-draft') {
      const text = typeof body?.text === 'string' ? body.text.trim() : '';
      if (!text || text.length > 12000) return json(res, 400, {
        error: 'Enter a business introduction of up to 12000 characters.', code: 'INTRODUCTION_INVALID'
      });
      try {
        const draft = await prepareVoiceDraft({
          transcribe: async () => text,
          processingMode: 'typed_introduction',
          extract: (transcript) => process.env.OPENAI_API_KEY
            ? createOpenAITranscriptCleanup({ transcript, apiKey: process.env.OPENAI_API_KEY,
                cleanupModel: process.env.OPENAI_CLEANUP_MODEL || process.env.OPENAI_EXTRACTION_MODEL })
            : createCodexTranscriptCleanup({ transcript })
        });
        return json(res, 200, draft);
      } catch (cause) {
        console.warn('[onboarding] text cleanup failed', { code: cause.code || 'VOICE_EXTRACTION_FAILED' });
        return json(res, 422, { error: 'Your introduction could not be prepared. Please try again.', code: 'VOICE_EXTRACTION_FAILED' });
      }
    }

    if (method === 'POST' && rest === '/onboarding/voice-draft') {
      const durationSeconds = Number(req.headers['x-audio-duration-seconds']);
      if (!raw.length || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        return json(res, 400, {
          error: 'A completed recording and its duration are required.',
          code: 'VOICE_AUDIO_INVALID'
        });
      }
      if (durationSeconds > MAX_ONBOARDING_AUDIO_SECONDS) {
        return json(res, 413, {
          error: 'Recordings can be up to five minutes long.',
          code: 'VOICE_AUDIO_TOO_LONG'
        });
      }
      let filename = 'business-introduction.m4a';
      try {
        filename = decodeURIComponent(String(req.headers['x-audio-filename'] || filename));
      } catch {
        return json(res, 400, { error: 'The recording filename is invalid.', code: 'VOICE_AUDIO_INVALID' });
      }
      filename = filename.replace(/[^\w. -]+/g, '_').slice(0, 160) || 'business-introduction.m4a';
      const mimeType = resolveOnboardingAudioMimeType(filename, req.headers['content-type']);
      if (!mimeType) {
        return json(res, 415, {
          error: 'Use an M4A, MP4, MP3, WAV, or WebM recording.',
          code: 'VOICE_AUDIO_TYPE_UNSUPPORTED'
        });
      }
      try {
        const hasLocalWhisper = !process.env.OPENAI_API_KEY && (await localWhisperAvailable());
        const useCodexCleanup =
          hasLocalWhisper &&
          process.env.VOICE_CLEANUP_PROVIDER !== 'rules' &&
          (await codexCleanupAvailable());
        const draft = hasLocalWhisper
          ? await createLocalWhisperVoiceDraft({
              audio: raw,
              filename,
              allowRulesPreview: process.env.VOICE_CLEANUP_PROVIDER === 'rules',
              cleanup: useCodexCleanup
                ? (transcript) => createCodexTranscriptCleanup({ transcript })
                : null
            })
          : await createOpenAIVoiceDraft({
              audio: raw,
              filename,
              mimeType,
              apiKey: process.env.OPENAI_API_KEY,
              cleanupModel: process.env.OPENAI_CLEANUP_MODEL || process.env.OPENAI_EXTRACTION_MODEL
            });
        return json(res, 200, draft);
      } catch (cause) {
        console.warn('[onboarding] voice processing failed', { code: cause.code || 'VOICE_PROCESSING_FAILED' });
        if (cause instanceof VoiceOnboardingError) {
          return json(res, cause.status, { error: cause.message, code: cause.code });
        }
        return json(res, 422, {
          error: 'A review draft could not be prepared from that recording.',
          code: 'VOICE_PROCESSING_FAILED'
        });
      }
    }

    if (method === 'PUT' && rest === '/onboarding/profile') {
      try {
        const result = confirmOnboardingProfile({
          principal: activeAccount.principal,
          entity: book.entity,
          input: body
        });
        activeAccount.principal = result.principal;
        activeAccount.entities = activeAccount.entities.map((entity) =>
          entity.id === result.entity.id ? result.entity : entity
        );
        book.entity = result.entity;
        return json(res, 200, {
          ...result,
          receipt: receipt('Your reviewed business profile was confirmed.', [
            `principal:${result.principal.id}`,
            `entity:${result.entity.id}`
          ])
        });
      } catch (cause) {
        if (cause instanceof VoiceOnboardingError) {
          return json(res, cause.status, { error: cause.message, code: cause.code });
        }
        return json(res, 400, { error: 'The reviewed profile is invalid.', code: 'PROFILE_INVALID' });
      }
    }

    if (method === 'GET' && rest === '/queue') {
      return json(res, 200, {
        generated_at: new Date().toISOString(),
        needs_you_count: needsYouCount(book),
        cards: book.cards
      });
    }

    const cardMatch = rest.match(/^\/queue\/cards\/([^/]+)(\/decision)?$/);
    if (cardMatch) {
      const card = findCard(book, decodeURIComponent(cardMatch[1]));
      if (!card) return json(res, 404, { error: 'No such card.', code: 'CARD_NOT_FOUND' });
      if (method === 'GET' && !cardMatch[2]) return json(res, 200, card);
      if (method === 'POST' && cardMatch[2]) {
        const outcome = decide(book, card, body);
        if (outcome.status !== 200) return json(res, outcome.status, { error: outcome.error, code: outcome.code });
        if (outcome.body.applied && outcome.body.receipt) {
          const key = artifactThreadKey('queue_card', card.id);
          const receipts = book.artifactReceipts.get(key) ?? [];
          receipts.push(outcome.body.receipt);
          book.artifactReceipts.set(key, receipts);
        }
        return json(res, 200, outcome.body);
      }
    }

    const artifactMessageMatch = rest.match(/^\/artifacts\/(queue_card|document)\/([^/]+)\/messages$/);
    if (artifactMessageMatch) {
      const kind = artifactMessageMatch[1];
      const artifactId = decodeURIComponent(artifactMessageMatch[2]);
      const artifact = findArtifact(book, kind, artifactId);
      if (!artifact) return json(res, 404, { error: 'No such artifact.', code: 'ARTIFACT_NOT_FOUND' });
      const key = artifactThreadKey(kind, artifactId);
      const messages = book.artifactThreads.get(key) ?? [];
      const receipts = book.artifactReceipts.get(key) ?? [];
      if (method === 'GET') {
        const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
        return json(res, 200, {
          artifact_kind: kind,
          artifact_id: artifactId,
          messages: messages.slice(-limit),
          receipts
        });
      }
      if (method === 'POST') {
        const text = body?.text?.trim();
        if (!text || text.length > 2000) {
          return json(res, 400, { error: 'Say something about this item first.', code: 'ARTIFACT_TEXT_REQUIRED' });
        }
        const message = { id: uid('item-msg'), author: 'owner', text, at: new Date().toISOString() };
        const reply = {
          id: uid('item-msg'),
          author: 'donna',
          text: demoCopy(artifactReply(artifact, kind), 'Kommenttisi on tallennettu tähän keskusteluun. Pelkkä kommentti ei muuta kirjausta tai hyväksy toimintoa.'),
          at: new Date(Date.now() + 500).toISOString()
        };
        messages.push(message, reply);
        book.artifactThreads.set(key, messages);
        return json(res, 200, { message, reply });
      }
    }

    if (method === 'GET' && rest === '/status') {
      const status = localizeStatus(book.status(needsYouCount(book), book.cards));
      const n = status.needs_you_count;
      status.headline =
        n === 0
          ? demoCopy('All caught up. Donna is working in the background.', 'Mikään ei odota sinua. Donna työskentelee taustalla.')
          : n === 1
            ? demoCopy('1 thing needs you. The rest is in Donna’s hands.', '1 asia odottaa sinua. Loput ovat Donnan käsissä.')
            : demoCopy(`${n} things need you. The rest is in Donna’s hands.`, `${n} asiaa odottaa sinua. Loput ovat Donnan käsissä.`);
      return json(res, 200, book.refinementSample ? refinementStatus(book, status) : status);
    }

    const reviewMatch = rest.match(/^\/reviews\/(taxes|month)$/);
    if (method === 'GET' && reviewMatch) {
      const period = url.searchParams.get('period') || undefined;
      if (period && !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return json(res, 400, { error: 'Invalid period.', code: 'REVIEW_PERIOD_INVALID' });
      return json(res, 200, buildFinancialReview(book, reviewMatch[1], period));
    }

    if (method === 'GET' && rest === '/documents') {
      const limit = Math.min(Number(url.searchParams.get('limit') || 30), 100);
      return json(res, 200, { documents: book.documents.slice(0, limit), next_cursor: null });
    }

    const documentMatch = rest.match(/^\/documents\/([^/]+)$/);
    if (method === 'GET' && documentMatch) {
      const document = findDoc(book, decodeURIComponent(documentMatch[1]));
      if (!document) return json(res, 404, { error: 'No such document.', code: 'DOCUMENT_NOT_FOUND' });
      return json(res, 200, document);
    }

    if (method === 'POST' && rest === '/documents/upload-intent') {
      if (!body?.filename || !body?.mime_type || !body?.size || !body?.checksum_sha256) {
        return json(res, 400, { error: 'filename, mime_type, size, checksum_sha256 required.', code: 'UPLOAD_INTENT_INVALID' });
      }
      if (body.size > 10 * 1024 * 1024) {
        return json(res, 413, { error: 'Files up to 10 MB are supported.', code: 'EVIDENCE_FILE_SIZE_INVALID' });
      }
      const key = `${uid('upload')}-${body.filename.replace(/[^\w.-]+/g, '_')}`;
      uploadOwners.set(key, { entityId, checksum: body.checksum_sha256 });
      return json(res, 200, {
        upload_url: `http://${req.headers.host}/mock-storage/${key}`,
        headers: { 'Content-Type': body.mime_type, 'x-upsert': 'false' },
        storage_bucket: 'mock-evidence',
        storage_object_key: key,
        expires_in: 600
      });
    }

    if (method === 'POST' && rest === '/documents/register') {
      const incoming = body?.documents || [];
      if (!incoming.length) return json(res, 400, { error: 'documents required.', code: 'DOCUMENTS_REQUIRED' });
      if (incoming.some(reg => reg.purpose !== undefined && reg.purpose !== 'prior_records')) return json(res, 400, { error: 'Invalid document purpose.', code: 'DOCUMENT_PURPOSE_INVALID' });
      if (incoming.some(reg => reg.purpose === 'prior_records' && reg.answers_card_id)) return json(res, 400, { error: 'Background records cannot answer a receipt question.', code: 'RECORD_PURPOSE_CONFLICT' });
      if (incoming.some(reg => reg.purpose === 'prior_records' && !findDoc(book, reg.id) &&
        (uploadOwners.get(reg.storage_object_key)?.entityId !== entityId ||
          uploadOwners.get(reg.storage_object_key)?.checksum !== reg.checksum_sha256 ||
          reg.storage_bucket !== 'mock-evidence' || !state.storage.get(reg.storage_object_key)))) {
        return json(res, 400, { error: 'Upload the background record before registering it.', code: 'RECORD_UPLOAD_REQUIRED' });
      }
      const out = [];
      for (const reg of incoming) {
        const existing = findDoc(book, reg.id);
        if (existing) {
          out.push(existing);
          continue;
        }
        const doc = {
          id: reg.id,
          entity_id: book.entity.id,
          filename: reg.filename,
          capture_state: 'received',
          uploaded_at: new Date().toISOString(),
          captured_at: reg.captured_at || null,
          document_type: null,
          document_date: null,
          total_amount: null,
          currency: null,
          counterparty: null,
          needs_info_card_id: null,
          failure_message: null,
          duplicate_of: null
        };
        if (reg.purpose === 'prior_records') {
          doc.purpose = 'prior_records';
          doc.capture_state = 'stored';
          doc.document_type = 'prior_records';
        }
        book.documents.unshift(doc);
        if (doc.purpose !== 'prior_records') startParseRun(book, doc);
        if (reg.answers_card_id) {
          const card = findCard(book, reg.answers_card_id);
          if (card?.class === 'ask' && card.state === 'open') {
            decide(book, card, { type: 'answer', answer: { document_ids: [doc.id] } });
          }
        }
        out.push(doc);
      }
      return json(res, 200, { documents: out });
    }

    if (method === 'GET' && rest === '/documents/parse-status') {
      const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 100);
      const documents = ids.map(
        (id) =>
          book.parse.get(id) || {
            id,
            parse_status: findDoc(book, id) ? 'completed' : 'failed',
            parse_stage: null,
            parse_progress_current: null,
            parse_progress_total: null,
            parse_error: null,
            duplicate_of: findDoc(book, id)?.duplicate_of ?? null,
            parse_completed_at: findDoc(book, id)?.uploaded_at ?? null
          }
      );
      return json(res, 200, { documents });
    }

    const docAction = rest.match(/^\/documents\/([^/]+)\/(retry|resolve-duplicate)$/);
    if (method === 'POST' && docAction) {
      const doc = findDoc(book, decodeURIComponent(docAction[1]));
      if (!doc) return json(res, 404, { error: 'No such document.', code: 'DOCUMENT_NOT_FOUND' });
      if (docAction[2] === 'retry') {
        if (!['failed', 'duplicate'].includes(doc.capture_state)) {
          return json(res, 409, { error: 'Only failed or duplicate documents can be retried.', code: 'NOT_RETRYABLE' });
        }
        doc.failure_message = null;
        startParseRun(book, doc);
        return json(res, 200, doc);
      }
      const action = body?.action;
      if (!['create', 'replace', 'cancel'].includes(action)) {
        return json(res, 400, { error: 'action must be create, replace, or cancel.', code: 'DUPLICATE_ACTION_INVALID' });
      }
      if (action === 'cancel') {
        book.documents = book.documents.filter((d) => d.id !== doc.id);
        return json(res, 200, { ...doc, capture_state: 'duplicate' });
      }
      doc.duplicate_of = null;
      startParseRun(book, doc);
      return json(res, 200, doc);
    }

    if (method === 'GET' && rest === '/chat') {
      const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
      return json(res, 200, { messages: book.chat.slice(-limit) });
    }

    if (method === 'POST' && rest === '/chat/messages') {
      const text = body?.text?.trim();
      if (!text) return json(res, 400, { error: 'Say something first.', code: 'CHAT_TEXT_REQUIRED' });
      const message = { id: uid('msg'), author: 'owner', text, at: new Date().toISOString() };
      book.chat.push(message);
      const actions = mintChatActions(book, text);
      const n = needsYouCount(book);
      const reply = {
        id: uid('msg'),
        author: 'donna',
        text: actions.length
          ? actions[0].kind === 'record_mileage'
            ? demoCopy('I can put that journey in your books right now — one tap below.',
              'Voin kirjata matkan kirjanpitoosi heti – yksi napautus alla riittää.')
            : demoCopy('That sounds like it settles an open question — want me to file it?',
              'Tämä näyttää ratkaisevan avoimen kysymyksen – kirjaanko sen?')
          : /vat|tax|alv|vero/i.test(text)
            ? demoCopy('Good question. For your kind of purchases the standard rate applies unless the receipt says otherwise — I check each one against the source rules and flag anything unusual in Actions.',
              'Hyvä kysymys. Tällaisiin ostoksiin pätee yleinen verokanta, ellei kuitissa lue muuta. Tarkistan jokaisen säännöistä ja nostan poikkeukset Tehtäviin.')
            : /receipt|photo|kuitti|kuva/i.test(text)
              ? demoCopy('Snap it with the + button whenever — I match it to the right bank line and you’ll see it settle in Materials.',
                'Kuvaa se + -painikkeella milloin vain. Yhdistän sen oikeaan tilitapahtumaan, ja näet sen Aineistossa.')
              : demoCopy(`Noted — I’ve got it. ${n === 0 ? 'Nothing is waiting on you right now.' : `${n} thing${n === 1 ? ' is' : 's are'} waiting on you in Actions; the rest is handled.`}`,
                `Selvä, hoidan sen. ${n === 0 ? 'Mikään ei odota sinua juuri nyt.' : `${n === 1 ? '1 asia odottaa' : `${n} asiaa odottaa`} sinua Tehtävissä, loput on hoidettu.`}`),
        at: new Date(Date.now() + 800).toISOString()
      };
      if (book.refinementSample) reply.text = demoCopy(
        actions.length ? 'I can record this in the sample books when you confirm the action below.' : 'Your message is saved in this sample conversation. No bookkeeping entry or external action has been made.',
        actions.length ? 'Voin kirjata tämän esimerkkikirjoihin, kun vahvistat alla olevan toiminnon.' : 'Viestisi on tallennettu tähän esimerkkikeskusteluun. Kirjausta tai ulkoista toimintoa ei ole tehty.'
      );
      if (actions.length) {
        supersedePriorChatActions(book);
        reply.actions = actions;
      }
      book.chat.push(reply);
      return json(res, 200, { message, reply });
    }

    if (method === 'POST' && rest === '/mileage') {
      const { date, distance, unit, purpose } = body || {};
      if (!date || !distance || !unit || !purpose) {
        return json(res, 400, { error: 'date, distance, unit and purpose are required.', code: 'MILEAGE_INVALID' });
      }
      const { receipt: mileageReceipt, card } = recordMileageIntoBook(book, { date, distance, unit, purpose });
      return json(res, 200, { receipt: mileageReceipt, card });
    }

    const actionMatch = rest.match(/^\/chat\/actions\/([^/]+)\/apply$/);
    if (method === 'POST' && actionMatch) {
      const actionId = decodeURIComponent(actionMatch[1]);
      let action = null;
      for (const m of book.chat) {
        for (const a of m.actions || []) if (a.id === actionId) action = a;
      }
      if (!action) return json(res, 404, { error: 'No such action.', code: 'CHAT_ACTION_NOT_FOUND' });
      if (action.state !== 'available') {
        return json(res, 200, { applied: false, already: action.state, action, receipt: null, card: null });
      }
      const stored = book.chatActions.get(actionId);
      if (action.kind === 'record_mileage') {
        const { receipt: mileageReceipt, card } = recordMileageIntoBook(book, stored);
        action.state = 'applied';
        action.result_label = demoCopy('journey recorded', 'matka kirjattu');
        action.applied_at = new Date().toISOString();
        return json(res, 200, { applied: true, already: null, action, receipt: mileageReceipt, card });
      }
      if (!stored) return json(res, 409, { error: 'Action is unavailable.', code: 'CHAT_ACTION_UNAVAILABLE' });
      // Explicit typed actions route through the same authority checks as item decisions.
      const targetCard = findCard(book, stored.card_id);
      const outcome = targetCard
        ? decide(book, targetCard, stored.kind === 'approve_card' ? { type: 'approve' } : { type: 'answer', answer: { choice_id: stored.choice_id } })
        : null;
      if (!outcome || outcome.status !== 200 || !outcome.body.applied) {
        // The underlying question was handled some other way — the action is stale, not an error.
        action.state = 'superseded';
        return json(res, 200, { applied: false, already: 'superseded', action, receipt: null, card: targetCard ?? null });
      }
      action.state = 'applied';
      action.result_label = stored.kind === 'approve_card' ? demoCopy('invoice sent', 'lasku lähetetty') : demoCopy('answer recorded', 'vastaus tallennettu');
      action.applied_at = new Date().toISOString();
      if (outcome.body.receipt) {
        const key = artifactThreadKey('queue_card', targetCard.id);
        book.artifactReceipts.set(key, [...(book.artifactReceipts.get(key) ?? []), outcome.body.receipt]);
      }
      return json(res, 200, {
        applied: true,
        already: null,
        action,
        receipt: outcome.body.receipt ?? null,
        card: outcome.body.card ?? null
      });
    }

    if (method === 'GET' && rest === '/activity') {
      const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);
      return json(res, 200, { events: book.activity.slice(0, limit), next_cursor: null });
    }
  }

  if (method === 'POST' && path === '/notifications/registrations') {
    if (!body?.platform || !body?.expo_push_token) {
      return json(res, 400, { error: 'platform and expo_push_token required.', code: 'REGISTRATION_INVALID' });
    }
    const id = state.pushRegistrations.upsert(activeAccount.principal.id, body);
    return json(res, 201, { id });
  }
  const regMatch = path.match(/^\/notifications\/registrations\/([^/]+)$/);
  if (method === 'DELETE' && regMatch) {
    // As on the real server: a registration this principal does not own is
    // indistinguishable from one that does not exist.
    if (!state.pushRegistrations.remove(activeAccount.principal.id, decodeURIComponent(regMatch[1]))) {
      return json(res, 404, { error: 'No such registration.', code: 'REGISTRATION_NOT_FOUND' });
    }
    return json(res, 204, {});
  }

  return json(res, 404, { error: `No route: ${method} ${path}`, code: 'NOT_FOUND' });
});

server.listen(PORT, () => {
  console.log(`donna-mobile mock backend on http://localhost:${server.address().port}`);
  console.log(`demo login: ${DEMO_LOGIN.email} / ${DEMO_LOGIN.password}`);
  console.log(`onboarding preview: ${ONBOARDING_LOGIN.email} / ${ONBOARDING_LOGIN.password}`);
});
