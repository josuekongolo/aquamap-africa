// World Bank Indicators API — live aquaculture production (metric tons).
// Free, no key. Indicator ER.FSH.AQUA.MT. Cached 1 day via Next fetch revalidate.
// Covers all 54 African countries (ISO map in src/data/africaCountries.js).
// Returns { [appCountryName]: [{ year, value }] } sorted ascending, or {} on failure
// (callers fall back to the sourced figures in institutions.js).
import { ISO_TO_NAME } from '../data/africaCountries';

export async function getAquacultureProduction() {
  try {
    const codes = Object.keys(ISO_TO_NAME).join(';');
    const url =
      `https://api.worldbank.org/v2/country/${codes}/indicator/ER.FSH.AQUA.MT` +
      '?format=json&per_page=20000';
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
