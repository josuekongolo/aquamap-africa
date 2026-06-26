// Sourced aquaculture benchmarks powering the FCR calculator and growth guidance.
// Sources: FAO (TP 428, TP 583, r9972e, ac229e, AFFRIS Table 28), SRAC Pub. 282,
// Mengistu et al. 2020 (Reviews in Aquaculture), FAO Cultured Aquatic Species
// Information Programme (species fact sheets), plus per-species refs below.
// Verified June 2026.
// Growth-curve intermediate points marked `estimated:true` are interpolated between
// sourced anchor weights — surface a disclaimer when displaying them.
//
// IMPORTANT: FCR baselines are species-specific. A universal "good FCR < 2.0" is
// wrong for prawn (optimal ~2.0–3.0). Always compare against the species baseline.

export const speciesBenchmarks = {
  Tilapia: {
    key: 'Tilapia',
    scientificName: 'Oreochromis niloticus',
    icon: '🐟',
    fcrOptimal: [1.4, 1.8],
    fcrTypical: [1.5, 2.5],
    fcrPoorField: 3.0, // weak source — poorly managed ponds
    growoutDays: [150, 240],
    marketWeightG: [400, 500],
    growthCurve: [
      { day: 0, weightG: 5, estimated: false },
      { day: 30, weightG: 25, estimated: true },
      { day: 60, weightG: 70, estimated: true },
      { day: 90, weightG: 150, estimated: true },
      { day: 120, weightG: 250, estimated: true },
      { day: 150, weightG: 350, estimated: true },
      { day: 180, weightG: 450, estimated: true },
    ],
    water: { tempC: [25, 32], doMin: 5.0, ph: [6, 9], ammonia: 1.0 },
    feedProteinPct: { fry: [30, 35], growout: [28, 32] },
    sources: [
      'https://aquaculture.mgcafe.uky.edu/sites/aquaculture.ca.uky.edu/files/srac_282_tank_culture_of_tilapia.pdf',
      'https://www.fao.org/fileadmin/user_upload/affris/docs/tilapiaT28.pdf',
    ],
  },
  Silure: {
    key: 'Silure',
    scientificName: 'Clarias gariepinus',
    icon: '🐡',
    fcrOptimal: [1.0, 1.3],
    fcrTypical: [1.1, 1.6],
    fcrPoorField: null, // not corroborated — Clarias is feed-efficient
    growoutDays: [154, 210],
    marketWeightG: [420, 850],
    growthCurve: [
      { day: 0, weightG: 1, estimated: false },
      { day: 30, weightG: 5, estimated: false },
      { day: 60, weightG: 12, estimated: false },
      { day: 90, weightG: 110, estimated: true },
      { day: 120, weightG: 320, estimated: true },
      { day: 150, weightG: 700, estimated: true },
      { day: 154, weightG: 850, estimated: false },
    ],
    water: { tempC: [28, 30], doMin: 3.0, ph: [6.5, 9.0], ammonia: 0.6 },
    feedProteinPct: { fry: [38, 55], growout: [35, 43] },
    sources: ['https://www.fao.org/fishery/docs/CDrom/T583/root/17.pdf'],
  },
  Carpe: {
    key: 'Carpe',
    scientificName: 'Cyprinus carpio',
    icon: '🎣',
    fcrOptimal: [1.3, 1.7],
    fcrTypical: [1.3, 2.25],
    fcrPoorField: null,
    growoutDays: [180, 180],
    marketWeightG: [600, 1000],
    growthCurve: [
      { day: 0, weightG: 90, estimated: false },
      { day: 30, weightG: 150, estimated: true },
      { day: 60, weightG: 240, estimated: true },
      { day: 90, weightG: 360, estimated: true },
      { day: 120, weightG: 500, estimated: true },
      { day: 150, weightG: 650, estimated: true },
      { day: 180, weightG: 800, estimated: false },
    ],
    water: { tempC: [23, 30], doMin: 5.0, ph: [6.5, 9.0], ammonia: 1.0 },
    feedProteinPct: { fry: [41, 45], growout: [31, 38] },
    sources: ['https://www.fao.org/4/r9972e/r9972e10.htm'],
  },
  Crevette: {
    key: 'Crevette',
    scientificName: 'Macrobrachium rosenbergii',
    icon: '🦐',
    fcrOptimal: [2.0, 3.0], // genuinely higher baseline than finfish
    fcrTypical: [2.4, 2.95],
    fcrPoorField: 4.0, // semi-moist 4-5, wet/trash feed 7-9
    growoutDays: [270, 365],
    marketWeightG: [20, 40],
    growthCurve: [
      { day: 0, weightG: 0.33, estimated: false },
      { day: 30, weightG: 4, estimated: true },
      { day: 60, weightG: 10, estimated: true },
      { day: 90, weightG: 20, estimated: true },
      { day: 106, weightG: 30, estimated: false },
      { day: 132, weightG: 34, estimated: false },
    ],
    water: { tempC: [28, 31], doMin: 5.0, ph: [7.0, 8.5], ammonia: 0.3 },
    feedProteinPct: { fry: [35, 35], growout: [30, 30] },
    sources: ['https://www.fao.org/4/y4100e/y4100e08.htm'],
  },
  'Silure hybride': {
    key: 'Silure hybride',
    scientificName: 'Heterobranchus longifilis × Clarias gariepinus',
    icon: '🐡',
    fcrOptimal: [1.2, 1.7],
    fcrTypical: [1.5, 2.0],
    fcrPoorField: 2.7, // poorer practical diets (Keremah et al. 2013)
    growoutDays: [180, 240],
    marketWeightG: [600, 1200],
    growthCurve: [
      { day: 0, weightG: 2, estimated: false },
      { day: 30, weightG: 18, estimated: true },
      { day: 60, weightG: 80, estimated: true },
      { day: 120, weightG: 350, estimated: true },
      { day: 180, weightG: 700, estimated: true },
      { day: 240, weightG: 1100, estimated: true },
    ],
    water: { tempC: [26, 30], doMin: 3.0, ph: [6.5, 8.5], ammonia: 0.6 },
    feedProteinPct: { fry: [40, 50], growout: [35, 40] },
    sources: [
      'https://gjournals.org/GJAS/archive/april-2013-vol-34/keremah-et-al.html',
      'https://www.fao.org/fishery/docs/CDrom/T583/root/17.pdf',
    ],
  },
  'Crevette blanche': {
    key: 'Crevette blanche',
    scientificName: 'Penaeus vannamei',
    icon: '🦐',
    fcrOptimal: [1.1, 1.5],
    fcrTypical: [1.3, 1.8],
    fcrPoorField: 2.0,
    growoutDays: [100, 150],
    marketWeightG: [15, 25],
    growthCurve: [
      { day: 0, weightG: 0.01, estimated: false },
      { day: 30, weightG: 2, estimated: true },
      { day: 60, weightG: 7, estimated: true },
      { day: 90, weightG: 14, estimated: true },
      { day: 120, weightG: 20, estimated: true },
    ],
    water: { tempC: [28, 32], doMin: 5.0, ph: [7.5, 8.5], ammonia: 0.3 },
    feedProteinPct: { fry: [35, 40], growout: [30, 38] },
    sources: [
      'https://www.fao.org/fishery/en/culturedspecies/penaeus_vannamei/en',
      'https://www.researchgate.net/publication/248340105',
    ],
  },
  'Dorade royale': {
    key: 'Dorade royale',
    scientificName: 'Sparus aurata',
    icon: '🐟',
    fcrOptimal: [1.6, 2.0],
    fcrTypical: [2.0, 2.5],
    fcrPoorField: 3.0, // up to 3.0 in winter/spawning
    growoutDays: [365, 540],
    marketWeightG: [350, 500],
    growthCurve: [
      { day: 0, weightG: 2, estimated: false },
      { day: 120, weightG: 40, estimated: true },
      { day: 240, weightG: 130, estimated: true },
      { day: 365, weightG: 280, estimated: true },
      { day: 540, weightG: 450, estimated: true },
    ],
    water: { tempC: [18, 26], doMin: 5.0, ph: [7.5, 8.5], ammonia: 0.5 },
    feedProteinPct: { fry: [48, 50], growout: [42, 46] },
    sources: [
      'https://www.fao.org/fishery/en/culturedspecies/sparus_aurata/en',
      'https://www.was.org/MeetingAbstracts/ShowAbstract/153380',
    ],
  },
  'Bar': {
    key: 'Bar',
    scientificName: 'Dicentrarchus labrax',
    icon: '🐟',
    fcrOptimal: [1.3, 1.8],
    fcrTypical: [1.7, 2.2],
    fcrPoorField: 3.0, // up to 3.0 in winter/spawning
    growoutDays: [365, 540],
    marketWeightG: [350, 500],
    growthCurve: [
      { day: 0, weightG: 2, estimated: false },
      { day: 120, weightG: 35, estimated: true },
      { day: 240, weightG: 120, estimated: true },
      { day: 365, weightG: 280, estimated: true },
      { day: 540, weightG: 450, estimated: true },
    ],
    water: { tempC: [18, 26], doMin: 5.0, ph: [7.5, 8.5], ammonia: 0.5 },
    feedProteinPct: { fry: [48, 50], growout: [42, 46] },
    sources: [
      'https://www.fao.org/fishery/en/culturedspecies/dicentrarchus_labrax/en',
      'https://www.was.org/MeetingAbstracts/ShowAbstract/153380',
    ],
  },
  'Mulet': {
    key: 'Mulet',
    scientificName: 'Mugil cephalus',
    icon: '🐟',
    fcrOptimal: [1.5, 2.0],
    fcrTypical: [2.0, 3.0],
    fcrPoorField: null,
    growoutDays: [240, 365],
    marketWeightG: [400, 800],
    growthCurve: [
      { day: 0, weightG: 5, estimated: false },
      { day: 120, weightG: 150, estimated: true },
      { day: 240, weightG: 400, estimated: true },
      { day: 365, weightG: 700, estimated: true },
    ],
    water: { tempC: [18, 30], doMin: 4.0, ph: [7.0, 9.0], ammonia: 1.0 },
    feedProteinPct: { fry: [30, 35], growout: [25, 30] },
    note: 'Souvent élevé en extensif/polyculture sur nourriture naturelle — le FCR ne s’applique qu’en alimentation complémentaire.',
    sources: ['https://www.fao.org/fishery/en/culturedspecies/mugil_cephalus/en'],
  },
  'Carpe herbivore': {
    key: 'Carpe herbivore',
    scientificName: 'Ctenopharyngodon idella',
    icon: '🎣',
    fcrOptimal: [1.6, 2.2],
    fcrTypical: [2.0, 3.0],
    fcrPoorField: null,
    growoutDays: [240, 365],
    marketWeightG: [1000, 2000],
    growthCurve: [
      { day: 0, weightG: 50, estimated: false },
      { day: 120, weightG: 400, estimated: true },
      { day: 240, weightG: 950, estimated: true },
      { day: 365, weightG: 1500, estimated: true },
    ],
    water: { tempC: [20, 30], doMin: 4.0, ph: [7.0, 9.0], ammonia: 1.0 },
    feedProteinPct: { fry: [28, 32], growout: [22, 28] },
    note: 'Herbivore — souvent nourri de plantes aquatiques/herbe en polyculture ; le FCR ne vaut que pour l’aliment formulé.',
    sources: ['https://www.fao.org/fishery/en/culturedspecies/ctenopharyngodon_idella/en'],
  },
};

// Rate an FCR value against a species' benchmark. Returns a status + color.
export function rateFCR(speciesKey, fcr) {
  const b = speciesBenchmarks[speciesKey] || speciesBenchmarks.Tilapia;
  const [, optHigh] = b.fcrOptimal;
  const [, typHigh] = b.fcrTypical;
  if (fcr <= optHigh) return { status: 'excellent', color: '#00A878' };
  if (fcr <= typHigh) return { status: 'correct', color: '#F4A261' };
  return { status: 'high', color: '#ef4444' };
}

export const speciesList = Object.keys(speciesBenchmarks);
