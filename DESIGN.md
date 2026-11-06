# DESIGN.md — what Donna looks and sounds like on a phone

> **A calm tool for a stressed person with a receipt in one hand.**

This file is the written design language for `donna-mobile`. Together with
`core/design/tokens.ts` (the same language as code) it is **law for every
future session**: screens are built only from primitives, primitives are
built only from tokens, and tokens change only by a dated decision recorded
here. If a screen needs something the language cannot say, that is a design
decision to flag to Kari — never a special case to improvise.

Status: **FOUNDATION APPROVED 2026-08-26. SHELL V2 DIRECTION APPROVED
2026-09-02.** The language and rails are binding. Books is not CANONICAL until
Kari reviews the matching shell-v2 native capture and that approval is
recorded in §12.

---

## 1. Provenance and authority

**2026-09-05 — progressive business setup approved:** following the editable
business-card review, Kari approved optional Finnish business enrichment after
landing in the app. Books may show one dismissible, backend-selected suggestion;
Account settings keeps a recovery entry. No new onboarding gate, completion
meter, task badge or dashboard is introduced. Legal identity remains separate
from the spoken business card. Existing primitives and quiet working-screen
surfaces apply. The Button primitive gains a checkmark and preserves the caller's
radio accessibility role for business-form selection. See
`design/PROGRESSIVE-BUSINESS-SETUP.md` for scope and prototype limits.

This language is a **transcription, not an invention**. It is extracted from
the Donna desktop design system (the D system) in the `donna` repo, read as
a read-only reference on 2026-08-26:

- `src/components/shared/design-tokens.js` — the D system: palette, type
  doctrine, scale, texture rules. That file is the spec; this file adapts it
  to mobile and records every adaptation in §10.
- `src/components/shared/buttons.js` — the one-button law.
- `src/components/shared/bank-feed-list-style.js` — the list-system source
  of truth: row rhythm, column grammar, dot geometry.
- `src/components/shared/feed-list.jsx` — bucket grammar, dot semantics,
  three-voice calm, decision-grain grouping.

Dated calls carried forward (they bind here exactly as they bind on desktop):

- **2026-07-28 (Kari):** white + black + the sunset accent used subtly. D has
  no green, no amber, no violet. Oatmeal is removed from the product.
- **2026-08-05 (Kari):** three-voice calm — labels render in ink, the dot
  carries the voice, one loud element per screen. Identity is ink, never hue.
- **2026-08-07 (Kari):** the one-button law — button style must not vary.
- **2026-08-08 (Kari):** the two-voice type doctrine — the system face is the
  app's ~98%; mono is the machine voice only; serif is OUT of the app; the
  brand keeps the expressive faces.
- **2026-08-07 (Kari):** the decision is the unit, not the transaction —
  rows sharing one question collapse into one group row.
- **2026-08-26 (Kari, standing surface rail):** one cohesive list grammar
  with nuanced differentiation; activating an item opens THE work surface
  (list → detail, one surface, not panel sprawl); no webby controls bolted
  onto lists.
