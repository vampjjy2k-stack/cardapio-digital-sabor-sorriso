import { AdminLoginLimiter } from '../../workers/admin-login-limiter.js';

// Apenas teste unitário. A garantia real é exercitada em login-runtime.test.mjs.
export function fakeLoginNamespace() {
  const objects = new Map();
  return {
    idFromName: name => name,
    get(name) {
      if (!objects.has(name)) {
        const map = new Map();
        let tail = Promise.resolve();
        const storage = {
          transaction(callback) {
            const next = tail.then(() => callback({
              get: async key => map.get(key),
              put: async (key, value) => { map.set(key, value); },
              delete: async key => { map.delete(key); },
            }));
            tail = next.catch(() => {});
            return next;
          },
        };
        objects.set(name, new AdminLoginLimiter({ storage }));
      }
      return { fetch: (url, init) => objects.get(name).fetch(new Request(url, init)) };
    },
  };
}
