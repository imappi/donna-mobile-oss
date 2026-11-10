/**
 * Push registrations, upserted on (principal, token): the same device
 * registering again under the same principal gets the same id back, and
 * nothing is written unless platform or locale changed. The app registers
 * on every sign-in, so this is what keeps registrations from growing.
 */
export const createPushRegistrations = (newId) => {
  const byId = new Map(); // id -> { principal_id, platform, expo_push_token, locale }
  let writes = 0;
  return {
    upsert(principalId, { platform, expo_push_token, locale = null }) {
      for (const [id, reg] of byId) {
        if (reg.principal_id !== principalId || reg.expo_push_token !== expo_push_token) continue;
        if (reg.platform !== platform || reg.locale !== locale) {
          byId.set(id, { ...reg, platform, locale });
          writes += 1;
        }
        return id;
      }
      const id = newId();
      byId.set(id, { principal_id: principalId, platform, expo_push_token, locale });
      writes += 1;
      return id;
    },
    remove(principalId, id) {
      if (byId.get(id)?.principal_id !== principalId) return false;
      byId.delete(id);
      writes += 1;
      return true;
    },
    get: (id) => byId.get(id) ?? null,
    get size() {
      return byId.size;
    },
    get writes() {
      return writes;
    }
  };
};
