// World Bank Indicators API — live aquaculture production (metric tons).
// Free, no key. Indicator ER.FSH.AQUA.MT. Cached 1 day via Next fetch revalidate.
// Returns { [appCountryName]: [{ year, value }] } sorted ascending, or {} on failure
// (callers fall back to the sourced figures in institutions.js).

const ISO_TO_NAME = { SEN: 'Sénégal', CIV: "Côte d'Ivoire", CMR: 'Cameroun' };

export async function getAquacultureProduction() {
  try {
    const url =
      'https://api.worldbank.org/v2/country/SEN;CIV;CMR/indicator/ER.FSH.AQUA.MT' +
      '?format=json&per_page=500';
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return {};
    const json = await res.json();
    const rows = Array.isArray(json) ? json[1] : null;
    if (!rows) return {};
    const byCountry = {};
    for (const r of rows) {
      const name = ISO_TO_NAME[r.countryiso3code];
      if (!name || r.value == null) continue;
      (byCountry[name] ||= []).push({ year: Number(r.date), value: r.value });
    }
    for (const k of Object.keys(byCountry)) byCountry[k].sort((a, b) => a.year - b.year);
    return byCountry;
  } catch {
    return {};
  }
}
