/**
 * The ONE fork point. A market fork changes this import to its own shell
 * (e.g. `@shells/fi/shell`) and touches nothing else outside `shells/`,
 * except the matching build-defaults import at the top of app.config.js.
 */
export { shell } from '@shells/donna/shell';
