/**
 * core/design/tokens.ts — the Donna design language as code.
 *
 * TRANSCRIBED from the Donna desktop D system
 * (`donna/src/components/shared/design-tokens.js`, read 2026-08-26) and
 * adapted to React Native. DESIGN.md is the written half of this file;
 * §10 there records every adaptation. Both are law once Kari approves.
 *
 * Rules for future sessions:
 *  - Screens never import this file's colors/sizes directly into ad-hoc
 *    styles; they compose primitives from `core/design/`. ESLint enforces.
 *  - Every color's OKLCH source is authoritative; the hex/rgba is derived
 *    (OKLab -> sRGB, clamped). If the desktop value changes, re-derive —
 *    never eyeball-adjust the hex.
 *  - Add steps here by dated decision only. No in-between sizes, no fifth
 *    hue, no second primary button.
 *
 * This file is dependency-free on purpose (no react-native import): the
 * primitives resolve platform-specific values (fonts via Platform.select,
 * easing via Easing.bezier).
 */

// ── Color — paper + ink + one warm accent ───────────────────────────────────
// The accent-vs-alarm rule is the only color decision a screen may make:
// the user's move -> accent; genuine failure -> alert; everything else ->
// ink at full/72%/48%. No green, no amber, no violet (Kari, 2026-07-28).
export const color = {
  /** oklch(0.994 0.004 95) — "tokyo white". Warm whisper of chroma; raising it is heading back to oatmeal. */
  paper: '#FEFDFA',
  /** oklch(0.975 0.004 95) — recessed wells, grouped-list troughs. */
  paperDeep: '#F7F7F4',
  /** oklch(1 0 0) — containers. Pure white so cards POP off paper, never sit outlined on it. */
  card: '#FFFFFF',

  /** oklch(0.08 0 0) — text, full voice. */
  ink: '#020202',
  /** ink @ 72% — secondary text. */
  inkSoft: 'rgba(2, 2, 2, 0.72)',
  /** ink @ 48% — tertiary/meta text, quiet states. */
  inkMute: 'rgba(2, 2, 2, 0.48)',
  /** ink @ 15% — hairlines. */
  rule: 'rgba(2, 2, 2, 0.15)',
  /** ink @ 8% — whisper hairlines. */
  ruleSoft: 'rgba(2, 2, 2, 0.08)',
  /** ink @ 4% — identity-chip ground, chip press tint (identity is ink, never hue). */
  inkWash: 'rgba(2, 2, 2, 0.04)',
  /** ink @ 25% — overlay backdrop behind the plus menu. */
  scrim: 'rgba(2, 2, 2, 0.25)',

  /** oklch(0.72 0.12 65) — THE warm accent: "your move". One loud element per screen. */
  accent: '#D8944D',
  /** accent @ 14% — chip/badge ground for the accent voice. */
  accentWash: 'rgba(216, 148, 77, 0.14)',

  /** Donna-sunset pastels for contextual icon tiles. They never encode state. */
  iconGold: '#F9EAC2',
  iconPeach: '#FBE7D8',
  iconRose: '#F6E1DC',

  /** oklch(0.45 0.13 25) — deep brick. GENUINE failure only; never "money went out", never the accent's stand-in. */
  alert: '#90302E',
  /** alert @ 10% — ground for the alert voice. */
  alertWash: 'rgba(144, 48, 46, 0.10)',

  /** white @ 70% — the round header control chip on the sunset ground (shell v1, 2026-08-26). */
  headerChip: 'rgba(255, 255, 255, 0.7)'
} as const;

// ── Type — two voices (Kari, 2026-08-08) ────────────────────────────────────
// The UI voice is the SYSTEM face: leave fontFamily unset. Hierarchy comes
// from size/weight/spacing, never from switching typefaces. Mono is the
// MACHINE voice only — what you would paste into a bug report (ids, receipt
// hashes, model ids). Money is NOT machine output: amounts align through
// tabular numerals, never a face swap.
export const font = {
  /** UI voice: undefined = the platform system face. Do not "fix" this to a named font. */
  sans: undefined as string | undefined,
  /** Machine voice. Resolve via Platform.select at the primitive layer. */
  mono: { ios: 'Menlo', android: 'monospace', default: 'monospace' } as const
} as const;

