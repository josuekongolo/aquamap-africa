// Server-only helpers for the Google Places API (New) "Text Search".
// Shared by the suppliers discovery route (3-country) and the map aquaculture-sites
// route (whole-of-Africa tile grid). Requires GOOGLE_PLACES_API_KEY (server env).
// Never import from client code.

import { isNonAfricanAddress } from './africa.js';
import { isIrrelevantPlace } from './relevance.js';

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

// ── Suppliers: the 3 countries AquaMap registers operators in ──
export const PLACES_COUNTRIES = {
  SN: 'Sénégal',
  CI: "Côte d'Ivoire",
  CM: 'Cameroun',
};
export const PLACES_ALL_CODES = Object.keys(PLACES_COUNTRIES);

// regionCode only *biases* results (foreign matches leak in) and local addresses
// often omit the country, so we constrain geographically. Boxes are
// { low:[minLat,minLng], high:[maxLat,maxLng] }.
const COUNTRY_BBOX = {
  SN: { low: [12.0, -17.6], high: [16.75, -11.3] },
  CI: { low: [4.2, -8.65], high: [10.8, -2.4] },
  CM: { low: [1.6, 8.4], high: [13.1, 16.25] },
};

// Whole continent (mainland + Indian-Ocean island states). Used to tile the map.
export const AFRICA_BBOX = { low: [-35.5, -18.0], high: [38.0, 60.5] };

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.location',
  'places.primaryTypeDisplayName',
  'places.googleMapsUri',
].join(',');

function inRect(lat, lng, rect) {
  if (!rect || lat == null || lng == null) return false;
  return lat >= rect.low[0] && lat <= rect.high[0] && lng >= rect.low[1] && lng <= rect.high[1];
}

function normalize(p) {
  return {
    id: p.id,
    name: p.displayName?.text || null,
    address: p.formattedAddress || null,
    phone: p.internationalPhoneNumber || p.nationalPhoneNumber || null,
    website: p.websiteUri || null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    type: p.primaryTypeDisplayName?.text || null,
    mapsUri: p.googleMapsUri || null,
    source: 'google_places',
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One Places Text Search bounded to `rect`. Results outside the rect (Places only
// biases, it doesn't hard-clip) are dropped by the guard. Retries on rate-limit
// (429) / transient 5xx with backoff so bursty tile sweeps don't lose tiles.
async function searchRect(key, textQuery, rect, { regionCode, languageCode = 'en', retries = 4 } = {}) {
  const body = JSON.stringify({
    textQuery,
    ...(regionCode ? { regionCode } : {}),
    languageCode,
    maxResultCount: 20,
    locationRestriction: {
      rectangle: {
        low: { latitude: rect.low[0], longitude: rect.low[1] },
        high: { latitude: rect.high[0], longitude: rect.high[1] },
      },
    },
  });
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(PLACES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELD_MASK },
      body,
      cache: 'no-store',
    });
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await sleep(500 * 2 ** attempt); // 0.5s, 1s, 2s, 4s
      continue;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || `Places API error (${res.status})`);
    return (json.places || []).map(normalize).filter((c) => c.name && inRect(c.lat, c.lng, rect));
  }
}

// Split a bbox into a grid of ~`step`-degree tiles (Text Search caps at 20 results
// per query, so tiling is how we get continent-wide coverage).
function tiles(bbox, step) {
  const out = [];
  for (let lat = bbox.low[0]; lat < bbox.high[0]; lat += step) {
    for (let lng = bbox.low[1]; lng < bbox.high[1]; lng += step) {
      out.push({ low: [lat, lng], high: [Math.min(lat + step, bbox.high[0]), Math.min(lng + step, bbox.high[1])] });
    }
  }
  return out;
}

// Split a rectangle into its 4 quadrants (for adaptive subdivision).
function quadrants(rect) {
  const midLat = (rect.low[0] + rect.high[0]) / 2;
  const midLng = (rect.low[1] + rect.high[1]) / 2;
  return [
    { low: [rect.low[0], rect.low[1]], high: [midLat, midLng] },
    { low: [rect.low[0], midLng], high: [midLat, rect.high[1]] },
    { low: [midLat, rect.low[1]], high: [rect.high[0], midLng] },
    { low: [midLat, midLng], high: [rect.high[0], rect.high[1]] },
  ];
}

