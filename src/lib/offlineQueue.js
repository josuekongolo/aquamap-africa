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
  // Stamp the row's own primary key with a client-generated UUID. Every data
  // table is `id uuid primary key default gen_random_uuid()`, so supplying `id`
  // makes replay idempotent: if a queued insert actually reached the server but
  // its ack was lost, the retry hits a duplicate-key error (handled as success
  // by the flusher) instead of creating a duplicate row.
  const payload = item.payload && !item.payload.id
    ? { ...item.payload, id: cryptoRandomId() }
    : item.payload;
  return reqP(tx.objectStore(STORE).add({ ...item, payload, tries: 0, queuedAt: Date.now() }));
}

function cryptoRandomId() {
  // A real UUID (the id columns are typed uuid). randomUUID is available in all
  // modern mobile browsers and secure contexts.
  return crypto.randomUUID();
}

// Increment the retry counter on a queued item (poison-item backoff).
export async function bumpTries(id) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const item = await reqP(store.get(id));
  if (item) { item.tries = (item.tries || 0) + 1; await reqP(store.put(item)); }
}

// Clear the whole queue (called on sign-out — queued rows carry farmer PII and
// belong to the agent who was signed in).
export async function clearQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  return reqP(tx.objectStore(STORE).clear());
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
