import { speciesBenchmarks, rateFCR } from '../data/species';

// Turn a raw FCR into an actionable, plain-language insight for a given species.
// FCR baselines are species-specific (prawn optimal ~2–3, not <2), so the action
// always references the species' own optimal band.
export function fcrInsight(speciesKey, fcr, lang = 'fr') {
  const b = speciesBenchmarks[speciesKey] || speciesBenchmarks.Tilapia;
  const { status, color } = rateFCR(speciesKey, fcr);
  const opt = `${b.fcrOptimal[0]}–${b.fcrOptimal[1]}`;
  const M = {
    fr: {
      excellent: { verdict: 'Excellent', action: `Dans la plage optimale (${opt}). Maintenez vos pratiques.` },
      correct: { verdict: 'Correct', action: `Acceptable, mais visez ${opt} : vérifiez la qualité de l'aliment et évitez le gaspillage.` },
      high: { verdict: 'À améliorer', action: `Trop d'aliment par kg produit. Réduisez les rations ~10–15 %, contrôlez le gaspillage et la qualité de l'eau (cible ${opt}).` },
    },
    en: {
      excellent: { verdict: 'Excellent', action: `Within the optimal range (${opt}). Keep your current practices.` },
      correct: { verdict: 'Acceptable', action: `OK, but aim for ${opt}: check feed quality and avoid waste.` },
      high: { verdict: 'Needs work', action: `Too much feed per kg produced. Cut rations ~10–15%, check waste and water quality (target ${opt}).` },
    },
  }[lang] || {};
  return { status, color, ...(M[status] || {}) };
}
