/**
 * Build identity and release checks, read from the build environment.
 *
 * This is build configuration, not app code: it runs in Node when Expo or
 * EAS evaluates app.config.js, never on the device. The app (`core/`) stays
 * backend-agnostic; it only ever sees the address this file has accepted.
 *
 * Variables (all optional for development):
 *   APP_VARIANT                 development (default) | preview | production
 *   APP_DISPLAY_NAME            name under the icon; default: the shell's brand
 *   APP_SCHEME                  deep-link scheme; default: the shell's scheme
 *   APP_IOS_BUNDLE_IDENTIFIER   e.g. com.yourcompany.yourapp
 *   APP_ANDROID_PACKAGE         e.g. com.yourcompany.yourapp
 *   EAS_PROJECT_ID              from `eas init`; needed for push tokens
 *   GOOGLE_SERVICES_JSON        path to google-services.json (Android push)
 *   EXPO_PUBLIC_API_URL         backend implementing contract/mobile-api.yaml
 *
 * Without identifiers, local builds get `com.example.<shell id>`: valid, so
 * `expo prebuild` works, and obviously not a published identity. A
 * production build refuses it, along with a missing, non-HTTPS or loopback
 * backend address. A preview build needs an explicit address but may use
 * plain HTTP (an internal build against a mock on the LAN).
 */

const VARIANTS = ['development', 'preview', 'production'];
const PLACEHOLDER_PREFIX = 'com.example.';

/** True for addresses that only ever mean "this device". */
const isLoopbackHost = (hostname) => {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    /^127(\.\d{1,3}){3}$/.test(host) ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '::' ||
    /^::ffff:127\./.test(host) ||
    /^::ffff:7f[0-9a-f]{2}:/.test(host)
  );
};

/** Returns a problem description, or null when the address is acceptable. */
const checkApiUrl = (value, variant) => {
  if (!value) return 'EXPO_PUBLIC_API_URL is not set (a release build must name its backend).';
  let url;
  try {
    url = new URL(value);
  } catch {
    return `EXPO_PUBLIC_API_URL is not a URL: ${JSON.stringify(value)}.`;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return `EXPO_PUBLIC_API_URL must be http(s), got ${url.protocol}`;
  }
  if (variant !== 'production') return null;
  if (url.protocol !== 'https:') return `EXPO_PUBLIC_API_URL must use HTTPS in production, got ${value}.`;
  if (isLoopbackHost(url.hostname)) {
    return `EXPO_PUBLIC_API_URL points at a loopback address (${url.hostname}), which on a phone is the phone itself.`;
  }
  return null;
};

const IOS_ID = /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
const ANDROID_ID = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/;

/**
 * @param {Record<string, string | undefined>} env  usually process.env
 * @param {{ id: string, brandName: string, scheme: string }} shell  the shell's build defaults
 */
const resolveBuildEnv = (env, shell) => {
  const read = (key) => {
    const v = env[key];
    return v === undefined || v.trim() === '' ? undefined : v.trim();
  };
  const variant = read('APP_VARIANT') ?? 'development';
  if (!VARIANTS.includes(variant)) {
    throw new Error(`APP_VARIANT must be one of ${VARIANTS.join(', ')}; got ${JSON.stringify(variant)}.`);
  }
  const placeholder = `${PLACEHOLDER_PREFIX}${shell.id}`;
  const resolved = {
    variant,
    displayName: read('APP_DISPLAY_NAME') ?? shell.brandName,
    scheme: read('APP_SCHEME') ?? shell.scheme,
    iosBundleIdentifier: read('APP_IOS_BUNDLE_IDENTIFIER') ?? placeholder,
    androidPackage: read('APP_ANDROID_PACKAGE') ?? placeholder,
    easProjectId: read('EAS_PROJECT_ID'),
    googleServicesFile: read('GOOGLE_SERVICES_JSON'),
    apiUrl: read('EXPO_PUBLIC_API_URL')
  };

  const problems = [];
  if (!/^[a-z][a-z0-9+.-]*$/.test(resolved.scheme)) {
    problems.push(`APP_SCHEME must be a lowercase URL scheme, got ${JSON.stringify(resolved.scheme)}.`);
  }
  if (!IOS_ID.test(resolved.iosBundleIdentifier)) {
    problems.push(`APP_IOS_BUNDLE_IDENTIFIER is not a valid bundle identifier: ${resolved.iosBundleIdentifier}.`);
  }
  if (!ANDROID_ID.test(resolved.androidPackage)) {
    problems.push(`APP_ANDROID_PACKAGE is not a valid Android package name: ${resolved.androidPackage}.`);
  }
  if (variant !== 'development') {
    const apiProblem = checkApiUrl(resolved.apiUrl, variant);
    if (apiProblem) problems.push(apiProblem);
  }
  if (variant === 'production') {
    if (resolved.iosBundleIdentifier.startsWith(PLACEHOLDER_PREFIX)) {
      problems.push('APP_IOS_BUNDLE_IDENTIFIER is not set (the com.example.* default is a placeholder).');
    }
    if (resolved.androidPackage.startsWith(PLACEHOLDER_PREFIX)) {
      problems.push('APP_ANDROID_PACKAGE is not set (the com.example.* default is a placeholder).');
    }
  }
  if (problems.length) {
    throw new Error(
      `Refusing to configure a ${variant} build:\n` +
        problems.map((p) => `  - ${p}`).join('\n') +
        '\nSee README.md, "Building for a store".'
    );
  }
  return resolved;
};

module.exports = { resolveBuildEnv, isLoopbackHost, PLACEHOLDER_PREFIX };
