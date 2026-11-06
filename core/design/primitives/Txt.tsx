import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  type TextProps,
  type TextStyle
} from 'react-native';
import { accessibilityType, color, font, leading, onboardingType, refinement, settings, shellType, text, track, weight } from '../tokens';

/**
 * The ONE text primitive. Two voices (DESIGN.md §4): the system face for
 * everything, mono for machine strings only. Variants are the D scale —
 * no in-between sizes exist, so no fontSize prop exists.
 */
export type TxtVariant =
  | keyof typeof settings.type
  | 'onboardingWelcome' | 'onboardingTitle' | 'onboardingLead' | 'onboardingQuiet'
  | 'onboardingNote' | 'onboardingCompany' | 'onboardingDescription' | 'onboardingTimer' | 'onboardingAlert' | 'onboardingMeta' | 'onboardingTap'
  | 'onboardingOwner' | 'onboardingBody' | 'onboardingFact' | 'onboardingSmall' | 'onboardingGreeting' | 'onboardingGreetingBody'
  | 'itemTitle' | 'detailTitle' | 'detailBody' | 'detailMeta' | 'detailSecondary' | 'message' | 'decision' | 'chip' | 'reportHeading' | 'reportLead' | 'reportRow' | 'reportFigure' | 'receipt'
  | 'period'
  | 'hero' // xxxl — hero figures
  | 'title' // xxl — screen titles
  | 'panel' // xl — panel titles
  | 'heading' // lg 600 — section/card headings
  | 'md' // md — emphasised body
  | 'body' // base — BODY FLOOR for readable prose
  | 'sm' // sm — secondary text
  | 'meta' // xs — chips, dense meta
  | 'pill' // micro — compact state labels only
  | 'eyebrow' // micro SANS caps, wide-tracked — the header identity line (shell v1). Not machine output.
  | 'machine'; // micro mono caps — ids, receipts. NEVER body, NEVER amounts.

export type TxtTone = 'ink' | 'soft' | 'mute' | 'accent' | 'alert' | 'paper';

const TONE: Record<TxtTone, string> = {
  ink: color.ink,
  soft: color.inkSoft,
  mute: color.inkMute,
  accent: color.accent,
  alert: color.alert,
  paper: color.paper
};

const VARIANT: Record<TxtVariant, TextStyle> = {
  ...settings.type,
  ...refinement.type,
  onboardingWelcome: onboardingType.welcome,
  onboardingTitle: onboardingType.title,
  onboardingLead: onboardingType.lead,
  onboardingOwner: onboardingType.owner,
  onboardingBody: onboardingType.body,
  onboardingFact: onboardingType.fact,
  onboardingSmall: onboardingType.small,
  onboardingGreeting: onboardingType.greeting,
  onboardingGreetingBody: onboardingType.greetingBody,
  onboardingQuiet: onboardingType.quiet,
  onboardingNote: onboardingType.note,
  onboardingAlert: onboardingType.alert,
  onboardingMeta: onboardingType.meta,
  onboardingTap: onboardingType.tap,
  onboardingCompany: onboardingType.company,
  onboardingDescription: onboardingType.description,
  onboardingTimer: onboardingType.timer,
  hero: { fontSize: text.xxxl, lineHeight: Math.round(text.xxxl * 1.1), fontWeight: weight.heading },
  title: {
    fontSize: text.xxl,
    lineHeight: shellType.titleLine,
    fontWeight: weight.heading,
    letterSpacing: shellType.titleTracking
  },
  panel: { fontSize: text.xl, lineHeight: Math.round(text.xl * 1.2), fontWeight: weight.heading },
  heading: { fontSize: text.lg, lineHeight: Math.round(text.lg * 1.25), fontWeight: weight.heading },
  md: { fontSize: text.md, lineHeight: Math.round(text.md * leading.body), fontWeight: weight.body },
  body: { fontSize: text.base, lineHeight: Math.round(text.base * leading.body), fontWeight: weight.body },
  sm: { fontSize: text.sm, lineHeight: Math.round(text.sm * leading.body), fontWeight: weight.body },
  meta: { fontSize: text.xs, lineHeight: shellType.rowMetaLine, fontWeight: weight.body },
  pill: { fontSize: text.micro, lineHeight: shellType.sectionLine, fontWeight: weight.emphasis },
  eyebrow: {
    fontSize: text.micro,
    lineHeight: Math.round(text.micro * 1.2),
    fontWeight: weight.heading,
    letterSpacing: refinement.eyebrowTracking,
    textTransform: 'uppercase'
  },
  machine: {
    fontSize: text.micro,
    lineHeight: Math.round(text.micro * leading.mono),
    fontWeight: weight.heading,
    fontFamily: Platform.select(font.mono),
    letterSpacing: track.mono * text.micro,
    textTransform: 'uppercase'
  }
};

export type TxtProps = TextProps & {
  v?: TxtVariant;
  tone?: TxtTone;
  /** Equal-width digits for figures — amounts, counts, dates (never mono). */
  tabular?: boolean;
  /** 500-weight emphasis inside a body/sm run. */
  em?: boolean;
  align?: TextStyle['textAlign'];
};

export const Txt = ({
  v = 'body',
  tone = 'ink',
  tabular: tab,
  em,
  align,
  style,
  maxFontSizeMultiplier = accessibilityType.maxMultiplier,
  ...rest
}: TxtProps) => {
  const { fontScale } = useWindowDimensions();
  const effectiveMax = maxFontSizeMultiplier ?? accessibilityType.maxMultiplier;
  const requestedLineHeight = StyleSheet.flatten(style)?.lineHeight ?? VARIANT[v].lineHeight;
  // Native scales glyphs but not an explicit numeric lineHeight consistently.
  // Scale that metric ourselves so large Dynamic Type never clips vertically.
  const scaledLineHeight =
    typeof requestedLineHeight === 'number'
      ? v.startsWith('onboarding') ? requestedLineHeight * Math.min(fontScale, effectiveMax) : Math.round(requestedLineHeight * Math.min(fontScale, effectiveMax))
      : undefined;

  return (
    <Text
      {...rest}
      lineBreakStrategyIOS={v.startsWith('onboarding') ? 'standard' : rest.lineBreakStrategyIOS}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        VARIANT[v],
        Platform.OS === 'web' && v !== 'machine'
          ? ({ fontFamily: '-apple-system, "SF Pro Text", "SF Pro", system-ui, sans-serif', textWrap: 'pretty', WebkitFontSmoothing: 'antialiased' } as TextStyle) : null,
        { color: TONE[tone] },
        tab ? { fontVariant: ['tabular-nums'] } : null,
        em ? { fontWeight: weight.emphasis } : null,
        align ? { textAlign: align } : null,
        style,
        scaledLineHeight ? { lineHeight: scaledLineHeight } : null
      ]}
    />
  );
};
