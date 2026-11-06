/**
 * The shell contract. A shell is a thin brand/market wrapper: branding,
 * locale defaults, and backend endpoint config — NOTHING else. If a shell
 * needs its own screen logic, the architecture has failed (README.md).
 *
 * The active shell is selected in exactly one place: `src/shell.ts`.
 * A market fork adds `shells/<brand>/shell.ts` and changes that one import.
 */
import type { ImageSourcePropType } from 'react-native';

export type ShellConfig = {
  appIcon?: ImageSourcePropType;
  /** Product name shown in chrome and copy interpolations. */
  brandName: string;
  /**
   * The brand mascot (shell v1: the dock orb, launcher, chat identity).
   * BRANDING, so it lives with the shell — core ships no image. Absent,
   * the chrome falls back to a neutral icon.
   */
  mascot?: ImageSourcePropType;
  /** BCP-47 default when the device locale isn't supported. */
  defaultLocale: 'en' | 'fi';
  api: {
    /**
     * Base URL of a backend implementing contract/mobile-api.yaml.
     * The Donna shell points at the mock server; how a phone reaches a
     * real Donna backend (tether/relay vs hosted API) is a recorded open
     * decision for Kari — see README "Deliberately deferred".
     */
    baseUrl: string;
  };
  /** Demo-mode credentials surfaced on the login screen (mock/demo builds only). */
  demoLogin?: { email: string; password: string };
};
