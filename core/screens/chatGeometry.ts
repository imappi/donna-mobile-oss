import { resolveArtifactVerticalGeometry } from '../design/artifactGeometry';
import { shellGeometry } from '../design/tokens';

export type ChatVerticalGeometryInput = { keyboardOverlap: number | null; safeBottom: number };

/** Chat has its own compact header and no floating launcher; its composer clears the safe area. */
export const resolveChatVerticalGeometry = (input: ChatVerticalGeometryInput) =>
  resolveArtifactVerticalGeometry({ ...input, dockHeight: shellGeometry.chat.composerHeight });
