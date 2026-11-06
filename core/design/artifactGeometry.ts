import { artifact } from './tokens';

export type ArtifactVerticalGeometryInput = {
  keyboardOverlap: number | null;
  safeBottom: number;
  dockHeight?: number;
};

/**
 * Native keyboards may overlay the window instead of resizing it. Keep the
 * item composer above the measured frame, or above the real safe area while
 * closed, and reserve the same space in the reading flow.
 */
export const resolveArtifactVerticalGeometry = ({
  keyboardOverlap,
  safeBottom,
  dockHeight = artifact.composerHeight
}: ArtifactVerticalGeometryInput) => {
  const composerBottom =
    keyboardOverlap !== null
      ? keyboardOverlap + artifact.composerKeyboardGap
      : safeBottom + artifact.composerBottomGap;

  return {
    composerBottom,
    threadPaddingBottom:
      composerBottom + dockHeight + artifact.composerThreadGap
  };
};
