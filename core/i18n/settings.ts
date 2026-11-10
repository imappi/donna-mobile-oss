// Static copy transcribed from the user-supplied Settings handoff.
// Dated safety corrections and unavailable capabilities: design/SETTINGS-REFINEMENT.md.
import { getBrandName, getLocale, type Locale } from "./index";

export type SettingsPage =
  | "home"
  | "business"
  | "register"
  | "vatPeriod"
  | "fiscalYear"
  | "notifications"
  | "language"
  | "bank"
  | "omavero"
  | "accountant"
  | "phone"
  | "exportData"
  | "delete";
export type SettingsCopyRow = {
  label: string;
  sub?: string;
  icon?: string;
  toggle?: string;
  radio?: string;
  option?: string;
  go?: string;
  noChevron?: boolean;
  noIcon?: boolean;
  alert?: boolean;
  accent?: boolean;
  mono?: boolean;
};
export type SettingsPageCopy = {
  eyebrow: string;
  title: string;
  lead?: string;
  sections: { title?: string; rows: SettingsCopyRow[]; foot?: string }[];
  cta?: string;
  ctaAlert?: boolean;
  foot?: string;
};
type SettingsLocaleCopy = {
  cancel: string;
  signOut: string;
  signOutBody: string;
  terms: string;
  privacy: string;
} & Record<SettingsPage, SettingsPageCopy>;
/**
 * Both locales typed alike, and checked for string, placeholder and row
 * parity by core/screens/i18nParity.test.ts. `{brand}` comes from the shell.
 */