- **2026-08-26 evening (Kari, the Buzz-reference review):** the first
  build read too plain — "2026 consumer vibes" bind. Three rulings:
  (1) the desktop shell's sunset-gradient ground carries to mobile
  (supersedes §10.6's "does not carry over"); (2) the shell chrome is a
  floating pill menu — **Actions / Materials / Chat** — plus a visually
  distinct ink **+** button opening the capture menu (snap a receipt /
  add a file / log mileage); (3) Chat becomes a main destination
  (supersedes the v1 "no chat screen" non-goal; the typed action grammar
  in chat remains future work).
- **2026-08-26 later (Kari, Donna-launcher refinement):** keep the three
  destinations and replace the detached ink **+** with the Donna mascot as
  the third dock control (labelled Chat). Tapping Donna opens one launcher
  above the dock: **Chat with Donna / Snap a receipt / Add a file / Log
  mileage**, in that order. This supersedes only the separate-FAB clause
  above. Candidate pixel geometry lives in `design/MOBILE-SHELL-V1.md` and
  is not canonical until Kari approves the reference frames.
- **2026-09-02 (Kari, desktop single-list carryover + Claude Code mobile
  reference):** “lets go” on shell v2. Delete the three-destination bottom
  dock and keep Donna as the sole persistent bottom control; preserve her
  four-action launcher. Delete the enclosing white list sheet and render one
  date-stable stream as individual white cards on the quiet canvas. Type and
  persisted state live on every card; state is never navigation, a filter, or
  a section. `design/MOBILE-SHELL-V2.md` is the binding record and supersedes
  shell v1's information architecture.
- **2026-09-02 (Kari, native shell-v2 follow-up):** the sunset is one
  continuous golden-to-warm-white full-screen ground, with no grey canvas cut
  below the header. Replace the bell with an owner burger menu; an alert-red
  dot reflects the backend's existing positive `needs_you_count`. The menu
  holds Activity, conditional book switching, Account settings, and Sign out.
  Keep every card's state pill vertically centred at the right edge and move
  amount into the smaller factual metadata line. This dated call supersedes
  shell v2's earlier paperDeep canvas, sticky month, trailing amount, and
  accessibility stacking clauses.
- **2026-09-02 (Kari, compact item follow-up):** Books card titles become a
  one-line, one-to-three-word context label, preferring the persisted party
  and never printing a raw filename. The 46pt icon tile equals the standard
  two-line copy block and uses low-chroma gold/peach/rose grounds from Donna's
  sunset family. These pastels carry context only; the state pill remains the
  sole state color. Large Dynamic Type may use two text lines per copy row.
- **2026-09-02 (Kari, quiet-list follow-up):** delete the aggregate
  needs-input/processing row from Books; it duplicates item state and the
  burger's attention dot. Status remains available inside the owner menu.
  Stream cards get a barely-there 7% ink shadow, and state pills use 12pt
  labels with 8×4pt internal padding.
- **2026-09-02 (Kari, artifact-detail follow-up):** the selected item is the
  mobile face of the same persisted Electron artifact, not a standalone
  approval form. Use one compact sticky header, one continuous context /
  conversation / receipt reading flow, and a bottom item-bound “Ask or
  comment…” composer. Typed answer, approval and correction controls stay
  visibly distinct from non-terminal conversation turns. Queue cards and
  backend documents share this shell; context varies, interaction grammar
  does not. `design/ARTIFACT-DETAIL-V1.md` is the binding record.
- **2026-09-03 (first-run onboarding v1):** a clean install gets one welcome
  moment before the existing sign-in/demo door. It teaches receipt/file
  handoff and owner-only quick actions in the single Books stream; restored
  authenticated sessions always bypass it. The brand sunset is permitted only
  as the full-screen welcome ground, never as a card or working-surface
  treatment. `design/ONBOARDING-V1.md` is the binding record.
- **2026-09-03 (Buzz onboarding reference pass):** first-run uses one centred
  mascot/copy/action focal stack on the uninterrupted golden sunset field,
  with compact copy, generous negative space, and one ink pill. The Buzz
  dotted texture, pairing/QR mechanics, progress chrome, biometric prompt,
  and secondary action are reference content, not Donna semantics, and do not
  carry over. The supplied captures live under
  `design/references/buzz-onboarding/`.
- **2026-09-03 (Finland phone onboarding follow-up):** the welcome now leads
  through a Finland-only **+358** mobile number, an explicit six-digit code
  confirmation, and a first-name question before opening a genuinely empty
  Books account. The review seam accepts only `111111`; it sends no SMS and
  must not be mistaken for production authentication. Empty Books gives one
  direct **Snap a receipt** action, which opens camera capture without first
  opening Donna's broader launcher. `design/ONBOARDING-V2.md` is the binding
  record and supersedes only onboarding v1's email/demo handoff. It does not
  make Books canonical.
- **2026-09-03 (optional voice introduction):** after the first-name step, one
  skippable choice offers voice or typing before empty Books. Voice records
  only after an explicit microphone action, uploads one completed foreground
  recording, and produces transcript-backed editable notes. No profile field
  is saved until the owner checks the exact names and taps the sole confirm
  action. `design/ONBOARDING-VOICE-V1.md` is the binding record for this branch.

When this file and the desktop tokens ever disagree, the desktop file plus
the most recent dated call wins; reconcile deliberately, in a commit that
says so.

**2026-09-05 onboarding refinement (Kari):** onboarding uses the desktop's
soft golden/cream/peach ground, with no saturated red band. Phone → code →
microphone replaces the separate name and business-choice questions. The
microphone is the only primary action on entry; typing is a quiet text action.
`MicrophoneButton`, `Button kind="text"`, and `Input variant="onboarding"`
extend the shared primitives for this purpose. Onboarding fields use rounded,
subtly recessed surfaces. A completed introduction opens fluent, full-length
notes with editable details; raw speech recognition is secondary evidence.
`design/ONBOARDING-V3.md` supersedes the earlier onboarding steps and palette.

**2026-09-05 name-cleanup follow-up (Kari):** correct safe typography in the
introduction and name fields. Genuinely uncertain spellings carry a quiet
text hint on the existing review screen, never a new step or blocking alert.
The backend supplies recognition confidence; exact names still require the
existing explicit confirmation before saving.

**2026-09-05 business-card approval (Kari):** “perfect! lets go” on the
editable badge-inspired business card. The review renders fixed structured
facts, not a cleaned first-person transcript. `BusinessProfileCard` is a
shared onboarding-only primitive: warm ivory, a muted gold edge/monogram,
subtle depth, one edit action and one confirm action. This narrowly supersedes
the no-gradient-card / no-tinted-identity rules in the brand-register review;
working screens are unchanged. No credential claims, QR codes or decoration
that implies verification. Optional missing facts are absent, uncertainty
stays next to the affected fact, and the editor and confirmation use the
same values. The Finland-only reference onboarding now uses Finnish strings;
working-screen localization remains incomplete. See
`design/ONBOARDING-BUSINESS-CARD.md` for scope and verification.

---

## 2. The person, and the register

The user is a micro-entrepreneur with a receipt in one hand and thirty
seconds between real work. They did not choose bookkeeping; they chose not
to think about bookkeeping. Every design decision serves that:

- **Calm.** Paper, ink, one warm accent. Nothing pulses, shimmers, or
  celebrates. The app's emotional promise is *"this is handled."*
- **Fast.** A receipt in, a decision out. The capture button is big, the
  queue is short, the answer paths are one thumb long.
- **Obvious.** Zero accounting jargon on screen. "What was this charge?" —
  never "uncategorized transaction requires classification." Plain language
  is a design token as much as any color.

**How Donna sounds** (the copy half of the language):

- Done things use a **done-not-pending grammar**, muted: "Filed under
  travel." — not "Donna has categorized this transaction!" No exclamation
  marks, no self-congratulation, no "insights."
- Corrections use **quiet corrective verbs**: "This was wrong" — offered,
  never begged. Donna is confident without being loud about it.
- Questions ask for **one fact, in the owner's words**: "Was this lunch
  business or personal?" One question per card. Never two.
- Raw enums, internal statuses, and sentence-length machine reasons never
  reach the screen (the desktop already paid for this bug: humanize at the
  display layer, keep the persisted verdict untouched).
- Amounts are written like a bank writes them: tabular figures, minus sign
  `−`, no color-coding of negative as red (parentheses/sign carry it;
  `alert` is reserved for genuine failure, not for "money went out").

---

## 3. Color — paper + ink + one warm accent

The palette is the D system's, OKLCH-sourced, transcribed to sRGB for
React Native (§10). Three levels of ground, one accent, one alarm:

| Token | Source (OKLCH) | Mobile value | Role |
| --- | --- | --- | --- |
| `paper` | `oklch(0.994 0.004 95)` | `#FEFDFA` | The screen ground. Bright warm off-white ("tokyo white") — a whisper of chroma so it never reads grey. **Raising the chroma is heading back to oatmeal; don't.** |
| `paperDeep` | `oklch(0.975 0.004 95)` | `#F7F7F4` | Recessed wells, grouped-list troughs. |
| `card` | `oklch(1 0 0)` | `#FFFFFF` | Containers. Cards are PURE white and pop off paper — never outlined flat on it. |
| `ink` | `oklch(0.08 0 0)` | `#020202` | Text, full voice. |
| `inkSoft` | ink @ 72% | rgba | Secondary text. |
| `inkMute` | ink @ 48% | rgba | Tertiary/meta text, quiet states. |
| `rule` | ink @ 15% | rgba | Hairlines. |
| `ruleSoft` | ink @ 8% | rgba | Whisper hairlines. |
| `accent` | `oklch(0.72 0.12 65)` | `#D8944D` | THE warm accent. "Your move." One per screen. |
| `accentWash` | accent @ 14% | rgba | Chip/badge ground for the accent voice. |
| `alert` | `oklch(0.45 0.13 25)` | `#90302E` | Deep brick. Genuine failure only. |
| `alertWash` | alert @ 10% | rgba | Ground for the alert voice. |

**The accent-vs-alarm decision rule** (the only color decision a screen is
ever allowed to make): is this element *the user's move* (→ accent), *a
genuine failure* (→ alert), or *anything else* (→ ink at full/72%/48%)?
There is no fourth answer. No green for success — settled states are quiet
ink, because in this product success is the default, not an event. No amber
for warning — a thing either needs the owner (accent) or it doesn't. No
violet, no "AI shimmer" — Donna's intelligence shows in the work being
done, not in a hue.

---

## 4. Type — two voices

- **The UI voice is the system face** (SF on iOS, Roboto on Android),
  `fontFamily` left unset. Deliberately not a designer font: the system
  face reads as software, and hierarchy comes from size, weight, and
  spacing — never from switching typefaces.
- **Mono is the machine voice only.** The rule, so it cannot drift: mono is
  for what you would paste into a bug report — ids, receipt hashes, model
  ids. Money is NOT machine output: **amounts align through tabular
  numerals in the UI face** (`fontVariant: ['tabular-nums']`), never
  through a face swap. Accounting ≠ monospace.
- **Serif and display faces are brand-only** (onboarding moments, emails,
  the App Store page). They do not appear inside working screens.

**The scale** (transcribed 1:1 from the D scale, rem → dp; the desktop
migration already established these steps — do not invent sizes between
them):

| Step | dp | Use |
| --- | --- | --- |
| `micro` | 12 | Floor for machine caps/eyebrows and compact state pills. Never body. |
| `xs` | 13 | Chips, badges, dense meta. |
| `sm` | 14 | Secondary text. |
| `base` | 16 | **BODY FLOOR.** Nothing carrying a sentence the owner must read goes below it. |
| `md` | 18 | Emphasised body, lead-ins. |
| `lg` | 21 | Card values, section headings. |
| `xl` | 26 | Panel titles. |
| `xxl` | 32 | Screen titles. |
| `xxxl` | 40 | Hero figures ("€1,240 waiting on you"). |

Leading: body 1.5, mono 1.2. Mono caps track at 0.18em. Weights carry
hierarchy: 400 body, 500 emphasis, 600 headings/primary buttons — nothing
heavier; selection and importance are carried by ink and background, never
by bolding contests.

---

## 5. Buttons — the one law

Three voices, one geometry (transcribed from `buttons.js`):

- **`btnPrimary`** — the ONE loud action on a surface: ink pill, paper
  text, weight 600. One per screen, and it is the screen's verb ("Send
  answer", "Approve"). If two actions feel primary, the screen is wrong.
- **`btnChip`** — everything else clickable: quiet hairline chip,
  transparent ground, soft ink, weight 500.
- **`btnDisabled`** — the primary's resting/blocked state: hairline, muted
  ink, no press feedback.

Shared geometry: pill radius, 7×14 padding around a compact label. On
mobile every button's **hit target extends to ≥44dp via hitSlop/minHeight,
never by inflating the visual** (§10). Destructive confirmation is
`btnPrimary` recolored to `alert` — allowed only inside an explicit
confirmation step, never on first tap.

---

## 6. The list grammar

Lists are the product. One grammar everywhere, nuance inside it — never a
sibling design per screen (Kari's 2026-08-26 rail).

**Row anatomy** (from the Bank Feed source of truth): edge-anchored status
dot · content · right-aligned figures/state. A hairline (`rule`) under
each row; text columns inset 16dp; the dot and any trailing pill terminate
on the row edge so the list has equal anchors left and right. This remains
the grammar for secondary/detail lists.

- **The dot carries the voice.** 7dp, round. Filled `accent` = your move.
  Hollow (1.5dp `inkMute` border) = not blocking you. Filled `alert` =
  genuine failure. There is no other dot state.
- **Identity is ink, never hue.** An entity tag is a quiet machine-voice
  chip on a 4% ink wash — never a tinted pill, never one-color-per-entity.
- **Dates and amounts are tabular** and right-anchored; the primary cell
  ellipsizes, figures never do.
- **Section headings** (UI face 13/600 ink) carry a dot, a plain label, and
  a muted tabular count. Labels answer *"whose move?"* in the owner's
  words: **Needs you** · **Waiting on others** · **In Donna's hands** ·
  **Recently handled**. Donna's own workload and the audit trail start
  collapsed — the owner never scrolls past machine work to find their own.
- **Three-voice calm:** labels render in ink, the dot carries the voice,
  and only the top "your move" section speaks accent. One loud element per
  screen — the section that needs the thumb.
- **Empty sections** are absence-of-data states in the same inset and type
  as a real row ("Nothing waiting on you") — not cards, not illustrations,
  not celebrations.
- **Decision-grain grouping:** twenty rows sharing one question are one
  expandable group row with a count and a sum, members indented one step.
  Grouping keys off persisted fields only — no merchant heuristics on the
  device (the terminal rule).

**List → detail is THE work surface.** Activating a row opens the one
place where that item is read, answered, approved, or corrected — a full
detail surface, not a popover, not an inline accordion of controls, not a
swipe-action buffet. No webby controls bolted onto lists. Swipe gestures
may exist later only as shortcuts to the same typed decisions, and only by
a dated call.

**Primary Books amendment — shell v2, 2026-09-02.** The primary list uses
the same information hierarchy inside individual 16pt-radius white cards on a
continuous sunset-to-warm-white ground: warm-pastel contextual glyph tile ·
one-line one-to-three-word context title · factual type/date/optional amount metadata · one vertically-centred
right-edge state pill. Needs input is accent, Stalled is alert, everything else
is quiet. Cards replace both state sections and the enclosing white sheet.
Calendar month is the only visible boundary and is not sticky. This amendment
does not change secondary/detail list rows.

---

## 7. Texture, gradient, and the two registers

- **The working register**: the sunset GROUND (tokens `ground` — warm gold
  living in the top third, landing on paper where content sits), pure-white
  cards and chrome floating on it, ink, the flat accent. The ground is
  ground, not a "gradient moment" — the scarcity rail still governs painted
  accents, and the full-strength sweep stays brand-only. (Amended
  2026-08-26 evening; the earlier "flat paper, zero gradients" clause is
  dated history.)
- **The brand register** (onboarding, empty first-run, the App Store, and
  nothing else): the sunset family — gold → orange → brick — and the
  editorial faces may appear, sparingly. The full-strength sunset sweep is
  the brand's signature, not the app's chrome. Never mix the registers.
- **Grain/noise texture** is deferred on mobile (§10) — v1 surfaces are
  flat. If it ever arrives, it arrives in the brand register only.

---

## 8. The queue's visual law

The queue doctrine (three card classes, backend-decided) has a visual half,
and it is design law:

- **Asks** and **Approvals** are the accent voice: filled accent dot, they
  count toward the badge, their primary action is a `btnPrimary`.
- **FYI receipts are the done voice:** muted, dot hollow, done-not-pending
  grammar, corrective verbs as quiet chips ("This was wrong"). **An FYI
  never renders an Approve button and never counts toward "needs you."**
  If the backend sends a confident decision as a pending approval, the app
  flags a backend bug — it does not render the card prettier.
- The badge number is the backend's number. The app never computes its own
  (two counts one screen apart teach the user to trust neither).
- A capture's document states render in the same three voices: processing =
  quiet ink, needs-info = accent, attached = settled ink, failed = alert.

---

## 9. Screens may only compose primitives

Built once from tokens, in `core/design/`: **Screen, Card, ListRow,
SectionHeader, Button, StatusPill, EmptyState, Toast, Txt, Dot** — plus
the extensions made during the build, each flagged for Kari's
review: **Input** (sign-in, ask answers, the chat composer), **Stack/Row**
(the only sanctioned layout glue in screens; gaps come from the spacing
scale by name), **Button `size="large"`** (a screen's one big verb),
**Ground** (the sunset shell ground), **FloatingDonnaButton/DonnaMenu** (the
shell-v2 floating chrome — Kari's 2026-09-02 call; the three-tab dock is
deleted), **OwnerMenu** (the top-right app/account navigation),
**StreamCard/PeriodHeader** (the primary Books
grammar), and **MascotOrb** (Donna in person — her mascot on the sunset orb,
used by the chat identity row and floating control). The set may grow only
by extending this list, which is a design decision, flagged. Screens
import primitives and tokens — nothing else visual. CI enforcement: an
ESLint rule fails the build on literal hex colors, ad-hoc
fontSize/margin/padding numbers, or inline style objects outside
`core/design/`. If a screen needs something a primitive cannot do, extend
the primitive for everyone — never special-case the screen.

---

## 10. Mobile adaptations — recorded, not smuggled

Every place this transcription had to differ from the desktop spec, listed
so nothing drifts silently:

1. **OKLCH → sRGB hex/rgba.** React Native's color parser does not accept
   `oklch()` strings. Every color token carries its OKLCH source in a
   comment; the OKLCH value is authoritative, the hex is derived (standard
   OKLab→sRGB transform, clamped to gamut).
2. **rem → dp, 1:1.** The desktop scale honors browser font settings via
   rem; mobile honors the OS setting via RN's font scaling
   (`allowFontScaling` stays ON; layouts must survive Dynamic Type). The text
   primitive scales its explicit line-height alongside native glyph scaling;
   otherwise iOS clips large Dynamic Type inside an unscaled line box.
3. **System face instead of a shipped font.** The 2026-08-08 doctrine
   already points here. Machine voice is Menlo (iOS) / `monospace`
   (Android); shipping JetBrains Mono later is an open option (§12).
   DM Sans / Inter are not shipped at all.
4. **Touch targets:** every interactive element hits ≥44dp via
   hitSlop/minHeight without inflating the visual geometry. List rows get
   a 48dp minimum height (desktop rows are mouse-height).
5. **Press states instead of hover.** The desktop's hover tint becomes a
   pressed-state tint: card-white for row activation, 4% ink wash for
   chips — same values the desktop system already owns.
6. **Panels-on-ground CARRIES OVER — reversed by Kari, 2026-08-26
   evening.** Mobile screens sit on the sunset ground (tokens `ground`),
   at a strength between the desktop whisper and the landing gradient so
   it reads on a phone; white cards and the floating chrome pop off it.
   The original "phone screens sit directly on paper" clause is dated
   history.
7. **Grain/noise textures deferred.** SVG-filter data-URIs don't apply in
   RN; reproducing grain needs an asset or shader. Deferred; brand
   register only if ever.
8. **No dark palette exists in the D system.** v1 is light-only — calm
   paper is the identity. A dark transcription is a design decision that
   does not exist yet and must not be invented per-screen (§12).

---

### 2026-09-06 — Onboarding v4 handoff

Kari supplied the Claude Design `design_handoff_onboarding_v4` reference and
approved its optional post-card notification introduction. The app now uses
the left-aligned 24pt-inset onboarding register, 34/38 welcome and 32/36 title,
17/24 lead, 56pt primary pill, 64pt phone/code fields, 104pt microphone, three
speaking cues, inline card editing, and a quieter first-receipt invitation.
These are named primitive/token extensions; working-shell geometry is unchanged.
13pt notes and 15pt quiet controls are onboarding exceptions, retain native text
scaling and 44pt control hit targets, and follow the supplied tone per element.
Motion respects Reduce Motion. Supplied mascot assets are reused without a ring.

The reference is design provenance, not authority to simulate product outcomes.
SMS remains explicitly a preview with code 111111. Processing waits for the real
API response, without timed fake milestones. Notification permission is requested
only by Allow; skipping, denial and unsupported runtimes enter Books. No Terms or
Privacy acceptance statement or links appear: Kari has no URLs yet. The first-run
Books setup suggestion waits for backend eligibility after the first capture;
Account retains access to optional business details. See `design/ONBOARDING-V4.md`.
Native captures remain candidates for Kari's visual approval, not CANONICAL.

### 2026-09-06 — Onboarding v4 screen-by-screen fidelity pass

Kari explicitly requested a 1:1 pass after comparing the first port with the
handoff. This supersedes the first port's rewritten copy, uniformly softened
notes, and approximate spacing. Finnish and English reference copy is locked by
regression tests. The approved omissions remain legal acceptance/links (no URLs)
and the normally hidden development code hint. The optional notification screen
remains included.

Named extensions: **OnboardingCodeHeading** (inline underlined number-change
link), **OnboardingIcon** (reference SVG paths), **OnboardingProgress** and
**OnboardingChecking** (indeterminate status), **OnboardingPermissionNote**
(inline denial), and per-page **OnboardingLayout** geometry. Shared input, card,
mascot, cue, recorder, notification and first-receipt primitives carry their
specific dimensions rather than screen-local styling.

The phone prefix is a fixed 88pt; its 64pt field has a 1pt light border and no
dark focus ring. Code cells are 64pt high with 8pt gaps, 14pt radii, and a 1.5pt
active border. Both use inset shadows, not a raised outer field shadow. The
primary pill is 56pt (52pt on the first-receipt card); footer actions have a 6pt
gap and keyboard clearance is 16pt. Card identity editors use 52/48/48pt heights,
12pt radii and a flat white fill, without permanent form labels.

CSS shadow definitions are represented by boxShadow. Gradient endpoints account
for physical aspect ratio, preserving the reference's 170-degree card and
145-degree mascot orb angles. The note face is 13/18; inherited 1.55 line-height
is preserved for 13/20.15 metadata and 15/23.25 microphone labels. Onboarding web
text uses the reference system-font stack, antialiasing and pretty wrapping;
iOS uses native standard line breaking. Native glyph metrics, OS keyboards and
permission dialogs remain platform-owned, not pixel-for-pixel web imitations.

The card's basic Edit view matches the three identity inputs. Tapping a displayed
fact opens the full editor, including optional facts and original evidence.
Confirmation saves the values currently displayed, even while editing.
The first-run Books content follows the handoff on the brand ground; existing
working header/menu/dock geometry stays unchanged as the handoff requests.

See `design/references/onboarding-v4/fidelity/README.md` for captures, exact
verification coverage and the production-copy caveat.

### 2026-09-06 — Populated Books review

The existing single stream is reviewed with the backend's invented sample
businesses, now carrying calendar-anchored history for the previous two months.
No hero, filter, state group, balance dashboard, or new decorative asset is added.
The header, state pills, white cards, golden ground, and Donna launcher retain
the shell-v2 grammar.

Named primitive extension: **StreamCard** factual metadata can wrap independently
from the amount. An amount must not disappear into an ellipsis after the date;
it remains tabular, in the metadata lane, while the state stays right-centred.
`stream.metaColumnGap` and `stream.metaRowGap` record the spacing. Compact titles
still use the existing one-line policy, with the full context available on tap.

Failed reads show a retry state, never the first-receipt invitation. A partial
refresh preserves available records and states that the data may be stale.
Finnish labels cover Books, its launcher, business switcher, and core item
interactions; missing translations elsewhere retain the established English fallback.
Only backend identities suppress duplicate documents. Only the backend determines
accounting state, close blockers, and the attention count.

Review captures and the isolated sample entrance are recorded under
`design/screenshots/home-seeded/README.md`. This is a reviewed implementation
candidate, not a new CANONICAL approval.

## 11. The forbidden list

Gradient hero cards · purple-blue "AI" shimmer · emoji in UI chrome ·
"insights"/analytics widget energy · dashboard-template layouts ·
decorative illustrations · skeleton screens that pulse · celebratory
confetti · green/amber/violet in any working screen · tinted identity
pills · mono for amounts · a second primary button · counts computed on
the device · any component that exists to look impressive in a screenshot
rather than to move a receipt or a decision.

**When in doubt: remove, do not add.**

---

## 12. Open decisions — Kari's, not a session's

1. **Dark mode:** ship v1 light-only (recommended — calm paper IS the
   identity), or commission a dark transcription of the D system as its
   own dated design pass?
2. **Taste anchors:** Buzz onboarding is the first named, supplied anchor and
   is recorded under `design/references/buzz-onboarding/`. Additional Donna
   desktop captures plus apps Kari names may extend the set; presence remains
   provenance, not automatic approval or permission to copy product mechanics.
3. **Machine-voice face:** platform mono (current) vs shipping JetBrains
   Mono for brand continuity of receipts/ids.
4. **CANONICAL screen:** Books shell v2 is the candidate. Once Kari approves
   its native capture it is marked CANONICAL here, and every later screen
   must be visually derivable from it.
5. **Shell-v2 native approval:** review the Books and launcher captures under
   `design/screenshots/shell-v2-native-ios/` at 393×852pt. The v1 references
   remain dated provenance; Books becomes CANONICAL only after Kari explicitly
   approves the v2 runtime capture.
## 13. Working-screen refinement — 2026-09-06

Kari requested the supplied “Mobile app onboarding refinement” handoff 1:1.
This dated direction supersedes the earlier black secondary launcher rows,
large Chat page header, enclosing working panels, and tiny detail decisions.
It is an implementation candidate, **not a new CANONICAL visual approval**.

- Working ground: one vertical four-stop sunset, no diagonal glow. Onboarding
  keeps its existing v4 ground and copy; the supplied onboarding file was unchanged.
- Books: borderless 16pt white cards, 17/24 context labels, 22pt state pills,
  exact reference icon strokes, 12pt tracked eyebrow, and a 12pt outlined attention dot.
  The native calendar separator normalizes the prototype's flex-shrunk heading
  plus inter-item gap to 40pt. Long real names/amounts wrap rather than disappear.
- Launcher: four white 60pt rows, 16pt radius, 17pt regular labels and reference icons.
  All previous navigation/capture behavior and overlay accessibility remain.
- Item details: 62pt compact header, 24pt context card, invoice evidence and 132pt
  document placeholder, 26pt pill, 48pt decision controls, mini Donna turns and
  quiet timestamped receipts. Context opens at the top. The reading viewport
  ends above the dock so no conversation leaks beneath the controls.
- Chat: 70pt identity header, no duplicate Donna launcher, 54pt composer;
  backend-provided figures, document references and 36pt action chips.
- Status, Taxes and Month: the same compact header and 16pt white report blocks;
  no charts or invented device-side counts. Status uses the actual backend
  blockers and calendar periods, not the handoff's illustrative counts.
- Three lunch choices are an opt-in sample fixture. Other questions retain
  whatever text, photo and choice capabilities their backend supplies.

Explicit fidelity exceptions: invented existing business identities replace
reference counterparties; financial claims and automatic expense classification
are not copied as advice. Tax/Month copy is visibly sample-only and read-only.
Comments never answer an ask; processing remains processing until the backend
confirms it. Reference receipt/photo placeholders remain placeholders, not invented
receipt images. No fake legal links or new permission prompts are introduced.

See `design/verification/2026-09-06-refinement/README.md` for captures, interaction
checks, and the native-verification limitation caused by the locked desktop.

## 14. Full-screen Settings refinement — 2026-09-07

Kari requested the supplied “Mobile app onboarding refinement 2” settings
handoff in a fresh worktree. The burger now opens full-screen Settings;
the earlier owner-menu popover is superseded. The current Books and
onboarding layouts are otherwise unchanged.

- The 13-screen family shares the existing sunset working ground, 62pt
  compact header, 32/34 title, 16pt white grouped cards, 54pt minimum rows,
  22pt section rhythm, 48pt monogram and 51×31 switches.
- Selections use checkmarked rows; editing uses inline native text inputs
  and an explicit Save. The reference's quiet 44pt Cancel remains secondary.
- All settings-specific styling lives in `settings` tokens and
  `SettingsSurface` primitives. Labels/values wrap; larger system text
  stacks them rather than clipping facts.
- No persistent mascot is added to Settings. Existing Books, Status,
  Taxes, Month, Activity, business switching and sign-out stay reachable.
- Existing invented fixtures replace reference identities. Missing dates,
  verified phone and registry facts remain unknown. Backend status owns
  the attention count. No static numbers or legal claims become account facts.
- Working preferences and confirmed profile changes render returned state.
  Bank, OmaVero, accountant invitations, phone changes and exports remain
  explicitly unavailable, not simulated success. Swedish is visibly pending.

This is an implementation candidate, not a claim of pixel-identical native
font rasterization or new CANONICAL approval. Scope, deliberate exceptions
and runtime evidence are in `design/SETTINGS-REFINEMENT.md` and
`design/verification/2026-09-07-settings/README.md`.
