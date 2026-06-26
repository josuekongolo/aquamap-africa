// Supplier discovery via Google Places (New). Primary source for /suppliers; the
// curated list in src/data/suppliers.js is the client-side fallback when this is
// unconfigured or returns nothing. Search internals live in src/lib/places.js.
import { searchPlaces, PLACES_COUNTRIES, PLACES_ALL_CODES } from '@/src/lib/places';

export const dynamic = 'force-dynamic';

// Category → search phrase. Kept generic so Places matches feed mills, hatcheries,
// equipment importers, etc. operating locally.
const CATEGORY_QUERY = {
  feed: 'aquaculture fish feed supplier',
  fingerling: 'fish fingerling hatchery supplier',
  ras: 'aquaculture equipment RAS recirculating system supplier',
  aeration: 'pond aerator aquaculture equipment supplier',
  water: 'water quality testing equipment supplier',
  all: 'aquaculture supplier equipment',
};

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const category = params.get('category') || 'all';
  const countryParam = (params.get('country') || 'all').toUpperCase();
  const extra = (params.get('q') || '').trim();

  const textBase = CATEGORY_QUERY[category] || CATEGORY_QUERY.all;
  const codes = PLACES_COUNTRIES[countryParam] ? [countryParam] : PLACES_ALL_CODES;

  const result = await searchPlaces({ textBase, codes, extra });
  const status = result.error ? 502 : 200;
  return Response.json(result, { status });
}
