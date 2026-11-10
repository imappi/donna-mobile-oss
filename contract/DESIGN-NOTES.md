# Contract design notes — how `mobile-api.yaml` maps onto the Donna runtime

Written during the contract draft (2026-08-26) against the `donna` repo as
read-only reference. Two purposes: (1) prove every schema is designed
against real persisted shapes, not invented; (2) record the places where
the contract wants something the runtime does not express today — those
are **contract-design smells to report to Kari**, not app workarounds.

## The mapping (contract ⇄ Donna runtime)

| Contract surface | Donna seam it projects |
| --- | --- |
| `QueueCard class=ask` | `client_evidence_requests` with `status='open'` (lifecycle `draft→open→replied→resolved/cancelled`; `evidence_type ∈ business_purpose · supporting_document · bank_statement · payment_method`; question text ≤500 chars; linked bank line supplies date/amount/descriptor — `buildFeedItemFromEvidenceRequest`, `firmFeed.js`). |
| `decision type=answer` | `POST …/evidence/requests/{id}/resolve` with `{reply, document_ids}` → status `replied`, reply-recode follows. The topic-turn lane (non-terminal owner turns) is future chat-seam surface, not v1. |
| `QueueCard class=approval` | `outbound_actions` at `status='hold_for_approval'` via `readOwnerActionsSurface().pending` (`action_type`, `describePendingAction`, `holdCopyFor`, `party_name`, amount) plus receivable-case escalations (`needs_input`/`escalated`). |
| `decision type=approve/reject` | `decideOwnerAction` → `approveOutboundAction` / `cancelOutboundAction(reason='owner_declined')`; idempotency mirrored as `{applied:false, already:<status>}` from its `{decided:false, already}` report. |
| `QueueCard class=fyi` | `readOwnerActionsSurface().auto_sent` — decide-and-notify receipts with the quiet corrective verb. |
| `decision type=veto_flag` | `markOwnerAutoSentWrong` (the `reply_if_wrong` verb) → `{marked, marked_wrong_at}`; no action-state change, correction recorded. |
| `needs_you_count` | The badge-law precedent: `entityOwnerCounts` (`entity-owner-inventory.js`) — ONE formula, shared by badge and panel; here it becomes open ask+approval cards, computed server-side. |
| `BooksStatus` / `PeriodStatus` | The period-preview read-model (`buildLedgerPeriodReadModel`): `close_preview.status ∈ ready/review/blocked` (+`unchecked` synthesized for verdict-less months, per `close-action-inventory.js`), kept DISTINCT from the `close_periods.status` lifecycle column (`open/reviewing/closed/locked`) — two vocabularies in Donna, two fields here. Blockers project check rows (`check_type`, counts) into plain language with `on: you|donna` attribution. |
| Upload flow | Donna's 3-step verbatim: `upload-url` intent (same MIME allowlist, same 10 MiB cap) → raw `PUT` → `register` (client-minted ids = idempotent offline replay; `already_exists`/`duplicate_reason` absorbed into `capture_state=duplicate`). |
| `ParseStatus` | `GET …/documents/parse-status` rows verbatim — `parse_status ∈ pending/processing/completed/failed/skipped/duplicate_pending`, `parse_stage ∈ fetching/extracting/writing/enriching/finalizing`, `parse_error.safe_user_message`. Kept as a SEPARATE read because Donna's snapshot deliberately omits stage/progress/error. |
| `retry` / `resolve-duplicate` | `retry-parse` (retryable set = `failed, duplicate_pending`) and `resolve-duplicate` (`create/replace/cancel`) verbatim. |
| `Receipt` | The ApplyReceipt spirit (`operatorContract.js`): per-target `{target, applied, error}` list (ids, never counts), `audit_event_ids`, check report `pass/warning/requires_review/fail` — minus operator internals (facts/examples/model plumbing stay server-side). |
| Chat (`/chat`, `/chat/messages`) | The client portal chat seam (`GET /client-chat`, `clientPortalTurn`/`clientPortalChat.js`). Added 2026-08-26 evening by Kari's call, superseding the "no chat surface" non-goal. |
| Artifact conversation (`/artifacts/{kind}/{id}/messages`) | The persisted transaction/document case-file conversation used by the desktop artifacts (`transaction-chat` / `DocumentChat`). The adapter resolves a queue-card or document reference to the canonical case file server-side. The mobile turn is deliberately non-terminal: queue answers and approvals remain typed decisions with receipts. Added by Kari's 2026-09-02 artifact-detail call. |
| Chat appliable actions (`AppliableChatAction`, `POST /chat/actions/{id}/apply`) | The portal chat's closed appliable-action grammar (`answer_evidence_request`, `record_mileage`), revised into the contract 2026-08-26 (same day, later). Design mirrors Donna's chat-apply spine: the payload and the verb it compiles to stay SERVER-side (one closed enum, one `compile → authorize → audit → execute` path — the app renders label/summary and POSTs apply); every apply returns a `Receipt` (the ApplyReceipt home); a newer Donna message carrying actions supersedes prior available ones (Donna's `chat.proposals_superseded` disarm rule); idempotency mirrors card decisions (`applied:false, already:<state>` — a stale button disarms, it never errors). |
| `POST /mileage` | The `record_mileage` verb (portal chat grammar: miles · date · purpose). |
| Auth | Bearer + refresh, mirroring `firmFetch`'s 401-refresh-retry loop; IdP pluggable (Donna: Supabase; FI fork: its own; mock: demo login). |
| Voice onboarding draft (`POST …/onboarding/voice-draft`) | A new backend adapter seam: completed audio is bounded, transcribed with OpenAI `gpt-transcribe` (or local Whisper in the review mock), and passed as transcript-only input to extraction. The response is evidence plus an editable draft; `processing_mode` prevents a no-engine sample from masquerading as transcription. The adapter retains no raw audio and writes no profile state. |
| Profile confirmation (`PUT …/onboarding/profile`) | The sole writer for reviewed onboarding details. Exact owner and business names require an explicit confirmation marker; the result returns the persisted Principal and Entity plus the standard mutation receipt. |
| Errors | Donna's envelope verbatim: `{error, code}`. |

## Contract-design smells (report to Kari — the contract wants it, the runtime can't say it yet)

1. **Ask choices.** The app spec calls for choice-chip answers ("Business /
   Personal"). Donna's ask pipeline has NO choice shape — asks are free
   text + optional upload (`buildAskMessageSchema` has no options field).
   The contract carries `choices` as optional; Donna would need to draft
   choices at ask-mint time to use it. Until then its asks render as
   text+photo answers, which the contract fully supports.
2. **The owner-answer verb emits no receipt.** `answer_evidence_request`
   is registered `emitsApplyReceipt: 'none'` in Donna's mutation registry
   — the one owner-facing mutation without a receipt, exactly the gap the
   contract's mandatory `Receipt` exposes. Donna-side fix, not app-side.
3. **`capture_state` is a projection Donna doesn't persist.** The owner
   vocabulary (received/processing/attached/needs_info/failed/duplicate)
   derives from `parse_status` + open doc-anchored asks + duplicate rows.
   Cheap server-side; the app must NOT compute it (terminal rule).
4. **`needs_you_count` needs an owner-scoped queue read.** Donna's feed is
   firm-wide (`buildFirmFeed`) with the owner projection layered on
   (`presentFeedBuckets`/`entityOwnerCounts`); serving one entity's queue
   cards + badge as a single read is a thin adapter over existing pieces.
5. **Push registration.** Donna has no push infra (nudges are email
   today). The endpoint pair here is the seam it will need; FI push infra
   is its own deferred decision (README).
6. **Mileage units.** Donna's `record_mileage` action carries `miles`
   only; the contract carries an explicit `unit (km|mi)` because the ICP
   is metric-first. The km→mi conversion belongs in the backend adapter,
   never the app (terminal rule).
7. **Plain-language blocker labels.** The period read-model's checks are
   codes + counts; the plain-language `label` with `on: you|donna`
   attribution must be rendered server-side (render-the-persisted-verdict:
   the phrasing table belongs next to the verdict, not in the app).
8. **The runtime has multiple artifact conversation entry points.** Desktop
   transaction and document artifacts already persist comments and turns, but
   there is no single owner-scoped resolver from a mobile queue-card/document
   reference to that canonical case file. The artifact-message endpoint is the
   contract seam for that thin server adapter. Mobile must not route these
   turns into entity-wide chat or maintain a local parallel thread while the
   adapter is absent.
9. **Donna has no canonical business-profile aggregate yet.** The optional
   `Entity.business_profile` projection and its onboarding writer are the
   contract seam the runtime needs. Until an adapter owns that shape, the mock
   is review scaffolding only; mobile must not invent or separately persist a
   profile.

## Deliberate contract choices (argued, settled)

- **Amounts are JSON numbers in major units** — mirrors Donna's own wire
  shapes (`money_in`/`money_out`, `match_amount`). A decimal-string
  encoding was considered and rejected: the terminal renders, it never
  does arithmetic, so display fidelity is the only requirement and
  `Intl.NumberFormat` consumes numbers.
- **Business dates are `format: date` strings, timestamps carry offsets.**
  The month-off-by-one serialization bug class is closed at the contract
  level; `core/i18n/formatDate` parses plain dates as local, never via
  `new Date(iso)`.
- **The decision enum is four verbs, closed** (`approve/reject/answer/
  veto_flag`) — the same closed-action-enum invariant every Donna surface
  obeys. Draft-editing (Donna's `editHeldOutboundActionDraft`) is
  deliberately NOT in v1 mobile; desktop has it.
- **Card ids are canonical identities** (`source_kind:source_id`),
  borrowed from `projectEntityOwnerInventory` — stable across reads,
  provenance-carrying, dedupe-safe.
- **The push payload rides the ActivityEvent vocabulary** (added
  2026-08-26, with the registration wiring): a push is `{title, body,
  data.deep_link}` where `deep_link` is exactly the ActivityEvent
  shape — one mapping (`src/state/deepLink.ts`) decides where both an
  Activity row and a notification tap land, so they cannot drift. Two
  server-side expectations recorded with it: the backend upserts a
  registration on (principal, token) rather than growing one per app
  start — the app registers on every sign-in, even with an unchanged
  token, so the backend covers businesses the owner gained since; a
  repeat answers the same id and writes nothing when nothing changed
  (the mock does exactly this); and tokens are pruned on the Expo push
  receipt error, not trusted forever.
- **Voice onboarding is draft-first and non-terminal.** The device records
  only after an explicit microphone action and uploads only a completed file.
  The backend owns the OpenAI key, transcription, schema-constrained
  extraction, bounds, and raw-audio disposal. Only the visibly reviewed PUT
  can change profile state; a failed, cancelled, or interrupted recording
  cannot write anything.
## Mobile refinement read models — 2026-09-06

Optional `context_label` and `presentation` on queue cards/documents carry
backend-authored compact copy, invoice lines and document evidence. Optional
ChatMessage `figures` and `attachment` carry structured values, never inferred
by the renderer. Old payloads still render without these fields.

`Receipt.at` timestamps the activity; actor attribution now permits Donna/backend
as well as owner/mobile so automatic sample receipts cannot falsely claim owner action.

`approve_card` is a typed chat proposal, not a new decision verb. It goes through
the existing approval decision path, preserves business dates, records the receipt,
and refuses duplicate/stale execution. Comments remain non-terminal.

`GET /entities/{id}/reviews/{taxes|month}?period=YYYY-MM` is a forward read seam.
The opt-in mock returns `source: sample`; ordinary/onboarding books return
`not_configured` with no invented figures. Review actions only navigate to Chat
or an existing queue card. They never file, pay, remind, or send externally.
Backend-provided `review_navigation` reveals these preview destinations from Status.
An external adapter must implement this shape before any production activation.

The app Status route is `/books-status` because Metro reserves `/status`.
Native historical `/status` links redirect; server API `/entities/{id}/status`
is unchanged.

## Mobile Settings seam — 2026-09-07

`GET/POST /entities/{id}/settings` provides settings read state and exactly
two closed mutations: `set_vat_period` and `set_notifications`. The former
records an owner-declared period, not a tax-registration change; the latter
records per-owner/per-book preferences, not delivery capability. Writes
return state plus a receipt. Invalid fields/actions and out-of-scope entities
are rejected; neither mutation changes queue classifications or badge counts.

The mock implements this seam in memory for design review, explicitly
`source: sample` and `notification_delivery: not_configured`. Values survive
navigation, reload and login until the mock restarts. Unknown financial-year
dates, statements and verified phone numbers are null, never inferred.
Donna's production backend still needs an authenticated, owner-scoped adapter
and durable storage before this seam is production-ready.

Business edits reuse the existing explicit profile confirmation endpoint;
registry reads only stage a candidate until explicit confirmation. Manually
supplied sole-trader details remain separate from registry-sourced identity.
No new authority is granted by either operation. Deletion reuses the existing
request endpoint and renders acknowledgement, not a completed account deletion.

Locale, biometric preference and device notification opt-in live in versioned
on-device storage, not the books. Only explicit notification opt-in may prompt
the OS. The category switches do not imply the mock can deliver notifications.

There are no new bank, Suomi.fi mandate, accountant-invite, phone-change or
export writers. Their screens disclose unavailability and cannot emit a fake
connected/sent receipt. Future adapters must define typed authority, actual
capabilities, expiry, error handling and receipts before enabling these CTAs.
