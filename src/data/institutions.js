// Real institutional & statistical reference data, verified June 2026.
// Every production figure is tagged with its source and year. Multiple figures
// per country can coexist (FAO FishStat vs national ministry) — both are shown
// with their provenance. No statistic here is invented.

export const countries = [
  {
    name: 'Sénégal',
    flag: '🇸🇳',
    coords: [14.5, -14.45],
    authority: {
      name: 'Agence Nationale de l\'Aquaculture (ANA)',
      ministry: 'Ministère des Pêches et de l\'Économie Maritime (MPEM)',
      website: 'https://ana.sn/',
    },
    production: [
      { value: '1 151 t', year: 2021, source: 'FAO FishStat / Country Profile', url: 'https://www.fao.org/fishery/en/facp/SEN' },
      { value: '3 049 t', year: 2026, source: 'ANA (lancement PSD 2026-2030)', url: 'https://ana.sn/' },
    ],
    target: '20 000 t et 26 000 emplois d\'ici 2030 (ANA, PSD 2026-2030)',
    mainSpecies: ['Tilapia (>50%)', 'Huîtres', 'Moules'],
  },
  {
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    coords: [7.54, -5.55],
    authority: {
      name: 'Direction de l\'Aquaculture (DA)',
      ministry: 'Ministère des Ressources Animales et Halieutiques (MIRAH)',
      website: 'https://ressourcesanimales.gouv.ci/direction/direction-de-laquaculture-da/',
    },
    production: [
      { value: '~3 200 t (tilapia)', year: 2021, source: 'FAO FISH4ACP', url: 'https://www.fao.org/fishery/en/facp/CIV' },
      { value: '~8 467 t (total)', year: 2023, source: 'Estimations nationales', url: 'https://www.fao.org/fishery/en/facp/CIV' },
    ],
    target: '68 000 t de tilapia d\'élevage d\'ici 2031 (plan FISH4ACP)',
    mainSpecies: ['Tilapia du Nil', 'Silure africain'],
  },
  {
    name: 'Cameroun',
    flag: '🇨🇲',
    coords: [5.7, 12.74],
    authority: {
      name: 'Ministère de l\'Élevage, des Pêches et des Industries Animales (MINEPIA)',
      ministry: 'MINEPIA',
      website: 'http://www.minepia.gov.cm/',
    },
    production: [
      { value: '~10 000+ t', year: 2022, source: 'MINEPIA (cité par Investir au Cameroun)', url: 'https://www.fao.org/fishery/en/facp/CMR' },
    ],
    target: '100 000 t/an (objectif gouvernemental) — déficit estimé ~270 000 t/an',
    mainSpecies: ['Tilapia du Nil (~84%)', 'Silure africain (~16%)'],
    note: 'Le Cameroun ne dispose pas de système statistique fiable — chiffres indicatifs.',
  },
];

// FAO / development-bank data portals and pitch entry points — all real.
export const dataSources = [
  { name: 'FAO FishStat', desc: { fr: 'Statistiques mondiales de pêche et d\'aquaculture', en: 'Global fisheries & aquaculture statistics' }, url: 'https://www.fao.org/fishery/en/fishstat' },
  { name: 'FAO — Profils par pays (FACP)', desc: { fr: 'Profils statistiques et descriptifs par pays', en: 'Country statistical & narrative profiles' }, url: 'https://www.fao.org/fishery/en/facp/SEN' },
  { name: 'FAO Bureau sous-régional Afrique de l\'Ouest (Dakar)', desc: { fr: 'Couvre les 15 États de la CEDEAO', en: 'Covers the 15 ECOWAS member states' }, url: 'https://www.fao.org/africa/about-us/our-offices/fao-subregional-office-for-west-africa/en' },
  { name: 'FAO FISH4ACP', desc: { fr: 'Programme phare FAO sur les chaînes de valeur aquacoles', en: 'FAO flagship aquaculture value-chain programme' }, url: 'https://www.fao.org/in-action/fish-4-acp/' },
  { name: 'AfDB — TAAT Aquaculture Compact', desc: { fr: 'Inclut la Côte d\'Ivoire et le Cameroun (WorldFish + IITA)', en: 'Includes Côte d\'Ivoire and Cameroon (WorldFish + IITA)' }, url: 'https://taat-africa.org/aquaculture/' },
  { name: 'World Bank PROBLUE', desc: { fr: 'Fonds économie bleue — pilier pêche & aquaculture', en: 'Blue-economy fund — fisheries & aquaculture pillar' }, url: 'https://www.worldbank.org/en/programs/problue' },
];