// Concurrency-limited work pool. The handler receives (item, enqueue); calling
// enqueue(children) adds more work. Resolves once the queue drains and nothing is
// in flight — so dynamically-added work (subdivision) is awaited correctly.
function runPool(initialItems, concurrency, handler) {
  return new Promise((resolve) => {
    const queue = [...initialItems];
    let active = 0;
    let settled = false;
    const enqueue = (children) => { for (const c of children) queue.push(c); };
    function pump() {
      if (settled) return;
      while (active < concurrency && queue.length) {
        const item = queue.shift();
        active++;
        Promise.resolve(handler(item, enqueue))
          .catch(() => {})
          .finally(() => { active--; pump(); });
      }
      if (active === 0 && queue.length === 0) { settled = true; resolve(); }
    }
    pump();
  });
}

function mergeDedupe(settledArrays) {
  const seen = new Set();
  const merged = [];
  for (const arr of settledArrays) {
    for (const c of arr) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      merged.push(c);
    }
  }
  return merged;
}

// Module-level cache (per server instance). Place IDs are cacheable indefinitely;
// other fields per Google terms up to 30 days.
const cache = new Map(); // key -> { at, value }
async function cached(key, ttlMs, run) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return { value: hit.value, cached: true };
  const value = await run();
  cache.set(key, { at: Date.now(), value });
  return { value, cached: false };
}

// ── Suppliers: per-country search across the covered countries (default all 3) ──
export async function searchPlaces({ textBase, codes = PLACES_ALL_CODES, extra = '', ttlMs = 6 * 60 * 60 * 1000 }) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { candidates: [], configured: false };

  const cacheKey = `c|${textBase}|${codes.join(',')}|${extra}`;
  try {
    const { value: candidates, cached: hit } = await cached(cacheKey, ttlMs, async () => {
      const settled = await Promise.allSettled(codes.map((code) => {
        const textQuery = [extra, textBase, PLACES_COUNTRIES[code]].filter(Boolean).join(' ');
        return searchRect(key, textQuery, COUNTRY_BBOX[code], { regionCode: code, languageCode: 'fr' });
      }));
      const ok = settled.filter((s) => s.status === 'fulfilled');
      if (ok.length === 0) throw settled[0]?.reason || new Error('Places API error');
      return mergeDedupe(ok.map((s) => s.value));
    });
    return { candidates, configured: true, cached: hit };
  } catch (e) {
    return { candidates: [], configured: true, error: String(e?.message || e) };
  }
}

// ── Map: adaptively sweep the whole of Africa for aquaculture sites ──
// Starts from a coarse grid and subdivides any tile that comes back saturated
// (>= SATURATED hits) so dense regions are fully covered, not capped at 20.
// Per tile we run several SHORT query terms (long stacked queries over-constrain
// Places and return nothing); the terms together cover Anglophone ("fish farm")
// and Francophone ("pisciculture") naming. `maxCalls` is a runaway-cost backstop.
const SATURATED = 20; // Text Search hard cap per query
export async function searchAfrica({
  terms = ['aquaculture', 'fish farm', 'pisciculture'],
  step = 13,
  maxDepth = 4,
  maxCalls = 2500,
  concurrency = 6,
  ttlMs = 24 * 60 * 60 * 1000,
} = {}) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { candidates: [], configured: false };

  const cacheKey = `africa-adaptive|${terms.join('+')}|${step}|${maxDepth}`;
  try {
    const { value, cached: hit } = await cached(cacheKey, ttlMs, async () => {
      let calls = 0;
      let capped = false;
      const found = new Map(); // id -> candidate (global dedupe)
      const initial = tiles(AFRICA_BBOX, step).map((rect) => ({ rect, depth: 0 }));
      await runPool(initial, concurrency, async ({ rect, depth }, enqueue) => {
        if (calls + terms.length > maxCalls) { capped = true; return; }
        calls += terms.length;
        const arrs = await Promise.all(
          terms.map((t) => searchRect(key, t, rect, { languageCode: 'en' }).catch(() => [])),
        );
        // Saturation is judged on the raw tile result (before the continent filter),
        // so dense Arabia-adjacent tiles still subdivide and don't starve African coast.
        let maxLen = 0;
        for (const arr of arrs) {
          maxLen = Math.max(maxLen, arr.length);
          for (const c of arr) {
            if (isNonAfricanAddress(c.address) || isIrrelevantPlace(c.type, c.name)) continue;
            found.set(c.id, c);
          }
        }
        // Any term saturating means the area is dense → subdivide.
        if (maxLen >= SATURATED && depth < maxDepth) {
          if (calls + terms.length * 4 > maxCalls) { capped = true; return; }
          enqueue(quadrants(rect).map((r) => ({ rect: r, depth: depth + 1 })));
        }
      });
      return { candidates: [...found.values()], calls, capped };
    });
    return { ...value, configured: true, cached: hit };
  } catch (e) {
    return { candidates: [], configured: true, error: String(e?.message || e) };
  }
}
