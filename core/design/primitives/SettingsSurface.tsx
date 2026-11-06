import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { color, radius, refinement, settings as s, shadow } from "../tokens";
import { Screen } from "./Screen";
import { CompactHeader } from "./RefinedContent";
import { Txt } from "./Txt";

const paths: Record<string, string[]> = {
  status: ["M22 12h-4l-3 9L9 3l-3 9H2"],
  tax: ["M4 4h16v16H4z", "M8 9h8M8 13h5"],
  month: ["M3 4h18v18H3z", "M3 10h18M8 2v4M16 2v4"],
  activity: ["M12 8v4l3 3", "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"],
  card: ["M2 6h20v12H2z", "M6 10h4M6 14h8"],
  id: ["M3 5h18v14H3z", "M7 9h.01M7 13h4M14 9h3M14 13h3"],
  calendar: ["M3 4h18v18H3z", "M3 10h18M8 2v4M16 2v4"],
  bell: [
    "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9",
    "M13.7 21a2 2 0 0 1-3.4 0",
  ],
  globe: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    "M2 12h20",
    "M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20",
  ],
  bank: ["M3 10l9-6 9 6", "M5 10v8M9 10v8M15 10v8M19 10v8", "M3 18h18"],
  omavero: ["M4 4h16v16H4z", "M9 12l2 2 4-4"],
  people: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    "M22 21v-2a4 4 0 0 0-3-3.9",
    "M16 3.1a4 4 0 0 1 0 7.8",
  ],
  phone: [
    "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z",
    "M12 18h.01",
  ],
  face: [
    "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2",
    "M9 9h.01M15 9h.01",
    "M9 15a3 3 0 0 0 6 0",
  ],
  export: ["M12 3v12", "M7 8l5-5 5 5", "M5 21h14"],
  signout: [
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
    "M16 17l5-5-5-5",
    "M21 12H9",
  ],
  check: ["M5 12l5 5L20 7"],
  chevron: ["M9 6l6 6-6 6"],
};
const Glyph = ({
  name,
  chevron = false,
}: {
  name: string;
  chevron?: boolean;
}) => (
  <Svg
    width={
      chevron ? s.chevronSize : name === "check" ? s.checkSize : s.iconSize
    }
    height={
      chevron ? s.chevronSize : name === "check" ? s.checkSize : s.iconSize
    }
    viewBox="0 0 24 24"
    fill="none"
    stroke={
      chevron ? s.chevronInk : name === "check" ? color.ink : color.inkSoft
    }
    strokeWidth={name === "check" ? s.checkStroke : s.iconStroke}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {(paths[name] ?? paths.card).map((d, i) => (
      <Path key={i} d={d} />
    ))}
  </Svg>
);

export type SettingsRowProps = {
  id: string;
  label: string;
  sub?: string;
  value?: string;
  icon?: string;
  accent?: boolean;
  alert?: boolean;
  digits?: boolean;
  last?: boolean;
  chevron?: boolean;
  disabled?: boolean;
  checked?: boolean;
  switchValue?: boolean;
  onPress?: () => void;
  count?: number;
  input?: TextInputProps;
};

