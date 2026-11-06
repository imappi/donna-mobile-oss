import assert from 'node:assert/strict';
import test from 'node:test';
import { en } from '../i18n/en';
import { fi } from '../i18n/fi';
import { formatMonth, setLocale } from '../i18n';
import { onboarding, onboardingType, businessCard, brandGround } from '../design/tokens';
import { gradientPoints } from '../design/gradientGeometry';

// Literal copy from the supplied v4 handoff, with the existing brand and runtime
// placeholder names substituted. No dependency on a user's Downloads directory.
const copy = {
  "en": {
    "title": "Hi, I’m {brand}.",
    "handoff": "I keep your books in order — receipts, taxes, customers. You do the work, I do the paperwork.",
    "continue": "Let’s start",
    "phoneTitle": "What’s your number?",
    "phoneBody": "I’ll text you a one-time code. No password needed.",
    "sendCode": "Send code",
    "phonePlaceholder": "40 123 4567",
    "codeTitle": "Enter the code",
    "codeBody": "I sent it to {phone}.",
    "wrongNumber": "Wrong number?",
    "checkingCode": "Checking…",
    "sendAgain": "Send again",
    "resendCountdown": "Send again in {seconds} s",
    "businessTitle": "Tell me about your business.",
    "businessPrompt": "Talk like you would to a friend. I’ll take the notes.",
    "cueNote": "You don’t need to cover everything. You’ll check the details before anything is saved.",
    "tapToSpeak": "Tap and talk",
    "typeInstead": "I’d rather type",
    "skipForNow": "Skip for now",
    "microphoneDenied": "The microphone is off. Allow it in Settings — or type your introduction.",
    "recording": "Listening",
    "paused": "Paused",
    "finishRecording": "Done",
    "pauseRecording": "Pause",
    "resumeRecording": "Resume",
    "discardRecording": "Discard recording",
    "processingTitle": "One moment.",
    "processingPrivacy": "The audio is deleted as soon as the details are extracted. Nothing is saved until you approve the card.",
    "cardTitle": "Here’s your business.",
    "cardBody": "Enough to get started. Check the names — the rest can wait.",
    "cardEdit": "Edit",
    "cardSaveEdits": "Done",
    "profileNameUncertain": "Check the spelling of this name",
    "cardConfirm": "Looks right",
    "recordAgain": "Record again",
    "businessName": "Business name",
    "ownerName": "Owner’s name",
    "profession": "Profession",
    "billingBasis": "Billing",
    "operatingArea": "Area",
    "experience": "Experience",
    "notifyTitle": "I’ll tell you when I need you.",
    "notifyBody": "Usually one short question now and then. No marketing, no reminders.",
    "notifyNow": "now",
    "notifyExampleTitle": "Was this lunch business?",
    "notifyExampleBody": "Ravintola Kaisla · €24.90",
    "notifyAllow": "Allow notifications",
    "notifyLater": "Not now",
    "firstBooksGreeting": "Hi {name}.",
    "firstBooksBody": "Snap one receipt and you’ll see how this works. I’ll handle the rest.",
    "booksEmptyAction": "Snap a receipt",
    "firstBooksAddFile": "Add a file",
    "firstBooksGhost": "Your first receipt will appear here."
  },
  "fi": {
    "title": "Hei, olen {brand}.",
    "handoff": "Pidän kirjanpitosi kunnossa – kuitit, verot, asiakkaat. Sinä teet työsi, minä hoidan paperit.",
    "continue": "Aloitetaan",
    "phoneTitle": "Mikä on numerosi?",
    "phoneBody": "Lähetän kertakoodin tekstiviestillä. Salasanaa ei tarvita.",
    "sendCode": "Lähetä koodi",
    "phonePlaceholder": "40 123 4567",
    "codeTitle": "Syötä koodi",
    "codeBody": "Lähetin sen numeroon {phone}.",
    "wrongNumber": "Väärä numero?",
    "checkingCode": "Tarkistetaan…",
    "sendAgain": "Lähetä uudelleen",
    "resendCountdown": "Lähetä uudelleen {seconds} s kuluttua",
    "businessTitle": "Kerro yrityksestäsi.",
    "businessPrompt": "Puhu kuin kertoisit tutulle. Minä teen muistiinpanot.",
    "cueNote": "Kaikkea ei tarvitse kertoa nyt. Tarkistat tiedot ennen kuin mitään tallennetaan.",
    "tapToSpeak": "Napauta ja puhu",
    "typeInstead": "Kirjoita mieluummin",
    "skipForNow": "Ohita toistaiseksi",
    "microphoneDenied": "Mikrofoni on estetty. Voit sallia sen Asetuksissa – tai kirjoittaa esittelyn.",
    "recording": "Kuuntelen",
    "paused": "Tauolla",
    "finishRecording": "Valmis",
    "pauseRecording": "Tauko",
    "resumeRecording": "Jatka",
    "discardRecording": "Poista äänite",
    "processingTitle": "Hetki vain.",
    "processingPrivacy": "Äänite poistetaan heti, kun tiedot on poimittu. Mitään ei tallenneta ennen kuin hyväksyt kortin.",
    "cardTitle": "Tässä sinun yrityksesi.",
    "cardBody": "Näillä pääsemme alkuun. Tarkista nimet – muun voit täydentää myöhemmin.",
    "cardEdit": "Muokkaa",
    "cardSaveEdits": "Valmis",
    "profileNameUncertain": "Tarkista nimen kirjoitusasu",
    "cardConfirm": "Näyttää oikealta",
    "recordAgain": "Nauhoita uudelleen",
    "businessName": "Yrityksen nimi",
    "ownerName": "Yrittäjän nimi",
    "profession": "Ammatti",
    "billingBasis": "Laskutus",
    "operatingArea": "Toiminta-alue",
    "experience": "Kokemus",
    "notifyTitle": "Kerron, kun tarvitsen sinua.",
    "notifyBody": "Yleensä yksi lyhyt kysymys silloin tällöin. Ei markkinointia, ei muistutuksia.",
    "notifyNow": "nyt",
    "notifyExampleTitle": "Oliko tämä lounas työasiaa?",
    "notifyExampleBody": "Ravintola Kaisla · 24,90 €",
    "notifyAllow": "Salli ilmoitukset",
    "notifyLater": "Ei nyt",
    "firstBooksGreeting": "Hei {name}.",
    "firstBooksBody": "Kuvaa yksi kuitti, niin näet miten tämä toimii. Loput hoidan minä.",
    "booksEmptyAction": "Kuvaa kuitti",
    "firstBooksAddFile": "Lisää tiedosto",
    "firstBooksGhost": "Ensimmäinen kuittisi näkyy tässä."
  }
};

