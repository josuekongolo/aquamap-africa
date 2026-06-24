// Sourced aquaculture benchmarks powering the FCR calculator and growth guidance.
// Sources: FAO (TP 428, TP 583, r9972e, ac229e, AFFRIS Table 28), SRAC Pub. 282,
// Mengistu et al. 2020 (Reviews in Aquaculture). Verified June 2026.
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