/**
 * Preserve the full 200% accessibility text range while keeping compact
 * working-shell controls coherent on phone-width viewports.
 */
export const accessibilityType = {
  maxMultiplier: 2,
  launcherWideThreshold: 1.4,
  launcherPaddingX: 12,
  launcherColumnGap: 8
} as const;

/** Spread into any style that renders figures — amounts, counts, dates. */
export const tabular = { fontVariant: ['tabular-nums'] as const };

// The D scale, rem -> dp 1:1. `base` is the BODY FLOOR: nothing carrying a
// sentence the owner must read goes below 16. The two sub-base steps are
// for chips, meta, and machine eyebrows only.
export const text = {
  micro: 12, // machine caps, eyebrows, compact state pills. Never body.
  xs: 13, // chips, badges, dense meta.
  sm: 14, // secondary text.
  base: 16, // BODY FLOOR.
  md: 18, // emphasised body, lead-ins.
  lg: 21, // card values, section headings.
  xl: 26, // panel titles.
  xxl: 32, // screen titles.
  xxxl: 40 // hero figures.
} as const;

// Weight carries hierarchy; nothing heavier than 600. Selection/importance
// are carried by ink and background, never by bolding contests.
export const weight = {
  body: '400',
  emphasis: '500',
  heading: '600'
} as const;

/** Line-height multipliers — RN wants absolute lineHeight; primitives compute size × leading. */
export const leading = {
  body: 1.5,
  mono: 1.2
} as const;

/**
 * Letter-spacing in em, as the desktop spec states it. RN letterSpacing is
 * absolute dp, so primitives compute `track.mono * fontSize`.
 * mono (0.18em) is the machine-caps default; monoExtra (0.25em) is the rare
 * original cadence.
 */
export const track = {
  tight: -0.01,
  body: 0,
  wide: 0.025,
  mono: 0.18,
  monoExtra: 0.25
} as const;

// ── Spacing & geometry ──────────────────────────────────────────────────────
// Transcribed from the list-system source of truth (bank-feed-list-style.js)
// and the D paddings. No in-between values at call sites.
export const space = {
  hair: 4,
  xs: 6,
  sm: 8,
  md: 12,
  rowX: 16, // row text inset
  screenX: 20, // screen inset
  lg: 24,
  gapRow: 18 // inter-column gap in list rows
} as const;

export const radius = {
  chip: 3, // machine-voice identity chips
  card: 4, // cards (D.radius 0.25rem)
  sheet: 14, // sheets/modals (D.panelRadius)
  streamCard: 16, // shell v2 — one tactile item, still quieter than a modal sheet
  bubble: 18, // chat bubbles (shell v1, 2026-08-26); the flat corner is radius.chip×2
  pill: 999 // buttons
} as const;

/** cubic-bezier(0.2, 0, 0, 1) — resolve via Easing.bezier at the primitive layer. */
export const ease = [0.2, 0, 0, 1] as const;

