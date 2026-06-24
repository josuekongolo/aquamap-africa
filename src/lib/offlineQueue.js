// Tiny IndexedDB-backed write queue for offline-first data capture.
// Each item: { id, table, payload, queuedAt }. Replayed to Supabase on reconnect.
// All functions are no-ops/safe if called where IndexedDB is unavailable.

const DB_NAME = 'aquamap';
const STORE = 'queue';
const VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('no-idb')); return; }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function reqP(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(item) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  return reqP(tx.objectStore(STORE).add({ ...item, queuedAt: Date.now() }));
}

export async function allQueued() {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  return reqP(tx.objectStore(STORE).getAll());
}

export async function removeQueued(id) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  return reqP(tx.objectStore(STORE).delete(id));
}

export async function countQueued() {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  return reqP(tx.objectStore(STORE).count());
}

// Notify the app a write was queued (so the offline banner can refresh).
export function notifyQueued() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('aquamap:queued'));
}
