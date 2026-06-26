// Drop non-African results from the Places sweep. The sweep restricts to a
// rectangle whose NE corner pulls in Arabia, the Levant and southern Europe.
// Geometry can't cleanly separate them (the Red Sea and Mediterranean are too
// narrow), but Google's formatted addresses for those foreign results reliably
// END in the country name ("…, Saudi Arabia"), whereas African ones don't (they
// end in an African country or just a city). So we match the LAST address segment
// against a non-African blocklist — this never clips African coastal data.

const NON_AFRICAN = new RegExp(
  '\\b(' + [
    'saudi arabia', 'yemen', 'oman', 'united arab emirates', 'u\\.a\\.e', 'qatar',
    'bahrain', 'kuwait', 'iraq', 'iran', 'jordan', 'israel', 'palestin\\w*',
    'lebanon', 'syria', 't[üu]rkiye', 'turkey', 'cyprus',
    'spain', 'espa[ñn]a', 'portugal', 'france', 'italy', 'italia',
    'greece', 'gr[èe]ce', 'malta', 'gibraltar',
  ].join('|') + ')\\b',
  'i',
);

// True if the address clearly belongs to a non-African country (checked on the
// last comma-segment, which is where Google puts the country).
export function isNonAfricanAddress(address) {
  if (!address) return false; // no country named → keep (African addresses often omit it)
  const lastSeg = String(address).split(',').pop().trim();
  return NON_AFRICAN.test(lastSeg);
}

// Canonical African country names (English, as Google returns them under en).
export const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon',
  'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Republic of the Congo',
  'Democratic Republic of the Congo', "Côte d'Ivoire", 'Djibouti', 'Egypt',
  'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar',
  'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia',
  'Niger', 'Nigeria', 'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles',
  'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania',
  'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe',
];

// Aliases / local-language forms → canonical, so the country filter doesn't split.
const ALIASES = {
  'ivory coast': "Côte d'Ivoire", "cote d'ivoire": "Côte d'Ivoire",
  'the gambia': 'Gambia', swaziland: 'Eswatini', 'cabo verde': 'Cape Verde',
  drc: 'Democratic Republic of the Congo', 'dr congo': 'Democratic Republic of the Congo',
  sénégal: 'Senegal', cameroun: 'Cameroon', 'guinée': 'Guinea', tchad: 'Chad',
  maroc: 'Morocco', tunisie: 'Tunisia', algérie: 'Algeria', égypte: 'Egypt',
};
const CANON = new Map(AFRICAN_COUNTRIES.map((c) => [c.toLowerCase(), c]));

// Best-effort country from a Google address (last comma-segment). null if it isn't
// a recognised African country (e.g. the address is just a city or a plus-code).
export function countryFromAddress(address) {
  if (!address) return null;
  const seg = String(address).split(',').pop().trim().toLowerCase();
  return CANON.get(seg) || ALIASES[seg] || null;
}
