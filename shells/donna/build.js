/**
 * The Donna shell's build defaults: what app.config.js needs before any
 * build variable is set. Plain CommonJS because it is read by Node at build
 * time, not bundled. Published identifiers (bundle id, package) are NOT
 * here: a publisher supplies them through the build environment
 * (config/buildEnv.js).
 */
module.exports = {
  /** Used only in the placeholder identifier com.example.<id>. */
  id: 'donna',
  /** Default display name under the icon; matches shell.ts `brandName`. */
  brandName: 'Donna',
  /** Default deep-link scheme. */
  scheme: 'donna',
  /** Expo project slug. */
  slug: 'donna-mobile'
};
