# Donna mobile

A phone app for Donna, the AI bookkeeping engine. A business owner photographs
a receipt, answers the questions only they can answer, and approves what needs
their say. Everything else is decided on the server.

This is a source release of a working prototype, not a supported product.
There is no app-store build, no hosted backend, no support and no warranty. It
was built by Kari Honkanen, much of it written with AI coding agents (Claude
and Codex). The Donna engine is released separately:
[donna-oss](https://github.com/imappi/donna-oss).

| Books | An approval | The capture menu | Onboarding |
| --- | --- | --- | --- |
| ![The Books stream](screenshots/books.png) | ![An approval](screenshots/approval.png) | ![The capture menu](screenshots/launcher.png) | ![The business card](screenshots/business-card.png) |

The screenshots show invented demo data in Finnish; English is also built in.

## Status

- **It runs end to end against the bundled mock server** (`mockserver/`): sign
  in, onboarding, the Books stream, answering and approving, receipt and file
  capture, chat, mileage and settings, on invented demo books.
- **It is not connected to Donna.** The app talks to the API described in
  `contract/mobile-api.yaml`, and Donna does not implement it yet. The missing
  piece is a thin, owner-scoped adapter on the server over Donna's existing
  reads and writers, not more logic in the app.
- **It has run on iOS and Android simulators and on the web, but has never
  been built for an app store.** Everything a store build needs that takes no
  account is in place (icons, build identity from the environment, release
  checks, push wiring); what a publisher must still supply is listed under
  [Building for a store](#building-for-a-store).
- Comments refer to design records under `design/`. Those are internal and not
  part of this release; `DESIGN.md` is.

## How it is built

1. **The phone is a terminal.** No accounting logic, categorisation or model
   calls run on the device. The app shows what the server has decided and
   sends back the owner's decision from a closed set (approve, reject, answer,
   flag as wrong). Every decision returns a receipt, and the app shows the
   state it gets back rather than assuming the decision worked.
2. **The server decides what a card is.** There are three kinds: a question
   only the owner can answer, an approval only the owner can give, and a
   receipt for something Donna already did, which the owner can flag as wrong.
   A receipt never asks for approval, and the "needs you" count comes from the
   server, never from the app.
3. **One contract.** `contract/mobile-api.yaml` (OpenAPI) is the source of
   truth, and the TypeScript client is generated from it
   (`npm run generate:api`). Any backend that implements it gets this app.
4. **Two layers.** `core/` holds the screens and knows neither the brand nor
   the backend. `shells/` holds only branding, locale defaults and the backend
   address.
5. **One design language.** `DESIGN.md` and `core/design/tokens.ts`. Screens
   compose the primitives in `core/design/`, and the linter fails on a literal
   colour, an ad-hoc font size or spacing, or an inline style outside it.
6. **Every string goes through `core/i18n`** (English and Finnish). Dates are
   plain ISO dates or timestamps with an explicit time zone.
7. **Fixtures use invented identities only**: no real people, companies or
   customers.

## Run it

With Node.js 22 or newer and the npm that ships with it (10.9 or newer; npm 11
works too):

```bash
npm ci
```

Start the mock backend on port 4141:

```bash
npm run mock
```

In a second terminal, start the Expo dev server, then press `w` for the web or
open it in Expo Go:

```bash
npm start
```

The phone sign-in is a Finland-only preview: enter a Finnish mobile number and
the verification code `111111`. The business introduction, spoken or typed,
needs a model: set `OPENAI_API_KEY` on the mock process, or install the
Whisper CLI and a signed-in Codex CLI (`WHISPER_CLI` and `CODEX_CLI` set their
paths). Without either, onboarding stops at that step with a retry.

The populated demo books need neither. Start a second mock and a dev server
pointed at it (leave out `DEMO_LOCALE=fi` for English):

```bash
PORT=4142 DEMO_LOCALE=fi npm run mock
```

```bash
EXPO_PUBLIC_API_URL=http://127.0.0.1:4142 EXPO_PUBLIC_SEEDED_BOOKS=true npx expo start --port 8083 --localhost
```

Then open `http://127.0.0.1:8083/dev/seeded-books` and tap the button, which
signs in to the demo account. The route exists only in development. The mock
keeps its state in memory, so restarting it resets the books. Name an uploaded
file `*cash*` to get a follow-up question, or `*fail*` to see the failure path.

## Checks

```bash
npm test && npm run typecheck && npm run lint
```

The same checks, plus a web export (`npx expo export --platform web`) as a
build smoke, run on every pull request and on pushes to `main`
(`.github/workflows/checks.yml`).

`npm run test:cleanup:live` is a separate Finnish language-quality suite that
calls a real model, so it is never part of `npm test`.

## Building for a store

Nobody has published this app. There are no developer accounts, signing keys,
push credentials or published identifiers in this repository, and there should
not be: a publisher supplies them through the build environment, without
editing source.

**Done here.** The app icon, Android adaptive and themed icons, notification
icon, splash and favicon are generated from the shell's mascot on the design
canvas by `node scripts/brand-icons.mjs` (no dependencies; a fork passes
`--mascot` and re-runs it). `app.config.js` takes the display name, URL scheme
and identifiers from the variables below, with obviously-placeholder
`com.example.*` defaults for local builds. Each `eas.json` profile sets
`APP_VARIANT`, and a `production` build refuses to configure, naming every
problem, when the backend address is missing, is not HTTPS or is a loopback
address, or when an identifier is still a placeholder. `preview` needs an
explicit address but may use HTTP (a mock on the LAN). `development` keeps the
`http://localhost:4141` default. A build without an EAS project id has push
notifications unavailable; nothing else changes.

| Variable | Needed for | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | preview, production | HTTPS, not loopback, in production. Store it as a plain-text or sensitive EAS variable (a secret one is not readable when the config is evaluated). |
| `APP_IOS_BUNDLE_IDENTIFIER` | production | Registered in the publisher's Apple developer account. |
| `APP_ANDROID_PACKAGE` | production | Permanent once published on Google Play. |
| `EAS_PROJECT_ID` | push | From `eas init`; also links builds to the EAS project. |
| `GOOGLE_SERVICES_JSON` | Android push | Path to `google-services.json`, normally an EAS file variable. |
| `APP_DISPLAY_NAME`, `APP_SCHEME` | optional | Default to the shell's brand name and scheme. |

**What a publisher must supply:**

1. **Accounts:** an Expo account (EAS Build and Submit), an Apple Developer
   Program membership, and a Google Play developer account.
2. **Identifiers:** the bundle identifier and Android package above, the EAS
   project id, and the App Store Connect and Play Console app records
   (`submit.production` in `eas.json` is empty until then).
3. **Signing:** an iOS distribution certificate and provisioning profile, and
   an Android upload keystore (EAS can generate and hold both).
4. **Push:** an APNs key in the Apple account, uploaded to EAS, and a
   Firebase project with an FCM service-account key uploaded to EAS plus its
   `google-services.json`. The backend must send through Expo's push service
   with the tokens from `/notifications/registrations`.
5. **A backend** implementing `contract/mobile-api.yaml` at a public HTTPS
   address. None exists yet (see Status), so a store build has nothing to
   talk to.
6. **Store privacy declarations** for what the build actually requests
   (from `expo prebuild`): camera (receipts and documents), microphone (the
   optional voice business introduction, uploaded to the backend), photo
   library (attaching existing receipts), notifications (Android
   `POST_NOTIFICATIONS`, iOS push entitlement), and biometrics (Face ID /
   `USE_BIOMETRIC` to unlock). Android also lists `INTERNET`, `VIBRATE`,
   `MODIFY_AUDIO_SETTINGS`, legacy storage permissions capped at API 32 and
   React Native's `SYSTEM_ALERT_WINDOW`. The App Store privacy label and the
   Play data-safety form must describe what the backend collects (phone
   number, business and financial records, receipt images, voice recordings),
   which depends on that backend, plus a privacy policy URL, the export
   compliance answer (`ITSAppUsesNonExemptEncryption`) and an iOS privacy
   manifest review.
7. **Development builds** (`eas build --profile development`) also need
   `expo-dev-client` added to the dependencies.
8. **Store copy:** listing text, screenshots, support address and age rating.
   None is written here.

## Licence

Apache License 2.0; see [LICENSE](LICENSE) and [NOTICE](NOTICE). The licence
does not grant rights to the name Donna.

## Contributing

Pull requests are welcome. Sign off each commit (`git commit -s`) to confirm
you wrote the change and can submit it under the Apache 2.0 licence (the
[Developer Certificate of Origin](https://developercertificate.org/)).