export const SettingsRow = ({
  id,
  label,
  sub,
  value,
  icon,
  accent,
  alert,
  digits,
  last,
  chevron,
  disabled,
  checked,
  switchValue,
  onPress,
  input,
  count,
}: SettingsRowProps) => {
  const { fontScale } = useWindowDimensions();
  const expanded = fontScale > 1.35;
  const isSwitch = switchValue !== undefined;
  const isRadio = checked !== undefined;
  return (
    <Pressable
      testID={`settings-row-${id}`}
      disabled={disabled || (!onPress && !input)}
      accessible={!input}
      accessibilityRole={
        input
          ? undefined
          : isSwitch
            ? "switch"
            : isRadio
              ? "radio"
              : onPress
                ? "button"
                : undefined
      }
      accessibilityLabel={
        input ? undefined : [label, value, sub].filter(Boolean).join(", ")
      }
      accessibilityState={{
        disabled: !!disabled,
        ...(isSwitch ? { checked: switchValue } : isRadio ? { checked } : {}),
      }}
      aria-checked={isSwitch ? switchValue : isRadio ? checked : undefined}
      onPress={input ? undefined : onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rule,
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <View style={styles.icon}>
          <Glyph name={icon} />
        </View>
      ) : null}
      <View style={[styles.rowContent, expanded && styles.expanded]}>
        <View style={styles.labelCopy}>
          <Txt v="settingsLabel" tone={alert ? "alert" : "ink"}>
            {label}
          </Txt>
          {sub ? (
            <Txt v="settingsSub" tone="mute">
              {sub}
            </Txt>
          ) : null}
        </View>
        {input ? (
          <TextInput
            {...input}
            accessibilityLabel={input.accessibilityLabel ?? label}
            testID={`settings-input-${id}`}
            placeholderTextColor={color.inkMute}
            style={[styles.input, expanded && styles.expandedInput]}
          />
        ) : value ? (
          <Txt
            v={digits ? "settingsDigits" : "settingsValue"}
            tone={digits ? "ink" : "mute"}
            tabular={digits}
            style={[
              styles.value,
              accent && styles.accent,
              expanded && styles.expandedValue,
            ]}
          >
            {value}
          </Txt>
        ) : null}
      </View>
      {count !== undefined && count > 0 ? (
        <View style={styles.count}>
          <Txt v="pill" style={styles.accent}>
            {count}
          </Txt>
        </View>
      ) : null}
      {isSwitch ? (
        <View
          pointerEvents="none"
          style={[styles.switch, switchValue && styles.switchOn]}
        >
          <View style={styles.knob} />
        </View>
      ) : isRadio ? (
        <View style={[styles.icon, !checked && styles.unselected]}>
          <Glyph name="check" />
        </View>
      ) : chevron ? (
        <Glyph name="chevron" chevron />
      ) : null}
    </Pressable>
  );
};

