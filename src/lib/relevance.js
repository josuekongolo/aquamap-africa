// Relevance filter for the Places sweeps. Broad queries ("fish feed", "aquaculture
// equipment") pull in retail and unrelated businesses — supermarkets, grocery
// stores, ranches, pet shops, restaurants, poultry farms, pharmacies, etc. This
// drops places whose primary type or name clearly isn't an aquaculture
// site / equipment supplier.

// Primary place types (Google's primaryTypeDisplayName) that are never relevant.
const EXCLUDE_TYPES = new Set([
  'supermarket', 'grocery store', 'hypermarket', 'discount supermarket',
  'convenience store', 'asian grocery store', 'food store', 'food',
  'department store', 'shopping mall', 'general store', 'pet store',
  'restaurant', 'seafood restaurant', 'takeout restaurant', 'fish & chips restaurant',
  'meal takeaway', 'meal delivery', 'cafe', 'café', 'bar', 'bakery',
  'butcher shop', 'pharmacy', 'hospital', 'medical clinic', 'medical laboratory',
  'dental clinic', 'veterinary care', 'lodging', 'hotel', 'tourist attraction',
  'garden center', 'building materials store', 'hardware store',
  'home goods store', 'home improvement store', 'furniture store',
  'clothing store', 'electronics store', 'gas station', 'bank', 'atm',
  'car repair', 'car dealer', 'school', 'university', 'church', 'mosque',
  "farmers' market", 'ranch', 'real estate agency',
]);

// Name stems that mark non-aquaculture businesses (poultry/livestock/retail/etc.).
// Leading \b only (no trailing boundary) so plurals/derivatives match: "chicken"
// catches "Chickens", "grocer" catches "grocery/groceries", "pharmac" → "pharmacy".
const EXCLUDE_NAME = new RegExp(
  '\\b(' + [
    'poultry', 'chicken', 'broiler', 'piggery', 'pork', 'cattle', 'abattoir',
    'supermarket', 'hypermarket', 'grocer', 'pharmac', 'hospital', 'clinic',
    'school', 'college', 'universit', 'church', 'mosque', 'hotel', 'lodge',
    'guesthouse', 'guest house', 'restaurant', 'bakery', 'butcher', 'boutique',
    'cosmetic', 'petroleum', 'filling station', 'pet shop', 'pet store',
  ].join('|') + ')',
  'i',
);

// True if this place should be dropped (not an aquaculture site / supplier).
export function isIrrelevantPlace(type, name) {
  if (type && EXCLUDE_TYPES.has(String(type).toLowerCase().trim())) return true;
  if (name && EXCLUDE_NAME.test(name)) return true;
  return false;
}
