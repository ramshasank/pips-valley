/* Paintings stay on this device. IndexedDB avoids filling the small settings store. */
(function () {
  'use strict';
  const cache = new Map();
  let dbPromise, problem = '';
  function database() {
    if (!dbPromise) dbPromise = new Promise((resolve) => {
      if (!window.indexedDB) { problem = 'Paintings can only be kept until this tab closes.'; return resolve(null); }
      let request;
      try { request = indexedDB.open('pips-artwork', 1); } catch (e) { problem = 'Painting storage is unavailable.'; return resolve(null); }
      request.onupgradeneeded = () => request.result.createObjectStore('paintings');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { problem = 'Painting storage is unavailable.'; resolve(null); };
      request.onblocked = () => { problem = 'Close other Pip tabs to enable painting storage.'; resolve(null); };
    });
    return dbPromise;
  }
  function remember(key, data) {
    cache.delete(key); cache.set(key, data);
    if (cache.size > 20) cache.delete(cache.keys().next().value);
  }
  function forget(prefix) {
    for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
  }
  K.artwork = {
    status: () => problem,
    async get(key) {
      if (cache.has(key)) return cache.get(key);
      const db = await database(); if (!db) return null;
      return new Promise((resolve) => {
        try {
          const request = db.transaction('paintings').objectStore('paintings').get(key);
          request.onsuccess = () => { const data = request.result || null; if (data) remember(key, data); resolve(data); };
          request.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    },
    put(key, data) {
      remember(key, data); // available immediately when a resize rebuilds the canvas
      return database().then((db) => {
        if (!db) return false;
        return new Promise((resolve) => {
          try {
            const tx = db.transaction('paintings', 'readwrite');
            tx.objectStore('paintings').put(data, key);
            tx.oncomplete = () => { problem = ''; resolve(true); };
            tx.onerror = tx.onabort = () => { problem = 'This device could not save the latest painting. Keep this tab open.'; resolve(false); };
          } catch (e) { problem = 'Painting storage is unavailable.'; resolve(false); }
        });
      });
    },
    async removePlayer(id) {
      const prefix = id + ':';
      forget(prefix);
      const db = await database(); if (!db) return;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('paintings', 'readwrite');
          const request = tx.objectStore('paintings').openCursor();
          request.onsuccess = () => { const c = request.result; if (c) { if (String(c.key).startsWith(prefix)) c.delete(); c.continue(); } };
          // A read started before deletion may have repopulated the cache while this
          // transaction waited. Clear it again once the stored copies are gone.
          tx.oncomplete = () => { forget(prefix); resolve(); };
          tx.onerror = tx.onabort = resolve;
        } catch (e) { resolve(); }
      });
    },
  };
})();
