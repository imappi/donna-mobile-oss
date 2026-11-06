import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getLocale, setLocale } from "../i18n";
import { settingsCopy, type SettingsPage } from "../i18n/settings";
import { settings } from "../design/tokens";
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

test("13 settings screens retain the reference grouping, title and native row geometry", () => {
  const locale = getLocale();
  for (const language of ["fi", "en"] as const) {
    setLocale(language);
    for (const page of pages) {
      const copy = settingsCopy(page);
      assert.ok(copy.title);
      assert.ok(copy.sections.length);
      assert.ok(
        copy.sections.every((section) =>
          section.rows.every((row) => row.label),
        ),
      );
    }
  }
  setLocale("fi");
  assert.equal(settingsCopy("home").title, "Asetukset");
  assert.deepEqual(
    settingsCopy("home").sections.map((section) => section.title),
    ["Kirjanpito", "Yritys", "Donna", "Tili", undefined],
  );
  assert.deepEqual(
    settingsCopy("language").sections[0].rows.map((row) => row.label),
    ["Suomi", "Svenska", "English"],
  );
  assert.equal(settings.rowMinHeight, 54);
  assert.equal(settings.gap, 22);
  assert.equal(settings.monogramSize, 48);
  assert.equal(settings.switchWidth, 51);
  assert.equal(settings.switchHeight, 31);
  assert.equal(settings.type.settingsTitle.lineHeight, 34);
  setLocale(locale);
});
test("handoff claims and static identities are not shipped as account facts", () => {
  const copy = readFileSync(
    new URL("../i18n/settings.ts", import.meta.url),
    "utf8",
  );
  for (const text of [
    "Mattin",
    "Meikäläinen",
    "2345678-1",
    "anna@tilitoimisto",
    "90 päivää",
    "6 vuotta",
    "aina kalenterivuosi",
  ])
    assert.equal(copy.includes(text), false, text);
  const source = readFileSync(
    new URL("../../src/state/SettingsRoute.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /row\.count\s*=\s*status\.data\?\.needs_you_count/);
  assert.match(source, /confirmOnboardingProfile/);
  assert.match(source, /candidate_id:\s*candidate!/);
  const layout = readFileSync(
    new URL("../../src/app/(tabs)/_layout.tsx", import.meta.url),
    "utf8",
  );
  assert.match(layout, /router.push\('\/settings'\)/);
  assert.doesNotMatch(layout, /<OwnerMenu/);
});
