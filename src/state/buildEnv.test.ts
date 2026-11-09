// Build configuration tests. They live here because `npm test` runs
// src/state/*.test.ts; the code under test is config/buildEnv.js and
// app.config.js, which run in Node at build time, never on the device.
import assert from 'node:assert/strict';
import test from 'node:test';
import { color } from '../../core/design/tokens';
import { isLoopbackHost, resolveBuildEnv } from '../../config/buildEnv';
import appConfig from '../../app.config';
import { pushProjectId } from './pushProjectId';

const shell = { id: 'fork', brandName: 'Fork', scheme: 'fork' };
const release = {
  APP_IOS_BUNDLE_IDENTIFIER: 'org.fork.app',
  APP_ANDROID_PACKAGE: 'org.fork.app',
  EXPO_PUBLIC_API_URL: 'https://api.fork.test'
};

const withEnv = <T>(env: Record<string, string | undefined>, run: () => T): T => {
  const keys = ['APP_VARIANT', 'APP_DISPLAY_NAME', 'APP_SCHEME', 'APP_IOS_BUNDLE_IDENTIFIER',
    'APP_ANDROID_PACKAGE', 'EAS_PROJECT_ID', 'GOOGLE_SERVICES_JSON', 'EXPO_PUBLIC_API_URL'];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  for (const k of keys) delete process.env[k];
  Object.assign(process.env, env);
  try {
    return run();
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
};

test('development needs nothing and gets obvious placeholders from the shell', () => {
  const b = resolveBuildEnv({}, shell);
  assert.equal(b.variant, 'development');
  assert.equal(b.displayName, 'Fork');
  assert.equal(b.scheme, 'fork');
  assert.equal(b.iosBundleIdentifier, 'com.example.fork');
  assert.equal(b.androidPackage, 'com.example.fork');
  assert.equal(b.apiUrl, undefined);
  assert.equal(b.easProjectId, undefined);
});

test('a publisher sets identity through the environment, not source', () => {
  const b = resolveBuildEnv({ ...release, APP_VARIANT: 'production', APP_DISPLAY_NAME: 'Books',
    APP_SCHEME: 'books', EAS_PROJECT_ID: 'project-1' }, shell);
  assert.equal(b.displayName, 'Books');
  assert.equal(b.scheme, 'books');
  assert.equal(b.iosBundleIdentifier, 'org.fork.app');
  assert.equal(b.androidPackage, 'org.fork.app');
  assert.equal(b.easProjectId, 'project-1');
});

test('production refuses a missing, plain-HTTP or loopback backend', () => {
  const prod = { ...release, APP_VARIANT: 'production' };
  assert.throws(() => resolveBuildEnv({ ...prod, EXPO_PUBLIC_API_URL: undefined }, shell), /EXPO_PUBLIC_API_URL is not set/);
  assert.throws(() => resolveBuildEnv({ ...prod, EXPO_PUBLIC_API_URL: '  ' }, shell), /EXPO_PUBLIC_API_URL is not set/);
  assert.throws(() => resolveBuildEnv({ ...prod, EXPO_PUBLIC_API_URL: 'http://api.fork.test' }, shell), /must use HTTPS/);
  assert.throws(() => resolveBuildEnv({ ...prod, EXPO_PUBLIC_API_URL: 'not a url' }, shell), /not a URL/);
  for (const url of ['https://localhost:4141', 'https://127.0.0.1', 'https://[::1]:4141', 'https://0.0.0.0',
    'https://api.localhost', 'https://LOCALHOST']) {
    assert.throws(() => resolveBuildEnv({ ...prod, EXPO_PUBLIC_API_URL: url }, shell), /loopback/, url);
  }
  assert.doesNotThrow(() => resolveBuildEnv(prod, shell));
});

test('production refuses placeholder identifiers', () => {
  assert.throws(
    () => resolveBuildEnv({ APP_VARIANT: 'production', EXPO_PUBLIC_API_URL: release.EXPO_PUBLIC_API_URL }, shell),
    (e: Error) => /APP_IOS_BUNDLE_IDENTIFIER is not set/.test(e.message) && /APP_ANDROID_PACKAGE is not set/.test(e.message)
  );
});

test('preview must name its backend but may use a LAN mock over HTTP', () => {
  assert.throws(() => resolveBuildEnv({ APP_VARIANT: 'preview' }, shell), /EXPO_PUBLIC_API_URL is not set/);
  assert.equal(resolveBuildEnv({ APP_VARIANT: 'preview', EXPO_PUBLIC_API_URL: 'http://192.168.1.20:4141' }, shell).apiUrl,
    'http://192.168.1.20:4141');
});

test('malformed identity values and unknown variants fail loudly', () => {
  assert.throws(() => resolveBuildEnv({ APP_VARIANT: 'staging' }, shell), /APP_VARIANT/);
  assert.throws(() => resolveBuildEnv({ APP_ANDROID_PACKAGE: 'org.fork-app.x' }, shell), /not a valid Android package/);
  assert.throws(() => resolveBuildEnv({ APP_IOS_BUNDLE_IDENTIFIER: 'single' }, shell), /not a valid bundle identifier/);
  assert.throws(() => resolveBuildEnv({ APP_SCHEME: 'Has Space' }, shell), /APP_SCHEME/);
});

test('loopback detection does not catch real hosts', () => {
  for (const host of ['api.fork.test', '10.0.0.5', 'localhost.fork.test', '128.0.0.1']) {
    assert.equal(isLoopbackHost(host), false, host);
  }
});

test('app.config.js: defaults validate, the canvas is the design paper, and no brand comes from source', () => {
  const config = withEnv({}, () => appConfig());
  assert.equal(config.backgroundColor, color.paper);
  assert.equal(config.android.adaptiveIcon.backgroundColor, color.paper);
  assert.equal(config.ios.bundleIdentifier, 'com.example.donna');
  assert.equal(config.android.package, 'com.example.donna');
  assert.equal(config.extra.eas, undefined);
  assert.equal(config.android.googleServicesFile, undefined);

  const renamed = withEnv({ ...release, APP_DISPLAY_NAME: 'Books', EAS_PROJECT_ID: 'project-1',
    GOOGLE_SERVICES_JSON: '/secure/google-services.json' }, () => appConfig());
  assert.equal(renamed.name, 'Books');
  assert.equal(renamed.android.googleServicesFile, '/secure/google-services.json');
  assert.ok(!JSON.stringify(renamed.plugins).includes('Donna'), 'permission strings follow the display name');
  assert.equal(pushProjectId({ expoConfig: renamed }), 'project-1');
});

test('app.config.js: no plugin deletes the microphone permission the voice introduction needs', () => {
  const config = withEnv({}, () => appConfig());
  const options = (plugin: string) =>
    config.plugins.find((p: unknown) => Array.isArray(p) && p[0] === plugin)?.[1] as Record<string, unknown>;
  for (const plugin of ['expo-camera', 'expo-image-picker', 'expo-audio']) {
    assert.equal(typeof options(plugin).microphonePermission, 'string', plugin);
  }
  assert.equal(options('expo-audio').recordAudioAndroid, true);
  assert.equal(options('expo-audio').enableBackgroundPlayback, false);
});

test('app.config.js throws for a production build without a backend', () => {
  assert.throws(() => withEnv({ APP_VARIANT: 'production' }, () => appConfig()), /Refusing to configure a production build/);
});

test('push is unavailable, not broken, without a project id', () => {
  assert.equal(pushProjectId({}), null);
  assert.equal(pushProjectId({ expoConfig: { extra: {} }, easConfig: null }), null);
  assert.equal(pushProjectId({ expoConfig: { extra: { eas: { projectId: '' } } } }), null);
  assert.equal(pushProjectId({ easConfig: { projectId: 'project-2' } }), 'project-2');
});
