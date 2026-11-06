import React, { useCallback, useRef, useState } from "react";
import { ActionSheetIOS, Alert, AppState, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Entity,
  MobileSettingsAction,
  OnboardingProfileConfirmation,
  RegistryCandidate,
} from "@core/api";
import {
  SettingsScreen,
  type SettingsSection,
  type SettingsScreenProps,
} from "@core/screens/SettingsScreen";
import {
  settingsCopy,
  settingsText as st,
  type SettingsPage,
} from "@core/i18n/settings";
import { formatDate, formatMonth, getLocale, t } from "@core/i18n";
import { shell } from "@/shell";
import { useSession } from "./session";
import { useBooksStatus, useBusinessSetup } from "./hooks";
import { useDeviceSettings } from "./deviceSettings";
import { notificationPermissionGranted } from "./notificationPermission";
import { registerPush, unregisterPush } from "./pushRegistration";

const pages: SettingsPage[] = [
  "home",
  "business",
  "register",
  "vatPeriod",
  "fiscalYear",
  "notifications",
  "language",
  "bank",
  "omavero",
  "accountant",
  "phone",
  "exportData",
  "delete",
];
const businessFields = [
  "business_name",
  "owner_name",
  "profession",
  "description",
  "operating_area",
  "billing_basis",
] as const;
type EditableField = (typeof businessFields)[number] | "business_address";
const notificationKeys = {
  needsYou: "needs_you",
  dueDates: "due_dates",
  monthly: "monthly_summary",
  everyReceipt: "every_receipt",
} as const;
const forwardPages = new Set<SettingsPage>([
  "bank",
  "omavero",
  "accountant",
  "phone",
  "exportData",
]);