export const settingsLocales: Record<Locale, SettingsLocaleCopy> = {
  fi: {
    cancel: "Peruuta",
    signOut: "Kirjaudu ulos",
    signOutBody:
      "Kirjanpitosi pysyy tallessa. Kirjaudu takaisin puhelinnumerollasi.",
    terms: "Käyttöehdot",
    privacy: "Tietosuoja",
    home: {
      eyebrow: "",
      title: "Asetukset",
      sections: [
        {
          title: "Kirjanpito",
          rows: [
            {
              icon: "status",
              label: "Tilanne",
            },
            {
              icon: "tax",
              label: "Verot",
            },
            {
              icon: "month",
              label: "Kuukaudet",
            },
            {
              icon: "activity",
              label: "Tapahtumat",
            },
          ],
        },
        {
          title: "Yritys",
          rows: [
            {
              icon: "card",
              label: "Yrityksen tiedot",
              go: "business",
            },
            {
              icon: "id",
              label: "Y-tunnus ja rekisteri",
              accent: true,
              go: "register",
            },
            {
              icon: "calendar",
              label: "ALV-kausi",
              go: "vatPeriod",
            },
            {
              icon: "calendar",
              label: "Tilikausi",
              go: "fiscalYear",
            },
          ],
        },
        {
          title: "{brand}",
          rows: [
            {
              icon: "bell",
              label: "Ilmoitukset",
              go: "notifications",
            },
            {
              icon: "globe",
              label: "Kieli",
              go: "language",
            },
            {
              icon: "bank",
              label: "Pankki",
              go: "bank",
            },
            {
              icon: "omavero",
              label: "OmaVero",
              go: "omavero",
            },
            {
              icon: "people",
              label: "Kirjanpitäjä",
              go: "accountant",
            },
          ],
          foot: "Yhteydet otetaan käyttöön vain luvallasi. Pankki-, vero- ja kirjanpitäjäyhteyksiä ei ole vielä toteutettu.",
        },
        {
          title: "Tili",
          rows: [
            {
              icon: "phone",
              label: "Puhelinnumero",
              go: "phone",
            },
            {
              icon: "face",
              label: "Face ID",
              sub: "Avaa kirjanpito kasvoillasi",
              toggle: "faceId",
            },
            {
              icon: "export",
              label: "Vie tiedot",
              go: "exportData",
            },
            {
              icon: "signout",
              label: "Kirjaudu ulos",
              go: "sheet",
              noChevron: true,
            },
          ],
        },
        {
          rows: [
            {
              label: "Poista tili",
              go: "delete",
              alert: true,
              noChevron: true,
              noIcon: true,
            },
          ],
        },
      ],
    },
    business: {
      eyebrow: "Asetukset",
      title: "Yrityksen tiedot",
      lead: "Näin {brand} ymmärtää yrityksesi. Napauta tietoa, korjaa ja tallenna.",
      sections: [
        {
          title: "Perustiedot",
          rows: [
            {
              label: "Yrityksen nimi",
              noIcon: true,
            },
            {
              label: "Yrittäjä",
              noIcon: true,
            },
            {
              label: "Ammatti",
              noIcon: true,
            },
            {
              label: "Mitä teet",
              noIcon: true,
            },
            {
              label: "Toiminta-alue",
              noIcon: true,
            },
            {
              label: "Laskutus",
              noIcon: true,
            },
          ],
        },
        {
          title: "Rekisteri",
          rows: [
            {
              label: "Y-tunnus",
              accent: true,
              noIcon: true,
              sub: "Haen virallisen nimen ja yritysmuodon PRH:sta.",
              go: "register",
            },
            {
              label: "Yritysmuoto",
              noIcon: true,
            },
            {
              label: "Yrityksen osoite",
              accent: true,
              noIcon: true,
            },
          ],
          foot: "Rekisteritiedot ja itse antamasi tiedot pidetään erillään. Y-tunnus ei vahvista oikeutta toimia yrityksen puolesta.",
        },
      ],
    },
    register: {
      eyebrow: "Yritys",
      title: "Y-tunnus ja rekisteri",
      lead: "Anna Y-tunnus, niin haen saatavilla olevat viralliset tiedot PRH:sta. Tarkista tiedot ennen tallentamista.",
      sections: [
        {
          rows: [
            {
              label: "Y-tunnus",
              noIcon: true,
              noChevron: true,
              mono: true,
            },
          ],
          foot: "Muodossa 1234567-8. Toiminimien tietoja ei saa tästä avoimesta rajapinnasta; ne voi lisätä itse.",
        },
      ],
      cta: "Hae tiedot",
    },
    vatPeriod: {
      eyebrow: "Yritys",
      title: "ALV-kausi",
      lead: "Kuinka usein ilmoitat ja maksat arvonlisäveron. Kausi näkyy OmaVerossa tai verottajan päätöksessä.",
      sections: [
        {
          rows: [
            {
              label: "Kuukausi",
              radio: "vat",
              option: "month",
              noIcon: true,
            },
            {
              label: "Neljännesvuosi",
              radio: "vat",
              option: "quarter",
              noIcon: true,
            },
            {
              label: "Vuosi",
              radio: "vat",
              option: "year",
              noIcon: true,
            },
          ],
          foot: "Valitse verottajan vahvistama kausi. Tämä ei muuta verottajan tietoja eikä lähetä ilmoituksia.",
        },
      ],
    },
    fiscalYear: {
      eyebrow: "Yritys",
      title: "Tilikausi",
      lead: "Yrityksesi tilikausi ja tilinpäätöstiedot. Vahvista tiedot kirjanpidosta tai virallisista asiakirjoista.",
      sections: [
        {
          rows: [
            {
              label: "Nykyinen tilikausi",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Ensimmäinen tilikausi",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Tilinpäätös",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
      ],
    },
    notifications: {
      eyebrow: "Asetukset",
      title: "Ilmoitukset",
      lead: "Kerron vain, kun sillä on väliä. Ei markkinointia.",
      sections: [
        {
          rows: [
            {
              label: "Salli ilmoitukset",
              toggle: "notifications",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
        {
          title: "Mistä kerron",
          rows: [
            {
              label: "Kun tarvitsen sinua",
              sub: "Kysymykset ja hyväksynnät",
              toggle: "needsYou",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Eräpäivät",
              sub: "Muistutukset tulevista määräajoista",
              toggle: "dueDates",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Kuukausikooste",
              sub: "Yhteenveto kuukauden tapahtumista",
              toggle: "monthly",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Jokainen kuitti",
              sub: "Vahvistus, kun kuitti on kirjattu",
              toggle: "everyReceipt",
              noIcon: true,
              noChevron: true,
            },
          ],
          foot: "Asetukset tallentuvat esikatselupalvelimelle. Ilmoitusten toimitusta ei ole vielä yhdistetty.",
        },
      ],
    },
    language: {
      eyebrow: "{brand}",
      title: "Kieli",
      lead: "Kieli, jolla puhun ja kirjoitan sinulle.",
      sections: [
        {
          rows: [
            {
              label: "Suomi",
              radio: "lang",
              option: "fi",
              noIcon: true,
            },
            {
              label: "Svenska",
              radio: "lang",
              option: "sv",
              noIcon: true,
            },
            {
              label: "English",
              radio: "lang",
              option: "en",
              noIcon: true,
            },
          ],
          foot: "Valinta vaihtaa sovelluksen kielen tällä laitteella. Svenska on tulossa.",
        },
      ],
    },
    bank: {
      eyebrow: "{brand}",
      title: "Pankki",
      lead: "Pankkiyhteyden kautta {brand} saa tilitapahtumat suoraan. Yhteys otetaan käyttöön vasta, kun olet antanut luvan.",
      sections: [
        {
          title: "Mitä saan",
          rows: [
            {
              label: "Tilitapahtumat ja saldo",
              sub: "Vain lukuoikeus",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "En maksa enkä siirrä mitään",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
        {
          title: "Valitse pankki",
          rows: [
            {
              label: "OP",
              noIcon: true,
              go: "done",
            },
            {
              label: "Nordea",
              noIcon: true,
              go: "done",
            },
            {
              label: "Danske Bank",
              noIcon: true,
              go: "done",
            },
            {
              label: "S-Pankki",
              noIcon: true,
              go: "done",
            },
            {
              label: "Muu pankki",
              noIcon: true,
              go: "done",
            },
          ],
          foot: "Pankkiyhteys ei ole vielä käytössä. Emme pyydä pankkitunnuksia tässä sovelluksessa.",
        },
      ],
    },
    omavero: {
      eyebrow: "{brand}",
      title: "OmaVero",
      lead: "Täältä voit myöhemmin yhdistää verotietosi. Valtuuden sisältö tarkistetaan ennen sen antamista.",
      sections: [
        {
          title: "Mitä näen",
          rows: [
            {
              label: "ALV-ilmoitukset ja -maksut",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Ennakkoverot ja eräpäivät",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Verovelka ja palautukset",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
        {
          title: "Mitä en tee",
          rows: [
            {
              label: "En lähetä ilmoituksia",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "En maksa veroja",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
      ],
      cta: "Anna valtuus Suomi.fi:ssä",
      foot: "Suomi.fi-yhteyttä ei ole vielä toteutettu. Mitään valtuutta ei anneta tästä esikatselusta.",
    },
    accountant: {
      eyebrow: "{brand}",
      title: "Kirjanpitäjä",
      lead: "Jaa kirjanpitäjällesi pääsy. Hän näkee saman kuin sinä ja voi kommentoida – ei muuttaa mitään ilman lupaasi.",
      sections: [
        {
          rows: [
            {
              label: "Sähköposti",
              noIcon: true,
              noChevron: true,
              mono: true,
            },
          ],
        },
        {
          title: "Oikeudet",
          rows: [
            {
              label: "Näkee kirjanpidon ja tositteet",
              sub: "Aina mukana",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Voi kommentoida",
              toggle: "acctComment",
              noIcon: true,
            },
            {
              label: "Voi tehdä kirjauksia",
              sub: "Kirjaukset näkyvät Kirjanpidossa hänen nimellään",
              toggle: "acctPost",
              noIcon: true,
            },
          ],
          foot: "Kutsuja tai pääsyoikeuksia ei vielä lähetetä. Valinnat ovat vain luonnos.",
        },
      ],
      cta: "Lähetä kutsu",
    },
    phone: {
      eyebrow: "Tili",
      title: "Puhelinnumero",
      lead: "Numero on tunnuksesi. Sen vaihtaminen vaatii erillisen vahvistuksen.",
      sections: [
        {
          rows: [
            {
              label: "Nykyinen",
              noIcon: true,
              noChevron: true,
              mono: true,
            },
            {
              label: "Uusi numero",
              noIcon: true,
              noChevron: true,
              mono: true,
            },
          ],
        },
      ],
      cta: "Lähetä koodit",
    },
    exportData: {
      eyebrow: "Tili",
      title: "Vie tiedot",
      lead: "Kirjanpitosi on sinun. Saat sen itsellesi milloin vain – ilman kysymyksiä.",
      sections: [
        {
          title: "Muoto",
          rows: [
            {
              label: "PDF",
              sub: "Pääkirja, tositteet ja raportit luettavana",
              radio: "exportFormat",
              option: "pdf",
              noIcon: true,
            },
            {
              label: "CSV",
              sub: "Tapahtumat taulukkona kirjanpito-ohjelmiin",
              radio: "exportFormat",
              option: "csv",
              noIcon: true,
            },
            {
              label: "Kaikki",
              sub: "PDF + CSV + kuittien kuvat",
              radio: "exportFormat",
              option: "all",
              noIcon: true,
            },
          ],
        },
        {
          title: "Ajanjakso",
          rows: [
            {
              label: "Tämä tilikausi",
              radio: "exportRange",
              option: "this",
              noIcon: true,
            },
            {
              label: "Edellinen tilikausi",
              radio: "exportRange",
              option: "last",
              noIcon: true,
            },
            {
              label: "Kaikki",
              radio: "exportRange",
              option: "all",
              noIcon: true,
            },
          ],
        },
      ],
      cta: "Lähetä latauslinkki",
    },
    delete: {
      eyebrow: "Asetukset",
      title: "Poista tili",
      lead: "Tämä lähettää poistopyynnön. Pyynnön vastaanotto ei vielä poista tiliä tai kirjanpitoaineistoa.",
      sections: [
        {
          title: "Mitä tapahtuu",
          rows: [
            {
              label: "Poistopyyntö kirjataan tilillesi",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Pyynnön eteneminen vahvistetaan erikseen",
              noIcon: true,
              noChevron: true,
            },
            {
              label:
                "Säilytettävä aineisto käsitellään sovellettavien velvoitteiden mukaan",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Esikatselu ei poista oikeaa tiliä",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
      ],
      cta: "Lähetä poistopyyntö",
      ctaAlert: true,
    },
  },
  en: {
    cancel: "Cancel",
    signOut: "Sign out",
    signOutBody: "Your books stay safe. Sign back in with your phone number.",
    terms: "Terms",
    privacy: "Privacy",
    home: {
      eyebrow: "",
      title: "Settings",
      sections: [
        {
          title: "Books",
          rows: [
            {
              icon: "status",
              label: "Status",
            },
            {
              icon: "tax",
              label: "Taxes",
            },
            {
              icon: "month",
              label: "Months",
            },
            {
              icon: "activity",
              label: "Activity",
            },
          ],
        },
        {
          title: "Business",
          rows: [
            {
              icon: "card",
              label: "Business details",
              go: "business",
            },
            {
              icon: "id",
              label: "Business ID & register",
              accent: true,
              go: "register",
            },
            {
              icon: "calendar",
              label: "VAT period",
              go: "vatPeriod",
            },
            {
              icon: "calendar",
              label: "Financial year",
              go: "fiscalYear",
            },
          ],
        },
        {
          title: "{brand}",
          rows: [
            {
              icon: "bell",
              label: "Notifications",
              go: "notifications",
            },
            {
              icon: "globe",
              label: "Language",
              go: "language",
            },
            {
              icon: "bank",
              label: "Bank",
              go: "bank",
            },
            {
              icon: "omavero",
              label: "OmaVero",
              go: "omavero",
            },
            {
              icon: "people",
              label: "Accountant",
              go: "accountant",
            },
          ],
          foot: "Connections require your permission. Bank, tax and accountant integrations are not implemented yet.",
        },
        {
          title: "Account",
          rows: [
            {
              icon: "phone",
              label: "Phone number",
              go: "phone",
            },
            {
              icon: "face",
              label: "Face ID",
              sub: "Unlock your books with your face",
              toggle: "faceId",
            },
            {
              icon: "export",
              label: "Export data",
              go: "exportData",
            },
            {
              icon: "signout",
              label: "Sign out",
              go: "sheet",
              noChevron: true,
            },
          ],
        },
        {
          rows: [
            {
              label: "Delete account",
              go: "delete",
              alert: true,
              noChevron: true,
              noIcon: true,
            },
          ],
        },
      ],
    },
    business: {
      eyebrow: "Settings",
      title: "Business details",
      lead: "This is how {brand} understands your business. Tap a detail, correct it and save.",
      sections: [
        {
          title: "Basics",
          rows: [
            {
              label: "Business name",
              noIcon: true,
            },
            {
              label: "Owner",
              noIcon: true,
            },
            {
              label: "Profession",
              noIcon: true,
            },
            {
              label: "What you do",
              noIcon: true,
            },
            {
              label: "Area",
              noIcon: true,
            },
            {
              label: "Billing",
              noIcon: true,
            },
          ],
        },
        {
          title: "Register",
          rows: [
            {
              label: "Business ID",
              accent: true,
              noIcon: true,
              sub: "I’ll fetch the registered name and legal form from PRH.",
              go: "register",
            },
            {
              label: "Legal form",
              noIcon: true,
            },
            {
              label: "Business address",
              accent: true,
              noIcon: true,
            },
          ],
          foot: "Registry facts and owner-supplied details stay separate. A Business ID does not verify authority to act for a company.",
        },
      ],
    },
    register: {
      eyebrow: "Business",
      title: "Business ID & register",
      lead: "Enter your Business ID and I’ll fetch the official details available from PRH. Check them before saving.",
      sections: [
        {
          rows: [
            {
              label: "Business ID",
              noIcon: true,
              noChevron: true,
              mono: true,
            },
          ],
          foot: "Format 1234567-8. This open-data service does not cover sole traders; you can enter their details yourself.",
        },
      ],
      cta: "Fetch details",
    },
    vatPeriod: {
      eyebrow: "Business",
      title: "VAT period",
      lead: "How often you report and pay VAT. The period is shown in OmaVero or the Tax Administration’s decision.",
      sections: [
        {
          rows: [
            {
              label: "Monthly",
              radio: "vat",
              option: "month",
              noIcon: true,
            },
            {
              label: "Quarterly",
              radio: "vat",
              option: "quarter",
              noIcon: true,
            },
            {
              label: "Yearly",
              radio: "vat",
              option: "year",
              noIcon: true,
            },
          ],
          foot: "Choose the period confirmed by the Tax Administration. This does not change their records or submit returns.",
        },
      ],
    },
    fiscalYear: {
      eyebrow: "Business",
      title: "Financial year",
      lead: "Your financial year and financial-statement details. Confirm these against your books or official documents.",
      sections: [
        {
          rows: [
            {
              label: "Current financial year",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "First financial year",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Financial statements",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
      ],
    },
    notifications: {
      eyebrow: "Settings",
      title: "Notifications",
      lead: "I only speak up when it matters. No marketing.",
      sections: [
        {
          rows: [
            {
              label: "Allow notifications",
              toggle: "notifications",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
        {
          title: "What I tell you about",
          rows: [
            {
              label: "When I need you",
              sub: "Questions and approvals",
              toggle: "needsYou",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Due dates",
              sub: "Reminders of upcoming deadlines",
              toggle: "dueDates",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Monthly summary",
              sub: "A summary of the month’s activity",
              toggle: "monthly",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Every receipt",
              sub: "A confirmation when a receipt is filed",
              toggle: "everyReceipt",
              noIcon: true,
              noChevron: true,
            },
          ],
          foot: "Preferences are saved to the preview server. Notification delivery is not connected yet.",
        },
      ],
    },
    language: {
      eyebrow: "{brand}",
      title: "Language",
      lead: "The language I speak and write to you in.",
      sections: [
        {
          rows: [
            {
              label: "Suomi",
              radio: "lang",
              option: "fi",
              noIcon: true,
            },
            {
              label: "Svenska",
              radio: "lang",
              option: "sv",
              noIcon: true,
            },
            {
              label: "English",
              radio: "lang",
              option: "en",
              noIcon: true,
            },
          ],
          foot: "This changes the app language on this device. Swedish is coming later.",
        },
      ],
    },
    bank: {
      eyebrow: "{brand}",
      title: "Bank",
      lead: "A bank connection brings transactions directly to {brand}. It is enabled only after you grant access.",
      sections: [
        {
          title: "What I get",
          rows: [
            {
              label: "Transactions and balance",
              sub: "Read-only",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "I never pay or move anything",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
        {
          title: "Choose your bank",
          rows: [
            {
              label: "OP",
              noIcon: true,
              go: "done",
            },
            {
              label: "Nordea",
              noIcon: true,
              go: "done",
            },
            {
              label: "Danske Bank",
              noIcon: true,
              go: "done",
            },
            {
              label: "S-Pankki",
              noIcon: true,
              go: "done",
            },
            {
              label: "Another bank",
              noIcon: true,
              go: "done",
            },
          ],
          foot: "Bank connections are not available yet. We never ask for bank credentials in this app.",
        },
      ],
    },
    omavero: {
      eyebrow: "{brand}",
      title: "OmaVero",
      lead: "You’ll be able to connect your tax information here. The scope of any mandate must be checked before you grant it.",
      sections: [
        {
          title: "What I see",
          rows: [
            {
              label: "VAT returns and payments",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Prepayments and due dates",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Tax debt and refunds",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
        {
          title: "What I don’t do",
          rows: [
            {
              label: "I don’t file returns",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "I don’t pay taxes",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
      ],
      cta: "Grant mandate in Suomi.fi",
      foot: "The Suomi.fi connection is not implemented yet. This preview does not grant a mandate.",
    },
    accountant: {
      eyebrow: "{brand}",
      title: "Accountant",
      lead: "Share access with your accountant. They see what you see and can comment — never change anything without your say.",
      sections: [
        {
          rows: [
            {
              label: "Email",
              noIcon: true,
              noChevron: true,
              mono: true,
            },
          ],
        },
        {
          title: "Permissions",
          rows: [
            {
              label: "Sees the books and receipts",
              sub: "Always included",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Can comment",
              toggle: "acctComment",
              noIcon: true,
            },
            {
              label: "Can post entries",
              sub: "Entries appear in Books under their name",
              toggle: "acctPost",
              noIcon: true,
            },
          ],
          foot: "Invitations and access grants are not sent yet. The selections here are only a draft.",
        },
      ],
      cta: "Send invite",
    },
    phone: {
      eyebrow: "Account",
      title: "Phone number",
      lead: "Your number is your login. Changing it requires separate verification.",
      sections: [
        {
          rows: [
            {
              label: "Current",
              noIcon: true,
              noChevron: true,
              mono: true,
            },
            {
              label: "New number",
              noIcon: true,
              noChevron: true,
              mono: true,
            },
          ],
        },
      ],
      cta: "Send codes",
    },
    exportData: {
      eyebrow: "Account",
      title: "Export data",
      lead: "Your books are yours. Take them with you any time — no questions asked.",
      sections: [
        {
          title: "Format",
          rows: [
            {
              label: "PDF",
              sub: "Ledger, vouchers and reports, readable",
              radio: "exportFormat",
              option: "pdf",
              noIcon: true,
            },
            {
              label: "CSV",
              sub: "Transactions as a table for accounting software",
              radio: "exportFormat",
              option: "csv",
              noIcon: true,
            },
            {
              label: "Everything",
              sub: "PDF + CSV + receipt photos",
              radio: "exportFormat",
              option: "all",
              noIcon: true,
            },
          ],
        },
        {
          title: "Period",
          rows: [
            {
              label: "This financial year",
              radio: "exportRange",
              option: "this",
              noIcon: true,
            },
            {
              label: "Last financial year",
              radio: "exportRange",
              option: "last",
              noIcon: true,
            },
            {
              label: "Everything",
              radio: "exportRange",
              option: "all",
              noIcon: true,
            },
          ],
        },
      ],
      cta: "Send download link",
    },
    delete: {
      eyebrow: "Settings",
      title: "Delete account",
      lead: "This sends a deletion request. Receiving the request does not yet delete your account or accounting records.",
      sections: [
        {
          title: "What happens",
          rows: [
            {
              label: "The deletion request is recorded for your account",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "Its progress is confirmed separately",
              noIcon: true,
              noChevron: true,
            },
            {
              label:
                "Retained records are handled according to applicable obligations",
              noIcon: true,
              noChevron: true,
            },
            {
              label: "The preview does not delete a real account",
              noIcon: true,
              noChevron: true,
            },
          ],
        },
      ],
      cta: "Send deletion request",
      ctaAlert: true,
    },
  },
};
const fill = (text: string, tokens?: Record<string, string>): string => {
  const merged: Record<string, string> = { brand: getBrandName(), ...tokens };
  return text.replace(/\{(\w+)\}/g, (match, name) => merged[name] ?? match);
};
const fillAll = <T,>(node: T): T =>
  (typeof node === "string"
    ? fill(node)
    : Array.isArray(node)
      ? node.map(fillAll)
      : node && typeof node === "object"
        ? Object.fromEntries(
            Object.entries(node).map(([key, value]) => [key, fillAll(value)]),
          )
        : node) as T;
export const settingsCopy = (page: SettingsPage): SettingsPageCopy =>
  fillAll(settingsLocales[getLocale()][page]);
/** `[fi, en]` pairs; parity-checked with the page copy above. */
export const settingsPairs = {
  add: ["Lisää", "Add"],
  unknown: ["Ei vielä vahvistettu", "Not confirmed yet"],
  unavailable: ["Ei vielä käytössä", "Not available yet"],
  notConnected: ["Ei yhdistetty", "Not connected"],
  notConfigured: [
    "Ei vielä yhdistetty. Tästä esikatselusta ei lähetetä mitään.",
    "Not connected yet. Nothing is sent from this preview.",
  ],
  sample: [
    "Esikatselutiedot. Asetukset säilyvät palvelimen uudelleenkäynnistykseen asti.",
    "Preview data. Settings remain until the server restarts.",
  ],
  loadError: [
    "Asetuksia ei voitu hakea. Yritä uudelleen.",
    "Settings could not be loaded. Try again.",
  ],
  saveError: [
    "Tallennus ei onnistunut. Tietoja ei muutettu.",
    "Could not save. Your details were not changed.",
  ],
  save: ["Tallenna", "Save"],
  saved: ["Tallennettu", "Saved"],
  cancel: ["Peruuta", "Cancel"],
  back: ["Takaisin", "Back"],
  retry: ["Yritä uudelleen", "Try again"],
  saving: ["Tallennetaan…", "Saving…"],
  loading: ["Haetaan…", "Loading…"],
  off: ["Pois", "Off"],
  on: ["Päällä", "On"],
  deviceOnly: ["Vain tällä laitteella", "On this device only"],
  noBiometrics: [
    "Biometrinen lukitus ei ole käytettävissä tässä ympäristössä.",
    "Biometric lock is not available in this environment.",
  ],
  permissionDenied: [
    "Salli ilmoitukset laitteen asetuksissa.",
    "Allow notifications in your device settings.",
  ],
  notificationDevice: [
    "Tämä kytkin hallitsee tämän laitteen ilmoituksia.",
    "This switch controls notifications on this device.",
  ],
  switchBooks: ["Vaihda kirjanpitoa", "Switch books"],
  sole_trader: ["Toiminimi", "Sole trader"],
  limited_company: ["Osakeyhtiö", "Limited company"],
  other: ["Muu", "Other"],
  registeredName: ["Virallinen nimi", "Registered name"],
  legalForm: ["Yritysmuoto", "Legal form"],
  registeredAddress: ["Rekisteriosoite", "Registered address"],
  registrySource: [
    "Lähde: PRH / YTJ avoin data · CC BY 4.0 · haettu {date}.",
    "Source: PRH / YTJ open data · CC BY 4.0 · retrieved {date}.",
  ],
  ownerSource: [
    "Itse ilmoitettu. Ei rekisteristä tarkistettu.",
    "Owner-supplied. Not checked against the register.",
  ],
  manual: ["Lisää tiedot itse", "Enter details yourself"],
  registryEmpty: [
    "Tietoja ei löytynyt tästä palvelusta. Voit lisätä tiedot itse.",
    "No details were found in this service. You can enter them yourself.",
  ],
  registryError: [
    "Haku ei onnistunut. Tarkista Y-tunnus tai lisää tiedot itse.",
    "Lookup failed. Check the Business ID or enter the details yourself.",
  ],
  confirmRegistry: ["Vahvista tiedot", "Confirm details"],
  registrySaved: [
    "Yrityksen viralliset tiedot on tallennettu. Puheesta antamasi tiedot eivät muuttuneet.",
    "The legal business details are saved. Your spoken profile is unchanged.",
  ],
  earlierRecords: ["Aiempi kirjanpito", "Previous bookkeeping"],
  addRecords: ["Lisää aineistoa", "Add records"],
  deletionTitle: ["Poistopyyntö vastaanotettu", "Deletion request received"],
  deletionBody: [
    "Esikatselu kirjasi pyynnön. Mitään oikeaa tiliä tai aineistoa ei poistettu.",
    "The preview recorded the request. No real account or records were deleted.",
  ],
  signOut: ["Kirjaudu ulos", "Sign out"],
  signOutBody: [
    "Kirjanpitosi pysyy tallessa. Kirjaudu takaisin puhelinnumerollasi.",
    "Your books stay safe. Sign back in with your phone number.",
  ],
  edit: ["Muokkaa", "Edit"],
  phoneUnknown: ["Numeroa ei ole vahvistettu", "Number not verified"],
  newPhone: ["Uusi numero", "New number"],
  email: ["Sähköposti", "Email"],
  coming: ["Tulossa", "Coming later"],
  settings: ["Asetukset", "Settings"],
  pdf: ["PDF, CSV", "PDF, CSV"],
  biometrics: ["Biometrinen lukitus", "Biometric lock"],
  currentLanguage: ["Suomi", "English"],
} as const;
export const settingsText = (
  key: keyof typeof settingsPairs,
  tokens?: Record<string, string>,
): string => fill(settingsPairs[key][getLocale() === "fi" ? 0 : 1], tokens);
