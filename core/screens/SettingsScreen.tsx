import React from "react";
import {
  SettingsAction,
  SettingsGroup,
  SettingsIdentity,
  SettingsNote,
  SettingsQuietAction,
  SettingsReceipt,
  SettingsRow,
  SettingsSurface,
  type SettingsRowProps,
} from "../design";
import {
  settingsCopy,
  settingsText as st,
  type SettingsPage,
} from "../i18n/settings";
export type SettingsSection = {
  title?: string;
  foot?: string;
  rows: SettingsRowProps[];
};
export type SettingsScreenProps = {
  page: SettingsPage;
  eyebrow: string;
  onBack: () => void;
  sections: SettingsSection[];
  identity?: {
    title: string;
    subtitle: string;
    initials: string;
    onPress: () => void;
  };
  action?: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    danger?: boolean;
  };
  cancel?: () => void;
  receipt?: { title: string; body: string };
  note?: string;
  error?: string;
  retry?: () => void;
  version?: string;
};
export const SettingsScreen = ({
  page,
  eyebrow,
  onBack,
  sections,
  identity,
  action,
  cancel,
  receipt,
  note,
  error,
  retry,
  version,
}: SettingsScreenProps) => {
  const copy = settingsCopy(page);
  return (
    <SettingsSurface
      title={copy.title}
      eyebrow={eyebrow}
      lead={copy.lead}
      onBack={onBack}
    >
      {identity ? <SettingsIdentity {...identity} /> : null}
      {sections.map((section, i) => (
        <SettingsGroup
          key={`${page}-${i}`}
          title={section.title}
          foot={section.foot}
        >
          {section.rows.map((row, index) => (
            <SettingsRow
              {...row}
              key={row.id}
              last={index === section.rows.length - 1}
            />
          ))}
        </SettingsGroup>
      ))}
      {error ? <SettingsNote alert>{error}</SettingsNote> : null}
      {retry ? (
        <SettingsQuietAction title={st("retry")} onPress={retry} />
      ) : null}
      {receipt ? (
        <SettingsReceipt {...receipt} />
      ) : action ? (
        <SettingsAction
          {...action}
          cancel={cancel}
          cancelLabel={st("cancel")}
        />
      ) : null}
      {note ? <SettingsNote>{note}</SettingsNote> : null}
      {version ? <SettingsNote>{version}</SettingsNote> : null}
    </SettingsSurface>
  );
};
