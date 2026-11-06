import React, { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { businessCard, color, dot, radius, space } from '../tokens';
import { Button } from './Button';
import { OnboardingReveal } from './OnboardingMotion';
import { Txt, type TxtVariant } from './Txt';
import { gradientPoints } from '../gradientGeometry';

export type BusinessCardValue = { key: string; label: string; value: string; hint?: string };

const Hint = ({ fact }: { fact: BusinessCardValue }) => fact.hint ? <View style={styles.hint}>
  <View style={styles.hintDot} /><Txt v="onboardingMeta" tone="soft" style={styles.hintCopy}
    accessibilityLabel={`${fact.label}: ${fact.hint}`}>{fact.hint}</Txt>
</View> : null;

const CardValue = ({ fact, variant = 'onboardingFact', soft = false, hideHint = false }: {
  fact: BusinessCardValue; variant?: TxtVariant; soft?: boolean; hideHint?: boolean;
}) => <View>
  <Txt v={variant} tone={soft ? 'soft' : 'ink'} accessibilityRole={variant === 'onboardingCompany' ? 'header' : undefined}
    accessibilityLabel={fact.value ? `${fact.label}: ${fact.value}` : fact.label}>{fact.value || fact.label}</Txt>
  {!hideHint ? <Hint fact={fact} /> : null}
</View>;

/** Fixed fact projection; inline edit controls use these exact same values. */
export const BusinessProfileCard = ({ company, owner, profession, description, facts, editLabel, busy, onEdit,
  renderField, editableFields = [], onEditFact, children }: {
  company: BusinessCardValue; owner: BusinessCardValue; profession?: BusinessCardValue;
  description?: BusinessCardValue; facts: BusinessCardValue[]; editLabel: string;
  busy: boolean; onEdit: () => void; editing?: boolean; children?: React.ReactNode;
  editableFields?: readonly string[]; renderField?: (fact: BusinessCardValue) => React.ReactNode;
  onEditFact?: () => void;
}) => {
  const { width, fontScale } = useWindowDimensions();
  const [factsWidth, setFactsWidth] = useState(0);
  const [bounds, setBounds] = useState({ width: 1, height: 1 });
  const gradient = gradientPoints(170, bounds.width, bounds.height);
  const stacked = width < businessCard.factColumnThreshold || fontScale > businessCard.factFontScaleThreshold;
  const initials = company.value.trim().split(/\s+/).filter(word => !/^(oy|oyj|ab)$/i.test(word))
    .slice(0, 2).map(word => Array.from(word)[0]).join('').toLocaleUpperCase();
  const isEditable = (fact: BusinessCardValue) => renderField && editableFields.includes(fact.key);
  const value = (fact: BusinessCardValue, variant?: TxtVariant, soft = false, hideHint = false) => {
    if (isEditable(fact)) return renderField!(fact);
    const copy = <CardValue fact={fact} variant={variant} soft={soft} hideHint={hideHint} />;
    return onEditFact && !['business_name', 'owner_name', 'profession'].includes(fact.key)
      ? <Pressable accessibilityRole="button" accessibilityLabel={fact.label + ': ' + fact.value}
          hitSlop={{ top: space.md, bottom: space.md }} disabled={busy} onPress={onEditFact}>{copy}</Pressable> : copy;
  };
  return <OnboardingReveal>
    <View style={styles.lift}>
      <LinearGradient colors={businessCard.colors} locations={[0, 0.55, 1]}
        {...gradient} onLayout={event => setBounds({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })} style={styles.surface}>
        <View style={styles.notch} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <View style={styles.header}>
          <View style={styles.monogram} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Txt v="onboardingLead" style={styles.initials}>{initials}</Txt>
          </View>
          <Button title={editLabel} kind="text" size="onboarding" quietTone="ink" icon="pencil" disabled={busy} onPress={onEdit} />
        </View>
        <View style={styles.identity}>
          {value(company, 'onboardingCompany', false, true)}
          <View style={{ marginTop: isEditable(owner) ? businessCard.editGap : businessCard.ownerTop }}>
            {value(owner, 'onboardingOwner')}
          </View>
          {profession ? <View style={{ marginTop: isEditable(profession) ? businessCard.editGap : businessCard.professionTop }}>
            {value(profession, 'onboardingSmall', true)}
          </View> : null}
          {!isEditable(company) ? <Hint fact={company} /> : null}
        </View>
        {description ? <View style={styles.section}>{value(description, 'onboardingDescription')}</View> : null}
        {facts.length ? <View style={[styles.section, styles.facts]} onLayout={event => setFactsWidth(event.nativeEvent.layout.width)}>
          {facts.map(fact => <View key={fact.key}
            style={[styles.fact, { width: Math.max(0, (factsWidth - businessCard.factColumnGap) / 2) },
              (stacked || isEditable(fact)) && styles.fullFact]}>
            {!isEditable(fact) ? <Txt v="onboardingMeta" tone="mute">{fact.label}</Txt> : null}
            {value(fact)}
          </View>)}
        </View> : null}
        {children ? <View style={styles.extras}>{children}</View> : null}
      </LinearGradient>
    </View>
  </OnboardingReveal>;
};

const styles = StyleSheet.create({
  lift: { borderRadius: businessCard.radius, ...businessCard.shadow },
  surface: { borderRadius: businessCard.radius, borderWidth: 1, borderColor: businessCard.border, padding: businessCard.padding, overflow: 'hidden' },
  notch: { position: 'absolute', top: businessCard.notchTop, alignSelf: 'center', width: businessCard.notchWidth, height: businessCard.notchHeight, borderRadius: businessCard.notchHeight / 2, backgroundColor: businessCard.notch },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  monogram: { width: businessCard.monogramSize, height: businessCard.monogramSize, borderRadius: businessCard.monogramRadius, backgroundColor: businessCard.monogram, alignItems: 'center', justifyContent: 'center' },
  initials: { color: businessCard.monogramInk, fontWeight: '600', letterSpacing: 0.5 },
  identity: { marginTop: businessCard.companyTop },
  section: { borderTopWidth: 1, borderTopColor: businessCard.rule, marginTop: businessCard.ruleGap, paddingTop: businessCard.ruleGap },
  facts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: businessCard.factColumnGap, rowGap: businessCard.factRowGap },
  fact: { gap: businessCard.factLabelGap, minWidth: 0 },
  fullFact: { width: '100%' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: businessCard.hintTop },
  hintDot: { width: dot.size, height: dot.size, borderRadius: radius.pill, backgroundColor: color.accent },
  hintCopy: { flex: 1 },
  extras: { paddingTop: space.md }
});