function Controller({ page, entity }: { page: SettingsPage; entity: Entity }) {
  const { api, state, signOut, applyProfileUpdate } = useSession();
  const { value: device, update: updateDevice } = useDeviceSettings();
  const router = useRouter();
  const cache = useQueryClient();
  const principal = state.phase === "signedIn" ? state.principal : null;
  const settings = useQuery({
    queryKey: ["settings", principal?.id, entity.id],
    queryFn: () => api.getSettings(entity.id),
    retry: false,
  });
  const setup = useBusinessSetup();
  const status = useBooksStatus();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string>();
  const [receipt, setReceipt] = useState<SettingsScreenProps["receipt"]>();
  const [editor, setEditor] = useState<{
    field: EditableField;
    value: string;
  } | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<RegistryCandidate | null>(null);
  const [manual, setManual] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [legalForm, setLegalForm] = useState<"sole_trader" | "limited_company">(
    "sole_trader",
  );
  const [draft, setDraft] = useState({
    email: "",
    phone: "",
    acctComment: true,
    acctPost: false,
    exportFormat: "all",
    exportRange: "this",
  });
  const [hardware, setHardware] = useState(false);
  const [permission, setPermission] = useState(false);
  const [notificationAvailable, setNotificationAvailable] = useState(false);
  const copy = settingsCopy(page);
  const identity = setup.data?.identity;
  const businessId = id ?? identity?.business_id ?? "";
  const fi = getLocale() === "fi";
  const isFinland = entity.country === "FI";
  const go = (target: SettingsPage) =>
    router.push({ pathname: "/settings/[page]", params: { page: target } });
  const back = () =>
    router.canGoBack() ? router.back() : router.replace("/actions");
  const perform = async (work: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await work();
    } catch {
      setError(st("saveError"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const saveSettings = (action: MobileSettingsAction) =>
    perform(async () => {
      const result = await api.updateSettings(entity.id, action);
      cache.setQueryData(
        ["settings", principal?.id, entity.id],
        result.settings,
      );
    });
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      if (Platform.OS === "web") return;
      const refresh = () => {
        Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ])
          .then(([has, enrolled]) => {
            if (mounted) setHardware(has && enrolled);
          })
          .catch(() => {});
        if (!(
          Platform.OS === "android" &&
          (Constants.executionEnvironment ===
            ExecutionEnvironment.StoreClient ||
            Constants.expoGoConfig != null)
        )) {
          import("expo-notifications")
            .then(async (notifications) => {
              const allowed = await notifications.getPermissionsAsync();
              if (mounted) {
                setPermission(allowed.granted);
                setNotificationAvailable(true);
              }
            })
            .catch(() => {});
        }
      };
      refresh();
      const subscription = AppState.addEventListener("change", (next) => {
        if (next === "active") refresh();
      });
      return () => {
        mounted = false;
        subscription.remove();
      };
    }, []),
  );
  const toggleBiometrics = () =>
    perform(async () => {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("auth.biometricPrompt"),
        cancelLabel: st("cancel"),
      });
      if (result.success)
        await updateDevice({ biometrics: !device.biometrics });
    });
  const toggleNotifications = () =>
    perform(async () => {
      if (device.notifications && permission) {
        await updateDevice({ notifications: false });
        await unregisterPush(api);
        return;
      }
      const notifications = await import("expo-notifications");
      const granted = await notificationPermissionGranted(notifications, true);
      setPermission(granted);
      if (!granted) {
        setError(st("permissionDenied"));
        return;
      }
      await updateDevice({ notifications: true });
      await registerPush(api);
    });
  const confirmSignOut = () => {
    const run = () =>
      perform(async () => {
        try {
          await signOut();
        } finally {
          cache.clear();
          router.replace("/onboarding/phone");
        }
      });
    if (Platform.OS === "ios")
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: st("signOutBody"),
          options: [st("cancel"), st("signOut")],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
        },
        (index) => {
          if (index === 1) void run();
        },
      );
    else if (Platform.OS === "web") {
      if (window.confirm(st("signOutBody"))) void run();
    } else
      Alert.alert(st("signOut"), st("signOutBody"), [
        { text: st("cancel"), style: "cancel" },
        { text: st("signOut"), style: "destructive", onPress: run },
      ]);
  };
  const fieldValue = (field: EditableField) =>
    field === "owner_name"
      ? (principal?.display_name ?? "")
      : field === "business_name"
        ? entity.display_name
        : (entity.business_profile?.[field] ?? "");
  const edit = (field: EditableField) => {
    setEditor({ field, value: fieldValue(field) });
    setReceipt(undefined);
    setError(undefined);
  };
  const saveProfile = () =>
    perform(async () => {
      if (!editor || !principal) return;
      const input: OnboardingProfileConfirmation = {
        owner_name: principal.display_name,
        business_name: entity.display_name,
        description: "",
        operating_area: "",
        people_involved: [],
        payment_methods: [],
        spending_categories: [],
        ...entity.business_profile,
        [editor.field]: editor.value.trim(),
        confirmed_exact_fields: ["owner_name", "business_name"],
      };
      const result = await api.confirmOnboardingProfile(entity.id, input);
      applyProfileUpdate(result.principal, result.entity);
      setEditor(null);
      cache.invalidateQueries({ queryKey: ["status", entity.id] });
    });
  const registryLookup = () =>
    perform(async () => {
      setReceipt(undefined);
      setCandidate(null);
      try {
        const response = await api.lookupBusiness(entity.id, businessId);
        setCandidate(response.candidate);
        if (!response.candidate) setError(st("registryEmpty"));
      } catch {
        setError(st("registryError"));
      }
    });
  const saveRegistry = () =>
    perform(async () => {
      if (!manual && !candidate) return;
      const result = await api.updateBusinessSetup(
        entity.id,
        manual
          ? {
              type: "confirm_manual",
              business_id: businessId,
              legal_name: legalName,
              legal_form: legalForm,
            }
          : { type: "confirm_registry", candidate_id: candidate!.candidate_id },
      );
      cache.setQueryData(["business-setup", entity.id], result.setup);
      setCandidate(null);
      setManual(false);
      setReceipt({ title: st("saved"), body: st("registrySaved") });
    });

  const sections: SettingsSection[] = copy.sections.map((section, s) => ({
    ...section,
    rows: section.rows.map((r, i) => {
      const row: SettingsSection["rows"][number] = {
        id: page + "-" + s + "-" + i,
        label: r.label,
        sub: r.sub,
        icon: r.icon,
        alert: r.alert,
        digits: r.mono,
      };
      if (r.go && pages.includes(r.go as SettingsPage)) {
        row.onPress = () => go(r.go as SettingsPage);
        row.chevron = true;
      }
      if (page === "home") {
        if (s === 0) {
          const routes = [
            "/books-status",
            "/taxes",
            "/month",
            "/activity",
          ] as const;
          row.onPress = () => router.push(routes[i]);
          row.chevron = true;
          if (i === 0) {
            row.count = status.data?.needs_you_count;
            row.value = status.data?.periods[0]
              ? formatMonth(
                  status.data.periods[0].period_start.slice(0, 7),
                  true,
                )
              : undefined;
          }
        } else if (s === 1) {
          row.value = [
            entity.display_name,
            identity?.business_id ?? st("add"),
            settings.data?.vat_period
              ? settingsCopy("vatPeriod").sections[0].rows[
                  ["month", "quarter", "year"].indexOf(settings.data.vat_period)
                ].label
              : st("add"),
            settings.data?.financial_year.current ?? st("unknown"),
          ][i];
          row.accent =
            (i === 1 && !identity) || (i === 2 && !settings.data?.vat_period);
        } else if (s === 2) {
          row.value = [
            device.notifications && permission ? st("on") : st("off"),
            fi ? "Suomi" : "English",
            st("notConnected"),
            st("notConnected"),
            st("unavailable"),
          ][i];
        } else if (s === 3) {
          if (i === 0) {
            row.value = settings.data?.phone_number ?? undefined;
            if (!row.value) row.sub = st("phoneUnknown");
          }
          if (i === 1) {
            row.label = Platform.OS === "android" ? st("biometrics") : r.label;
            row.switchValue = hardware && device.biometrics;
            row.disabled = !hardware || busy;
            row.onPress = toggleBiometrics;
            if (!hardware) row.sub = st("noBiometrics");
          }
          if (i === 2) row.value = st("pdf");
          if (i === 3) row.onPress = confirmSignOut;
        }
      } else if (page === "business") {
        if (s === 0 || (s === 1 && i === 2)) {
          const field = s === 0 ? businessFields[i] : "business_address";
          row.value = fieldValue(field) || st("add");
          row.accent = !fieldValue(field);
          row.onPress = () => edit(field);
          row.chevron = true;
          if (editor?.field === field) {
            row.value = undefined;
            row.chevron = false;
            row.input = {
              value: editor.value,
              onChangeText: (value) => setEditor({ field, value }),
              autoFocus: true,
              maxLength:
                field === "description"
                  ? 600
                  : field === "owner_name"
                    ? 120
                    : field === "business_name"
                      ? 160
                      : 240,
              multiline: field === "description",
              returnKeyType: "done",
            };
          }
        } else if (i === 0) {
          row.value = identity?.business_id ?? st("add");
          row.accent = !identity;
        } else {
          row.value = identity ? st(identity.legal_form) : st("unknown");
          row.onPress = () => go("register");
          row.chevron = true;
        }
      } else if (page === "register") {
        row.input = {
          value: businessId,
          onChangeText: (value) => {
            setId(value);
            setCandidate(null);
            setReceipt(undefined);
            setError(undefined);
          },
          placeholder: "1234567-8",
          autoCapitalize: "none",
          maxLength: 9,
        };
      } else if (page === "vatPeriod") {
        row.checked = settings.data?.vat_period === r.option;
        row.disabled = busy || !settings.data;
        row.onPress = () =>
          saveSettings({
            type: "set_vat_period",
            vat_period: r.option as "month" | "quarter" | "year",
          });
      } else if (page === "fiscalYear")
        row.value =
          [
            settings.data?.financial_year.current,
            settings.data?.financial_year.first,
            settings.data?.financial_year.statements,
          ][i] ?? st("unknown");
      else if (page === "notifications") {
        if (s === 0) {
          row.switchValue = permission && device.notifications;
          row.disabled = !notificationAvailable || busy;
          row.onPress = toggleNotifications;
        } else {
          const key =
            notificationKeys[r.toggle as keyof typeof notificationKeys];
          row.switchValue = settings.data?.notifications[key] ?? false;
          row.disabled = !settings.data || busy;
          row.onPress = () =>
            settings.data &&
            saveSettings({
              type: "set_notifications",
              notifications: {
                ...settings.data.notifications,
                [key]: !settings.data.notifications[key],
              },
            });
        }
      } else if (page === "language") {
        row.checked = getLocale() === r.option;
        row.disabled = r.option === "sv" || busy;
        if (r.option === "sv") row.sub = st("coming");
        else
          row.onPress = () =>
            perform(() => updateDevice({ locale: r.option as "fi" | "en" }));
      } else if (page === "bank" && s === 1) {
        row.value = st("coming");
      } else if (page === "accountant") {
        if (s === 0)
          row.input = {
            value: draft.email,
            onChangeText: (email) => setDraft((p) => ({ ...p, email })),
            placeholder: "name@example.test",
            keyboardType: "email-address",
            autoCapitalize: "none",
            autoCorrect: false,
          };
        else if (i > 0) {
          const key = i === 1 ? "acctComment" : "acctPost";
          row.switchValue = draft[key];
          row.onPress = () => setDraft((p) => ({ ...p, [key]: !p[key] }));
        }
      } else if (page === "phone") {
        if (i === 0)
          row.value = settings.data?.phone_number ?? st("phoneUnknown");
        else
          row.input = {
            value: draft.phone,
            onChangeText: (phone) => setDraft((p) => ({ ...p, phone })),
            placeholder: "+358",
            keyboardType: "phone-pad",
            maxLength: 16,
          };
      } else if (page === "exportData") {
        const key = s === 0 ? "exportFormat" : "exportRange";
        row.checked = draft[key] === r.option;
        row.onPress = () => setDraft((p) => ({ ...p, [key]: r.option! }));
      }
      return row;
    }),
  }));

  let action: SettingsScreenProps["action"];
  let cancel: (() => void) | undefined;
  let note: string | undefined = copy.foot;
  if (forwardPages.has(page)) {
    note = st("notConfigured");
    if (copy.cta)
      action = { title: copy.cta, disabled: true, onPress: () => {} };
  }
  if (page === "business") {
    if (isFinland)
      sections.push({
        rows: [
          {
            id: "earlier-records",
            label: st("earlierRecords"),
            value: st("addRecords"),
            chevron: true,
            onPress: () => router.push("/business-setup"),
          },
        ],
      });
    if (editor) {
      action = {
        title: busy ? st("saving") : st("save"),
        disabled:
          busy ||
          (["owner_name", "business_name"].includes(editor.field) &&
            !editor.value.trim()),
        onPress: saveProfile,
      };
      cancel = () => setEditor(null);
    }
  }
  if (page === "register") {
    const shown = candidate ?? identity;
    if (shown && !manual)
      sections.push({
        title: settingsCopy("business").sections[1].title,
        foot:
          shown.source === "prh_ytj"
            ? st("registrySource", {
                date: formatDate(shown.fetched_at?.slice(0, 10) ?? ""),
              })
            : st("ownerSource"),
        rows: [
          {
            id: "legal-name",
            label: st("registeredName"),
            value: shown.legal_name,
          },
          {
            id: "legal-form",
            label: st("legalForm"),
            value: st(shown.legal_form),
          },
          {
            id: "legal-address",
            label: st("registeredAddress"),
            value: shown.registered_address || st("unknown"),
          },
        ],
      });
    if (manual)
      sections.push({
        foot: st("ownerSource"),
        rows: [
          {
            id: "manual-name",
            label: st("registeredName"),
            input: {
              value: legalName,
              onChangeText: setLegalName,
              maxLength: 1000,
            },
          },
          ...(["sole_trader", "limited_company"] as const).map((form) => ({
            id: form,
            label: st(form),
            checked: legalForm === form,
            onPress: () => setLegalForm(form),
          })),
        ],
      });
    else
      sections.push({
        rows: [
          {
            id: "manual",
            label: st("manual"),
            onPress: () => {
              setManual(true);
              setCandidate(null);
              setReceipt(undefined);
              setLegalName(identity?.legal_name ?? "");
              setLegalForm(
                identity?.legal_form === "limited_company"
                  ? "limited_company"
                  : "sole_trader",
              );
            },
            chevron: true,
          },
        ],
      });
    action = {
      title: busy
        ? st("loading")
        : manual
          ? st("save")
          : candidate
            ? st("confirmRegistry")
            : copy.cta!,
      disabled:
        busy ||
        !isFinland ||
        !businessId.trim() ||
        (manual && !legalName.trim()),
      onPress: manual || candidate ? saveRegistry : registryLookup,
    };
    if (manual) cancel = () => setManual(false);
    if (!isFinland) note = st("unavailable");
  }
  if (page === "notifications")
    note = !notificationAvailable
      ? st("unavailable")
      : st("notificationDevice");
  if (page === "delete") {
    action = {
      title: busy ? st("saving") : copy.cta!,
      danger: true,
      disabled: busy,
      onPress: () =>
        perform(async () => {
          const result = await api.requestAccountDeletion();
          setReceipt({
            title: st("deletionTitle"),
            body:
              settings.data?.source === "sample"
                ? st("deletionBody")
                : result.message,
          });
        }),
    };
    cancel = receipt ? undefined : back;
  }
  if (
    (page === "vatPeriod" || page === "home") &&
    settings.data?.source === "sample"
  )
    note = st("sample");
  const showError = error ?? (settings.isError ? st("loadError") : undefined);
  const formLabel = identity
    ? st(identity.legal_form)
    : entity.entity_type === "sole_trader" ||
        entity.entity_type === "limited_company"
      ? st(entity.entity_type)
      : undefined;
  const multiEntity = state.phase === "signedIn" && state.entities.length > 1;
  const identityProps =
    page === "home" || page === "business"
      ? {
          title:
            page === "home"
              ? (principal?.display_name ?? "")
              : entity.display_name,
          subtitle:
            page === "home"
              ? [entity.display_name, formLabel].filter(Boolean).join(" · ")
              : [principal?.display_name, entity.business_profile?.profession]
                  .filter(Boolean)
                  .join(" · "),
          initials:
            (page === "home" ? principal?.display_name : entity.display_name)
              ?.split(/\s+/)
              .slice(0, 2)
              .map((word) => word[0])
              .join("")
              .toLocaleUpperCase() ?? "",
          onPress: () =>
            page === "home" && multiEntity
              ? router.push("/entities")
              : page === "business"
                ? edit("business_name")
                : go("business"),
        }
      : undefined;
  if (page === "home" && multiEntity)
    sections[1].rows.push({
      id: "switch-books",
      label: st("switchBooks"),
      chevron: true,
      onPress: () => router.push("/entities"),
    });
  if (busy)
    for (const section of sections)
      for (const row of section.rows) {
        row.disabled = true;
        if (row.input) row.input = { ...row.input, editable: false };
      }
  return (
    <SettingsScreen
      page={page}
      eyebrow={page === "home" ? entity.display_name : copy.eyebrow}
      onBack={back}
      sections={sections}
      identity={identityProps}
      action={action}
      cancel={cancel}
      receipt={receipt}
      note={note}
      error={showError}
      retry={
        settings.isError
          ? () => {
              void settings.refetch();
            }
          : undefined
      }
      version={
        page === "home"
          ? shell.brandName + " " + (Constants.expoConfig?.version ?? "")
          : undefined
      }
    />
  );
}
export const SettingsRoute = ({ page = "home" }: { page?: string }) => {
  const { state } = useSession();
  if (state.phase === "loading") return null;
  if (state.phase === "locked") return <Redirect href="/unlock" />;
  if (state.phase !== "signedIn") return <Redirect href="/onboarding/phone" />;
  const entity = state.entities.find((item) => item.id === state.entityId);
  if (!entity) return <Redirect href="/actions" />;
  if (!pages.includes(page as SettingsPage))
    return <Redirect href="/settings" />;
  return (
    <Controller
      key={entity.id + "-" + page}
      page={page as SettingsPage}
      entity={entity}
    />
  );
};
