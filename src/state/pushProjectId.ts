/**
 * The EAS project id Expo push tokens are issued for. A build configured
 * without one (no EAS_PROJECT_ID, see config/buildEnv.js) cannot get a push
 * token, so push is "unavailable" there: registration stops before it would
 * show the OS permission prompt for nothing.
 */
type ProjectIdSource = {
  expoConfig?: { extra?: { eas?: { projectId?: unknown } } } | null;
  easConfig?: { projectId?: unknown } | null;
};

const nonEmpty = (value: unknown) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null);

export const pushProjectId = (constants: ProjectIdSource): string | null =>
  nonEmpty(constants.expoConfig?.extra?.eas?.projectId) ?? nonEmpty(constants.easConfig?.projectId);