// D.panelShadow, split for RN. Cards pop off paper via border + a whisper of
// shadow; sheets get the fuller float. Pair with `elevation` on Android.
export const shadow = {
  card: {
    shadowColor: color.ink,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1
  },
  /** Shell v2's separated stream cards: enough lift to state identity, never dashboard chrome. */
  streamCard: {
    shadowColor: color.ink,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  sheet: {
    shadowColor: color.ink,
    shadowOpacity: 0.07,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  // Shell v1 (2026-08-26, PR #1 vibe approval) — the three chrome shadows.
  /** The information surface floating on the sunset ground (warm-tinted, not pure ink). */
  surface: {
    shadowColor: '#3A1F0F',
    shadowOpacity: 0.08,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4
  },
  /** The floating dock. */
  dock: {
    shadowColor: color.ink,
    shadowOpacity: 0.12,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8
  },
  /** The Donna orb (warm shadow from the orb's own palette). */
  orb: {
    shadowColor: '#BD4F19',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  /** The four Donna launcher rows. */
  launcher: {
    shadowColor: color.ink,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7
  }
} as const;

// ── Icon geometry (one weight everywhere) ───────────────────────────────────
// Selection is carried by ink and background, never by a heavier icon.
export const icon = { size: 18, slot: 22, stroke: 1.8, gap: 11 } as const;

/** Voice-onboarding recorder geometry (2026-09-03). */
export const voice = {
  panelPadding: 20,
  startSize: 104,
  startGlyph: 38,
  microphoneSize: 64,
  microphoneGlyph: 28,
  meterBarWidth: 5,
  meterBarHeights: [12, 24, 36, 24, 12] as const
} as const;

// ── The list grammar ────────────────────────────────────────────────────────
// The dot carries the voice (7dp): filled accent = your move; hollow
// (1.5 inkMute border) = not blocking you; filled alert = genuine failure.
// There is no other dot state.
export const dot = {
  size: 7,
  headerSize: 7,
  hollowBorder: 1.5,
  halo: 4
} as const;

export const row = {
  /** Shell v1 (2026-08-26): the taller thumb-height list grammar — 78pt rows, 12pt vertical padding. */
  paddingY: 12,
  paddingX: space.rowX,
  /** Asymmetric row insets from the shell-v1 grammar: 20 leading / 18 trailing. */
  paddingLeft: space.screenX,
  paddingRight: space.gapRow,
  minHeight: 78,
  /** Section headers sit at a fixed 46pt in the same grammar. */
  headerHeight: 46,
  hairline: color.rule,
  /** Activated row ground (desktop: active row lifts to card-white). */
  activeBg: color.card
} as const;

// ── Shell v2 primary stream ───────────────────────────────────────────────
// Kari, 2026-09-02: one date-stable Books stream; state is a pill, never a
// section. Individual white cards replace the enclosing white list sheet on
// the primary surface. Secondary/detail lists retain the row grammar above.
/** Claude Design refinement, 2026-09-06: exact working-screen metrics. */
export const refinement = {
  groundColors: ['#F9EAC2', '#FFF0E3', '#FDFCF7', '#FEFDFA'] as const,
  groundLocations: [0, 0.28, 0.70, 1] as const,
  accentInk: '#8A5420',
  orbBorder: 'rgba(255,255,255,0.9)',
  reportDot: 7, reportDotBorder: 1.5, reportFootLine: 18, receiptIcon: 16, appliedIcon: 14,
  pillHeight: 22, detailPillHeight: 26, pillPaddingY: 3,
  decisionHeight: 48, decisionPaddingX: 18, chipHeight: 36,
  headerGlyph: 20, eyebrowTracking: 2.1,
  chatHeaderHeight: 70, chatBackGap: 11, chatHeaderRight: 18,
  chatBottomGap: 10, chatThreadGap: 24,
  messageAvatar: 28, messageAvatarImage: 29, messageAvatarShift: 2, messageAvatarGap: 10,
  receiptGap: 10, receiptPaddingX: 14, receiptPaddingY: 10,
  evidenceHeight: 132, evidenceRadius: 12, invoiceGap: 8, invoiceRuleGap: 14,
  reportInset: 16, reportTop: 4, reportGap: 10, reportBottom: 112,
  reportHeadingX: 6, reportHeadingTop: 6, reportHeadingBottom: 14, reportPadding: 16,
  reportCardGap: 12, reportHeaderGap: 2, reportRowGap: 10, reportRowHeight: 40,
  photoWidth: 200, photoHeight: 140, photoPadding: 4,
  type: {
    itemTitle: { fontSize: 17, lineHeight: 24, fontWeight: '500', letterSpacing: -0.25 },
    detailTitle: { fontSize: 24, lineHeight: 30, fontWeight: '600', letterSpacing: -0.5 },
    detailBody: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
    detailMeta: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
    detailSecondary: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
    message: { fontSize: 16, lineHeight: 23, fontWeight: '400', letterSpacing: -0.15 },
    decision: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
    chip: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    reportHeading: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.25 },
    reportLead: { fontSize: 18, lineHeight: 25, fontWeight: '400' },
    reportRow: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
    reportFigure: { fontSize: 40, lineHeight: 44, fontWeight: '500', letterSpacing: -1 },
    period: { fontSize: 14, lineHeight: 22, fontWeight: '400' },
    receipt: { fontSize: 14, lineHeight: 19, fontWeight: '400' }
  },
  chromeShadow: { boxShadow: '0 1px 2px rgba(2,2,2,0.06)' },
  composerShadow: { boxShadow: '0 8px 24px rgba(2,2,2,0.08)' },
  bubbleShadow: { boxShadow: '0 1px 2px rgba(2,2,2,0.04)' }
} as const;

/** Settings handoff, 2026-09-07. Shared grouped-list register. */
export const settings = {
  inset: 16, top: 4, bottom: 48, gap: 22, headingInset: 6, headingTop: 6,
  headingGap: 10, sectionGap: 8, rowGap: 12, rowMinHeight: 54, rowPaddingY: 12,
  copyGap: 2, valueMaxWidth: 190, iconSlot: 24, iconSize: 19, iconStroke: 1.8,
  chevronSize: 18, chevronInk: 'rgba(2,2,2,.3)',
  checkSize: 20, checkStroke: 2.2,
  monogramSize: 48, monogramRadius: 14, monogramGap: 14,
  monogramGround: '#EAD39D', monogramInk: '#56431F',
  switchWidth: 51, switchHeight: 31, switchInset: 2, knobSize: 27,
  knobShadow: '0 2px 4px rgba(0,0,0,.2)',
  pressed: '#FBF9F4', actionHeight: 56, actionGap: 12,
  quietHeight: 44, quietInset: 4, receiptCopyGap: 4,
  type: {
    settingsTitle: { fontSize: 32, lineHeight: 34, fontWeight: '600', letterSpacing: -1.2 },
    settingsLabel: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -.25 },
    settingsSub: { fontSize: 13, lineHeight: 17, fontWeight: '400' },
    settingsFoot: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
    settingsSection: { fontSize: 12, lineHeight: 19, fontWeight: '600', letterSpacing: 1.6 },
    settingsValue: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
    settingsDigits: { fontSize: 16, lineHeight: 20, fontWeight: '400' },
    settingsQuiet: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  }
} as const;

export const stream = {
  horizontalInset: 16,
  topInset: 8,
  bottomInset: 112,
  cardMinHeight: 70,
  cardPadding: 12,
  cardGap: 10,
  cardColumnGap: 12,
  /** 24pt title line + 5pt gap + 17pt metadata line. */
  iconSize: 46,
  iconRadius: 12,
  iconGlyph: 20,
  copyMetaGap: 5,
  /** Metadata may wrap, but an amount is never truncated with its date/type. */
  metaColumnGap: 8,
  metaRowGap: 2,
  accessibilityExpandedThreshold: 1.35,
  accessibilityStateWidth: 96,
  // Rendered reference: 29.7pt flex-shrunk heading + 10pt inter-item gap.
  periodHeight: 40,
  periodTopInset: 0,
  periodPaddingX: 4,
  periodPaddingBottom: 8
} as const;

// ── Artifact detail ──────────────────────────────────────────────────────
// Kari, 2026-09-02: selected queue cards and documents use the same compact,
// conversation-first work surface. Typed decisions remain visually separate
// from the item-bound non-terminal composer.
export const artifact = {
  headerHeight: 62,
  headerPaddingX: 16,
  headerPaddingTop: 6,
  headerPaddingBottom: 8,
  headerGap: 10,
  contentPaddingX: 16,
  contentPaddingTop: 8,
  contentGap: 12,
  contextPadding: 20,
  contextRadius: 24,
  titleMetaGap: 14,
  copyGap: 14,
  actionTopGap: 18,
  actionPaddingTop: 16,
  receiptRadius: 12,
  bubbleMax: 310,
  ownerBubbleMax: 286,
  bubblePaddingX: 15,
  bubblePaddingY: 12,
  composerHeight: 58,
  composerInset: 16,
  composerBottomGap: 10,
  composerKeyboardGap: 14,
  composerPaddingLeft: 18,
  composerPaddingRight: 6,
  composerActionGap: 10,
  composerActionInset: 0,
  sendSize: 44,
  composerThreadGap: 24
} as const;

// ── The one-button law (buttons.js, Kari 2026-08-07) ────────────────────────
// btnPrimary — the ONE loud action on a surface: ink pill, paper text.
// btnChip — everything else clickable: quiet hairline chip, soft ink.
// btnDisabled — the primary's resting/blocked state.
// Destructive = primary recolored to alert, only inside an explicit
// confirmation step. Hit targets reach `tapTarget` via hitSlop/minHeight —
// never by inflating the visual geometry.
export const button = {
  fontSize: text.xs,
  paddingY: 7,
  paddingX: 14,
  gap: 6,
  radius: radius.pill,
  primary: { bg: color.ink, fg: color.paper, weight: weight.heading },
  chip: { bg: 'transparent', fg: color.inkSoft, border: color.rule, weight: weight.emphasis },
  disabled: { bg: 'transparent', fg: color.inkMute, border: color.ruleSoft, weight: weight.heading }
} as const;

/** Minimum hit target (Apple HIG / Android a11y). Extend via hitSlop, not visuals. */
export const tapTarget = 44;

// ── The shell ground — panels-on-ground, carried to mobile ──────────────────
// AMENDS DESIGN.md §10.6 by Kari's dated call (2026-08-26 evening, the Buzz
// reference review): the desktop shell's sunset-gradient ground DOES carry
// to the phone — screens sit on a warm sunset ground and white cards/chrome
// float on it. Strength sits between the desktop whisper ground and the
// landing gradient: visible on a phone, nowhere near the brand sweep.
// Top -> bottom; content areas fade to near-paper so rows stay legible.
export const ground = {
  /** oklch(0.94 0.055 90) — warm gold, the gradient's one loud moment. */
  top: '#F9EAC2',
  /** oklch(0.965 0.025 60) — soft warm mid. */
  mid: '#FFF0E3',
  /** oklch(0.99 0.006 95) — lands on paper where the content lives. */
  bottom: '#FDFCF7',
  /** Soft shell light at the upper-left; never enters an information surface. */
  glow: 'rgba(255, 255, 255, 0.48)',
  glowClear: 'rgba(255, 255, 255, 0)',
  glowStop: 0.24,
  /** Vertical stops: one continuous sunset-to-paper field, including beneath Books. */
  midStop: 0.28,
  endStop: 0.7
} as const;

// ── Shared information surfaces + shell v2 Donna control ───────────────────
// Detail/chat surfaces retain shell v1's opaque panel. Kari's 2026-09-02
// shell-v2 call removes that panel from Books and deletes the tab dock; Donna
// floats alone and keeps the existing four-action launcher.
export const surface = {
  /** Ground reveal around the information surface. */
  margin: 6,
  radius: 28,
  /** Bottom padding inside a shell surface so content clears Donna. */
  contentBottom: 112
} as const;

export const floatingAction = {
  size: 56,
  right: 20,
  /** + safe-area inset ⇒ the same 44pt reference offset used by shell v1. */
  bottomGap: 10,
  border: 3,
  imageSize: 58,
  imageShift: 4,
  halo: 3,
  /** Launcher: the v1 action rows, now anchored above Donna herself. */
  menuMargin: 20,
  menuGapToButton: 20,
  menuGap: 8,
  menuTravel: 8,
  menuRow: 60,
  menuRowPaddingX: 18,
  menuColumnGap: 13,
  menuIcon: 24,
  menuChevron: 16,
  miniOrb: 28,
  miniOrbImage: 29,
  miniOrbShift: 2,
  composerGap: 14,
  /** While the keyboard is present, keep the composer one compact gap above it. */
  composerKeyboardGap: 14
} as const;

/** The owner menu opened by the shared top-right burger control. */
export const ownerMenu = {
  width: 320,
  margin: 20,
  topGap: 6,
  padding: 8,
  identityPaddingX: 14,
  identityPaddingY: 12,
  identityGap: 3,
  rowMinHeight: 54,
  rowPaddingX: 14,
  rowGap: 12,
  iconSlot: 24,
  iconSize: 19,
  dividerInset: 50,
  travel: -8,
  notificationDot: 8,
  notificationDotBorder: 2,
  notificationDotTop: 7,
  notificationDotRight: 7
} as const;

/**
 * Shell-v1's measured iPhone frame. Native uses the real safe-area insets;
 * web uses these reference insets so 393×852 review captures describe the
 * same phone instead of silently collapsing the status/home-indicator space.
 */
export const shellGeometry = {
  referenceSafeTop: 59,
  referenceSafeBottom: 34,
  header: {
    height: 86,
    paddingX: 22,
    paddingTop: 10,
    paddingBottom: 14,
    eyebrowGap: 4,
    accessory: 44,
    accessoryIcon: 20,
    back: 44,
    backGap: 6
  },
  summary: {
    height: 112,
    paddingX: 20,
    paddingTop: 20,
    paddingBottom: 17,
    copyMaxWidth: 310,
    metaGap: 12
  },
  list: {
    dotSlot: 8,
    columnGap: 10,
    subtitleGap: 4,
    trailingMinWidth: 75,
    trailingMarginLeft: 3,
    trailingGap: 4
  },
  materials: {
    introHeight: 68,
    introPaddingX: 20,
    introCopyGap: 3,
    pillMinWidth: 58,
    pillHeight: 38,
    pillPaddingX: 12
  },
  chat: {
    identityHeight: 70,
    identityPaddingX: 18,
    identityGap: 11,
    avatar: 44,
    avatarImage: 47,
    avatarShift: 3,
    online: 8,
    threadPaddingTop: 10,
    threadPaddingX: 14,
    threadPaddingBottom: 94,
    donnaBubbleMax: 306,
    ownerBubbleMax: 282,
    bubblePaddingX: 15,
    bubblePaddingY: 13,
    messageMetaGap: 16,
    composerHeight: 54,
    composerPaddingLeft: 18,
    composerPaddingRight: 6,
    composerGap: 8,
    send: 42
  }
} as const;

/** Optical type metrics measured from the approved 393×852 references. */
export const shellType = {
  titleLine: 34,
  titleTracking: -1.2,
  leadLine: 23,
  leadTracking: -0.35,
  rowTitleLine: 20,
  rowTitleTracking: -0.25,
  rowMetaLine: 17,
  sectionLine: 16,
  amountLine: 20,
  amountTracking: -0.2,
  messageLine: 23,
  messageTracking: -0.15
} as const;

/** The Donna orb gradient — gold → orange → red on a 145° diagonal (the brand sunset, lit). */
export const orb = {
  gradient: ['#F5BD61', '#EF7926', '#D7371D'] as const,
  start: { x: 0.15, y: 0 },
  end: { x: 0.85, y: 1 }
} as const;

// ── Brand register — NOT for working screens ────────────────────────────────
// Onboarding moments, first-run, the App Store page. Never inside the four
// working screens; never mixed with the working register (DESIGN.md §7).
// The sunset sweep is the landing gradient's spec stops; grain texture is
// deferred on mobile (DESIGN.md §10.7).
export const brand = {
  /** Editorial faces — brand only; the app ships no fonts (2026-08-08: serif is OUT of the app). */
  serif: "'Instrument Serif', Georgia, serif",
  display: "'Anton', Impact, sans-serif",
  /** gold -> orange -> red-ish: oklch(0.80 0.12 78) / oklch(0.70 0.17 50) / oklch(0.58 0.20 32). */
  sunset: ['#E8B45E', '#EF7926', '#D7371D'] as const,
  /** Whisper-strength shell ground (desktop panels-on-ground; unused on mobile v1):
   *  oklch(0.972 0.016 85) / oklch(0.960 0.018 58) / oklch(0.945 0.020 40). */
  ground: ['#FBF5EA', '#FCEFE6', '#FAE9E3'] as const
} as const;

/** 2026-09-05: soft desktop sunset light throughout onboarding; no saturated red band. */
export const brandGround = {
  colors: [ground.top, brand.ground[0], brand.ground[1], color.paper] as const,
  locations: [0, 0.34, 0.62, 1] as const
} as const;

export const onboarding = {
  mascotSize: 156,
  mascotImageSize: 150,
  mascotImageShift: 12,
  mascotBorder: 4,
  fieldHeight: 64,
  callingCodeWidth: 88,
  codeCellHeight: 64,
  codeGap: 8,
  codeRadius: 14,
  phoneFontSize: 22,
  screenInset: 24,
  topInset: 28,
  bottomInset: 16,
  sectionGap: 28,
  headerGap: 10,
  homeClearance: 10,
  footerGap: 6,
  welcomeGap: 28,
  welcomeCopyWidth: 320,
  phonePaddingX: 18,
  phoneTracking: 0.3,
  placeholder: 'rgba(2, 2, 2, 0.3)',
  cueBorder: 'rgba(2, 2, 2, 0.06)',
  cueNoteGap: 12,
  statusDotSize: 10,
  focusGap: 14,
  titleBodyCardGap: 8,
  cardTopInset: 12,
  cardGap: 20,
  businessGap: 24,
  recordingGap: 20,
  inlineLinkOffset: 3,
  notificationPaddingY: 14,
  notificationIconRadius: 9,
  notificationBorder: 'rgba(255, 255, 255, 0.9)',
  notificationShadow: { boxShadow: '0 12px 34px rgba(58, 31, 15, 0.10)' },
  progressRowHeight: 44,
  progressIconSize: 18,
  spinnerDuration: 800,
  booksGap: 10,
  booksCardGap: 14,
  booksCopyGap: 6,
  booksButtonHeight: 52,
  ghostBorderWidth: 1.5,
  ghostIconSize: 46,
  ghostIconRadius: 12,
  ghostIconGround: 'rgba(249, 234, 194, 0.6)',
  primaryHeight: 56,
  primaryPaddingY: 15,
  quietPaddingX: 4,
  cuePaddingX: 18,
  cueRowHeight: 48,
  cueSurface: 'rgba(255, 255, 255, 0.72)',
  notificationSurface: 'rgba(255, 255, 255, 0.82)',
  notificationRadius: 22,
  notificationIconSize: 38,
  processingOrbSize: 72,
  processingImageSize: 70,
  processingImageShift: 6,
  processingOrbShadow: { boxShadow: '0 6px 14px rgba(189, 79, 25, 0.24)' },
  mascotShadow: { boxShadow: '0 8px 18px rgba(189, 79, 25, 0.24)' },
  booksShadow: { boxShadow: '0 3px 8px rgba(2, 2, 2, 0.07)' },
  codeInsetShadow: 'inset 0 2px 4px rgba(58, 31, 15, 0.045)',
  pausedWaveHeights: [6, 12, 20, 12],
  waveformPeak: 40,
  waveformRest: 6,
  waveformDuration: 900,
  waveformDurationStep: 130,
  waveformDelayStep: 60,
  statusPulseHalfDuration: 650,
  permissionPaddingY: 12,
  permissionPaddingX: 14,
  permissionRadius: 12,
  focusMinHeight: 150,
  waveformBarWidth: 4,
  waveformGap: 4,
  waveformHeight: 48,
  waveformHeights: [6, 12, 24, 34, 40, 28, 18, 10, 6, 16, 30, 38, 22, 12, 8, 18, 32, 40, 26, 14, 6, 12, 20, 34, 26, 18, 10, 6, 12, 6],
  motionDuration: 400,
  motionRise: 6,
  micShadow: { boxShadow: '0 10px 24px rgba(2, 2, 2, 0.18)' }
} as const;

/** Onboarding v4 register, 2026-09-06. Working-shell typography is unchanged. */
export const onboardingType = {
  welcome: { fontSize: 34, lineHeight: 38, fontWeight: weight.heading, letterSpacing: -0.8 },
  title: { fontSize: 32, lineHeight: 36, fontWeight: weight.heading, letterSpacing: -0.8 },
  lead: { fontSize: 17, lineHeight: 24, fontWeight: weight.body },
  owner: { fontSize: 17, lineHeight: 22, fontWeight: weight.body },
  body: { fontSize: 16, lineHeight: 22, fontWeight: weight.body },
  fact: { fontSize: 16, lineHeight: 21, fontWeight: weight.body },
  small: { fontSize: 15, lineHeight: 20, fontWeight: weight.body },
  quiet: { fontSize: 15, lineHeight: 20, fontWeight: weight.emphasis },
  note: { fontSize: 13, lineHeight: 18, fontWeight: weight.body },
  meta: { fontSize: 13, lineHeight: 20.15, fontWeight: weight.body },
  tap: { fontSize: 15, lineHeight: 23.25, fontWeight: weight.body },
  alert: { fontSize: 14, lineHeight: 20, fontWeight: weight.body },
  company: { fontSize: 28, lineHeight: 32, fontWeight: weight.heading, letterSpacing: -0.6 },
  greeting: { fontSize: 21, lineHeight: 26, fontWeight: weight.heading, letterSpacing: -0.3 },
  greetingBody: { fontSize: 16, lineHeight: 23, fontWeight: weight.body },
  description: { fontSize: 20, lineHeight: 26, fontWeight: weight.emphasis },
  timer: { fontSize: 40, lineHeight: 44, fontWeight: weight.emphasis, letterSpacing: -1 }
} as const;

/** Quiet recessed fields, shared by the phone, verification and introduction. */
export const inputSurface = {
  backgroundColor: color.card,
  borderColor: color.ruleSoft,
  borderWidth: 1,
  borderRadius: radius.streamCard,
  boxShadow: 'inset 0 2px 4px rgba(58, 31, 15, 0.045), 0 1px 0 rgba(255, 255, 255, 0.7)'
} as const;

/** 2026-09-05 approved onboarding business-card concept; not working-screen chrome. */
export const businessCard = {
  colors: ['#FFFDF5', '#FBF5E6', '#F6E9CC'] as const,
  border: '#D8C197', rule: 'rgba(216, 201, 167, 0.6)',
  monogram: '#EAD39D', monogramInk: '#56431F', notch: '#D8BD84',
  radius: 24, padding: 24, notchWidth: 56, notchHeight: 4, notchTop: 10,
  monogramSize: 44, monogramRadius: 14, factMinWidth: 120, factColumnThreshold: 380, factFontScaleThreshold: 1.2,
  companyTop: 22, ownerTop: 14, professionTop: 2, hintTop: 10, ruleGap: 20,
  factColumnGap: 12, factRowGap: 16, factLabelGap: 3,
  editGap: 10, editBorder: 'rgba(2, 2, 2, 0.12)', editRadius: 12, editPaddingX: 14,
  editCompanyHeight: 52, editFieldHeight: 48,
  shadow: { boxShadow: '0 6px 14px rgba(114, 85, 33, 0.14)' }
} as const;
