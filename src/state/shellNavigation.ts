export const LAUNCHER_ACTIONS = [
  { key: 'chat', labelKey: 'plus.chatWithDonna', iconName: 'message-circle', prominent: true },
  { key: 'snap', labelKey: 'plus.snap', iconName: 'camera', prominent: false },
  { key: 'file', labelKey: 'plus.addFile', iconName: 'file-plus', prominent: false },
  { key: 'mileage', labelKey: 'plus.mileage', iconName: 'car', prominent: false }
] as const;

export type LauncherActionKey = (typeof LAUNCHER_ACTIONS)[number]['key'];

export const destinationForLauncherAction = (key: LauncherActionKey): '/chat' | '/mileage' | null => {
  if (key === 'chat') return '/chat';
  if (key === 'mileage') return '/mileage';
  return null;
};

/** Captures settle back into the unified Books stream, including offline ones. */
export const CAPTURE_RETURN_HREF = '/actions' as const;

export const OWNER_MENU_ACTIONS = [
  { key: 'status', labelKey: 'ownerMenu.status', iconName: 'bar-chart-2' },
  { key: 'activity', labelKey: 'ownerMenu.activity', iconName: 'bell' },
  { key: 'entities', labelKey: 'ownerMenu.switchBooks', iconName: 'briefcase' },
  { key: 'account', labelKey: 'ownerMenu.account', iconName: 'user' },
  { key: 'signOut', labelKey: 'auth.signOut', iconName: 'log-out' }
] as const;

export type OwnerMenuActionKey = (typeof OWNER_MENU_ACTIONS)[number]['key'];

/** Entity switching is useful only when the authenticated owner has a choice. */
export const ownerMenuActions = (multiEntity: boolean) =>
  OWNER_MENU_ACTIONS.filter((action) => multiEntity || action.key !== 'entities');

export const destinationForOwnerMenuAction = (
  key: OwnerMenuActionKey
): '/books-status' | '/activity' | '/entities' | '/account' | null => {
  if (key === 'status') return '/books-status';
  if (key === 'activity') return '/activity';
  if (key === 'entities') return '/entities';
  if (key === 'account') return '/account';
  return null;
};