for (const [language, dictionary] of [['en', en], ['fi', fi]] as const) {
  test(language + ': all nine screens preserve the supplied v4 copy', () => {
    for (const [key, expected] of Object.entries(copy[language])) {
      assert.equal(dictionary.onboarding?.[key as keyof typeof en.onboarding], expected, key);
    }
  });
}
test('onboarding dimensions preserve the reference screen-specific rhythm', () => {
  assert.deepEqual([onboarding.screenInset, onboarding.topInset, onboarding.headerGap, onboarding.sectionGap], [24, 28, 10, 28]);
  assert.deepEqual([onboarding.fieldHeight, onboarding.callingCodeWidth, onboarding.codeGap, onboarding.codeRadius], [64, 88, 8, 14]);
  assert.deepEqual([onboarding.primaryHeight, onboarding.booksButtonHeight, onboarding.footerGap], [56, 52, 6]);
  assert.deepEqual([businessCard.radius, businessCard.padding, businessCard.companyTop, businessCard.ownerTop], [24, 24, 22, 14]);
  assert.deepEqual([onboardingType.title.fontSize, onboardingType.title.lineHeight], [32, 36]);
  assert.deepEqual(brandGround.locations, [0, 0.34, 0.62, 1]);
  assert.deepEqual(onboarding.pausedWaveHeights, [6, 12, 20, 12]);
});
test('card gradient retains the CSS angle after inline editing changes its aspect ratio', () => {
  for (const height of [448, 600, 900]) {
    const { start, end } = gradientPoints(170, 345, height);
    const physicalAngle = Math.atan2((end.x-start.x)*345, -(end.y-start.y)*height) * 180 / Math.PI;
    assert.ok(Math.abs(physicalAngle - 170) < 0.0001);
    assert.ok(Math.abs(start.x + end.x - 1) < 0.0001);
  }
});
test('Books eyebrow omits the year without changing dated stream headings or setup copy', () => {
  setLocale('fi'); assert.equal(formatMonth('2026-09', true), 'Syyskuu');
  assert.equal(formatMonth('2026-09'), 'syyskuu 2026');
  setLocale('en'); assert.equal(formatMonth('2026-09', true), 'September');
  assert.equal(en.setup.title, 'Your business');
  assert.equal(fi.setup?.title, 'Yrityksesi tiedot');
});
