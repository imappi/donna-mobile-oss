import type { ShellConfig } from '@core/shell';

/**
 * The Donna shell — the reference implementation. Branding, locale
 * defaults, endpoint config ONLY (core/shell.ts is the law on what a
 * shell may contain).
 */
export const shell: ShellConfig = {
  brandName: 'Donna',
  // The production mascot asset, byte-identical to the desktop app's.
  mascot: require('../../assets/images/donna-buddy.png'),
  appIcon: require('../../assets/images/icon.png'),
  defaultLocale: 'fi',
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4141'
  },
  demoLogin: {
    email: 'demo@example.test',
    password: 'receipts'
  }
};
