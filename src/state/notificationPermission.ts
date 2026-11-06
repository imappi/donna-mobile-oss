type Permission = { granted: boolean; canAskAgain: boolean };
type PermissionSource = {
  getPermissionsAsync: () => Promise<Permission>;
  requestPermissionsAsync: () => Promise<Permission>;
};

/** Reading/restoring a session is never permission to show the OS prompt. */
export const notificationPermissionGranted = async (source: PermissionSource, ask: boolean) => {
  const current = await source.getPermissionsAsync();
  if (current.granted) return true;
  if (!ask || !current.canAskAgain) return false;
  return (await source.requestPermissionsAsync()).granted;
};

type SeenStore = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<unknown> };

/** Persistence prevents nagging; the in-memory ticket prevents direct/restored-route prompts. */
export const createNotificationMoment = (storage: SeenStore) => {
  let pending: string | null = null;
  return {
    async offerAfterConfirmation(principalId: string) {
      pending = null;
      const key = `donna.notification-intro.v1.${principalId}`;
      try {
        if (await storage.getItem(key)) return false;
        await storage.setItem(key, 'seen');
        pending = principalId;
        return true;
      } catch { return false; } // Storage must not block entry into Books.
    },
    isPending: (principalId: string) => pending === principalId,
    finish: () => { pending = null; }
  };
};