export const SettingsGroup = ({
  title,
  foot,
  children,
}: {
  title?: string;
  foot?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    {title ? (
      <Txt v="settingsSection" tone="mute" style={styles.inset}>
        {title.toLocaleUpperCase()}
      </Txt>
    ) : null}
    <View style={styles.card}>
      <View style={styles.clip}>{children}</View>
    </View>
    {foot ? <SettingsNote>{foot}</SettingsNote> : null}
  </View>
);

export const SettingsNote = ({
  children,
  alert = false,
}: {
  children: React.ReactNode;
  alert?: boolean;
}) => (
  <Txt v="settingsFoot" tone={alert ? "alert" : "mute"} style={styles.inset}>
    {children}
  </Txt>
);

export const SettingsIdentity = ({
  title,
  subtitle,
  initials,
  onPress,
}: {
  title: string;
  subtitle: string;
  initials: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={[title, subtitle].join(", ")}
    testID="settings-identity"
    style={({ pressed }) => [
      styles.card,
      styles.identity,
      pressed && styles.pressed,
    ]}
  >
    <View style={styles.monogram}>
      <Txt v="reportHeading" style={styles.monogramText}>
        {initials}
      </Txt>
    </View>
    <View style={styles.identityCopy}>
      <Txt v="reportHeading">{title}</Txt>
      <Txt v="receipt" tone="mute">
        {subtitle}
      </Txt>
    </View>
    <Glyph name="chevron" chevron />
  </Pressable>
);

export const SettingsAction = ({
  title,
  onPress,
  danger = false,
  disabled = false,
  cancel,
  cancelLabel,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  cancel?: () => void;
  cancelLabel?: string;
}) => (
  <View style={[styles.inset, styles.actionGroup]}>
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID="settings-primary"
      style={({ pressed }) => [
        styles.action,
        danger && styles.danger,
        disabled && styles.disabled,
        pressed && styles.pressedAction,
      ]}
    >
      <Txt v="reportHeading" tone="paper" align="center">
        {title}
      </Txt>
    </Pressable>
    {cancel && cancelLabel ? (
      <SettingsQuietAction title={cancelLabel} onPress={cancel} />
    ) : null}
  </View>
);

export const SettingsQuietAction = ({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={styles.quiet}>
    <Txt v="settingsQuiet" tone="soft">
      {title}
    </Txt>
  </Pressable>
);

export const SettingsReceipt = ({
  title,
  body,
}: {
  title: string;
  body: string;
}) => (
  <View style={styles.inset} accessibilityLiveRegion="polite">
    <View style={[styles.card, styles.receipt]}>
      <Glyph name="check" />
      <View style={[styles.identityCopy, styles.receiptCopy]}>
        <Txt v="reportHeading">{title}</Txt>
        <Txt v="settingsValue" tone="soft">
          {body}
        </Txt>
      </View>
    </View>
  </View>
);

export const SettingsSurface = ({
  title,
  eyebrow,
  lead,
  onBack,
  children,
}: {
  title: string;
  eyebrow: string;
  lead?: string;
  onBack: () => void;
  children: React.ReactNode;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Screen
      floatingChrome
      keyboardAvoiding
      contentMode="canvas"
      headerContent={
        <CompactHeader
          title={eyebrow.toLocaleUpperCase()}
          eyebrow
          onBack={onBack}
        />
      }
    >
      <ScrollView
        testID="settings-scroll"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(s.bottom, insets.bottom) },
        ]}
      >
        <View style={styles.heading}>
          <Txt v="settingsTitle" accessibilityRole="header">
            {title}
          </Txt>
          {lead ? (
            <Txt v="detailBody" tone="soft">
              {lead}
            </Txt>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  actionGroup: { gap: s.actionGap },
  quiet: {
    minHeight: s.quietHeight,
    paddingHorizontal: s.quietInset,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  receiptCopy: { gap: s.receiptCopyGap },
  content: { paddingTop: s.top, paddingHorizontal: s.inset, gap: s.gap },
  heading: {
    paddingHorizontal: s.headingInset,
    paddingTop: s.headingTop,
    gap: s.headingGap,
  },
  inset: { paddingHorizontal: s.headingInset },
  section: { gap: s.sectionGap },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.streamCard,
    ...shadow.streamCard,
  },
  clip: { borderRadius: radius.streamCard, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: s.rowGap,
    minHeight: s.rowMinHeight,
    paddingHorizontal: s.inset,
  },
  rule: { boxShadow: "inset 0 -1px 0 " + color.ruleSoft },
  pressed: { backgroundColor: s.pressed },
  rowContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: s.rowGap,
  },
  labelCopy: {
    flex: 1,
    minWidth: 0,
    gap: s.copyGap,
    paddingVertical: s.rowPaddingY,
  },
  value: {
    maxWidth: s.valueMaxWidth,
    flexShrink: 1,
    textAlign: "right",
    paddingVertical: s.rowPaddingY,
  },
  accent: { color: refinement.accentInk, fontWeight: "500" },
  icon: {
    width: s.iconSlot,
    height: s.iconSlot,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    ...s.type.settingsDigits,
    flex: 1,
    minWidth: 0,
    minHeight: s.rowMinHeight,
    textAlign: "right",
    color: color.ink,
    paddingVertical: s.rowPaddingY,
  },
  expanded: { flexDirection: "column", alignItems: "stretch", gap: 0 },
  expandedValue: { textAlign: "left", paddingTop: 0, maxWidth: "100%" },
  expandedInput: { textAlign: "left" },
  unselected: { opacity: 0 },
  switch: {
    width: s.switchWidth,
    height: s.switchHeight,
    padding: s.switchInset,
    backgroundColor: color.rule,
    borderRadius: radius.pill,
    alignItems: "flex-start",
  },
  switchOn: { backgroundColor: color.ink, alignItems: "flex-end" },
  knob: {
    width: s.knobSize,
    height: s.knobSize,
    borderRadius: radius.pill,
    backgroundColor: color.card,
    boxShadow: s.knobShadow,
  },
  count: {
    minHeight: refinement.pillHeight,
    paddingHorizontal: s.sectionGap,
    borderRadius: radius.pill,
    backgroundColor: color.accentWash,
    justifyContent: "center",
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: s.monogramGap,
    padding: s.inset,
  },
  identityCopy: { flex: 1, minWidth: 0, gap: s.copyGap },
  monogram: {
    width: s.monogramSize,
    height: s.monogramSize,
    borderRadius: s.monogramRadius,
    backgroundColor: s.monogramGround,
    alignItems: "center",
    justifyContent: "center",
  },
  monogramText: { color: s.monogramInk },
  action: {
    minHeight: s.actionHeight,
    borderRadius: radius.pill,
    backgroundColor: color.ink,
    justifyContent: "center",
    paddingHorizontal: s.inset,
    paddingVertical: s.rowPaddingY,
  },
  danger: { backgroundColor: color.alert },
  disabled: { opacity: 0.4 },
  pressedAction: { opacity: 0.85 },
  receipt: {
    flexDirection: "row",
    gap: s.rowGap,
    paddingHorizontal: s.inset,
    paddingVertical: s.monogramGap,
  },
});
