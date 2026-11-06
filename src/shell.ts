/**
 * The ONE fork point. A market fork changes this import to its own shell
 * (e.g. `@shells/fi/shell`) and touches nothing else outside `shells/`.
 */
export { shell } from '@shells/donna/shell';
