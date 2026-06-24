// Real, verified aquaculture suppliers serving or active in francophone West &
// Central Africa (Senegal, Côte d'Ivoire, Cameroon). Verified June 2026.
// Contact fields are null when not publicly published — none are fabricated.
// `confidence` reflects how strongly the company's existence/reach was verified.

export const supplierCategories = [
  { id: 'all', label: { fr: 'Tous', en: 'All' }, icon: '🏷️' },
  { id: 'feed', label: { fr: 'Aliments', en: 'Feed' }, icon: '🌾' },
  { id: 'fingerling', label: { fr: 'Alevins', en: 'Fingerlings' }, icon: '🐟' },
  { id: 'ras', label: { fr: 'RAS & équipement', en: 'RAS & equipment' }, icon: '♻️' },
  { id: 'aeration', label: { fr: 'Aération', en: 'Aeration' }, icon: '💨' },
  { id: 'water', label: { fr: 'Tests d\'eau', en: 'Water testing' }, icon: '🔬' },
];

export const suppliers = [
  // ---- FEED ----
  {
    id: 's1', name: 'Le Gouessant Aquaculture', country: 'France', city: 'Lamballe-Armor',
    category: 'feed', logo: '🌾', confidence: 'high',
    products: ['Aliment tilapia', 'Aliment silure', 'Aliment poissons marins', 'Aliment crevette'],
    website: 'https://aqua.legouessant.com', email: null, phone: '+33 2 96 30 74 74',
    servesRegion: ['Sénégal', "Côte d'Ivoire", 'Cameroun'],
  },
  {
    id: 's2', name: 'Raanan Fish Feed West Africa', country: 'Ghana', city: 'Prampram',
    category: 'feed', logo: '🐟', confidence: 'high',
    products: ['Aliment extrudé tilapia', 'Aliment extrudé silure'],
    website: 'https://www.raananfishfeed-wa.com', email: null, phone: null,
    servesRegion: ['Sénégal', 'Cameroun'],
  },
  {
    id: 's3', name: 'Aller Aqua', country: 'Danemark', city: 'Christiansfeld (usines Égypte & Zambie)',
    category: 'feed', logo: '🏭', confidence: 'high',
    products: ['Aliment extrudé', 'Aliment tilapia', 'Aliment silure'],
    website: 'https://www.aller-aqua.com', email: null, phone: null,
    servesRegion: ['Sénégal', 'Cameroun'],
  },
  {
    id: 's4', name: 'Skretting', country: 'Norvège', city: 'Stavanger (ventes Nigéria)',
    category: 'feed', logo: '🐠', confidence: 'medium',
    products: ['Aliment silure', 'Aliment tilapia', 'Aliment crevette'],
    website: 'https://www.skretting.com', email: null, phone: '+47 51 88 00 10',
    servesRegion: ['Afrique de l\'Ouest'],
  },
  {
    id: 's5', name: 'Alltech Coppens', country: 'Pays-Bas', city: 'Helmond',
    category: 'feed', logo: '🌾', confidence: 'medium',
    products: ['Aliment tilapia', 'Aliment truite', 'Aliment silure'],
    website: 'https://www.alltechcoppens.com', email: null, phone: null,
    servesRegion: ['Afrique de l\'Ouest (distributeurs)'],
  },
  {
    id: 's6', name: 'SEAAN', country: 'Sénégal', city: 'Fimela (Fatick)',
    category: 'feed', logo: '🇸🇳', confidence: 'medium',
    products: ['Aliment poisson (unité semi-industrielle)', 'Poisson d\'élevage'],
    website: null, email: null, phone: null,
    servesRegion: ['Sénégal'],
  },

  // ---- FINGERLINGS ----
  {
    id: 's7', name: 'Ferme aquacole intégrée de Thiès (IRFPA)', country: 'Sénégal', city: 'Thiès',
    category: 'fingerling', logo: '🐟', confidence: 'medium',
    products: ['Alevins de tilapia', 'Alevins de silure', 'Formation aquacole'],
    website: null, email: null, phone: null,
    servesRegion: ['Sénégal'],
  },
  {
    id: 's8', name: 'Durante Fish Industries', country: 'Nigéria', city: 'Ibadan',
    category: 'fingerling', logo: '🥚', confidence: 'high',
    products: ['Alevins de silure', 'Alevins tilapia (mâles)', 'Géniteurs', 'Aliment', 'Conseil'],
    website: null, email: null, phone: null,
    servesRegion: ['Afrique de l\'Ouest'],
  },
  {
    id: 's9', name: 'Écloserie de tilapia Andé-Adzopé', country: "Côte d'Ivoire", city: 'Andé (Adzopé)',
    category: 'fingerling', logo: '🐟', confidence: 'medium',
    products: ['Alevins de tilapia', 'Élevage en cages flottantes'],
    website: null, email: null, phone: null,
    servesRegion: ["Côte d'Ivoire"],
  },

  // ---- RAS & EQUIPMENT ----
  {
    id: 's10', name: 'FoodTechAfrica / FisHub', country: 'Pays-Bas', city: 'Consortium (fermes démo Kenya/Tanzanie/Rwanda)',
    category: 'ras', logo: '♻️', confidence: 'high',
    products: ['Unités RAS modulaires', 'Systèmes clés en main', 'Bassins', 'Filtration'],
    website: 'https://foodtechafrica.com', email: null, phone: null,
    servesRegion: ['Afrique (focus Est/Centre)'],
  },
  {
    id: 's11', name: 'Innovasea', country: 'États-Unis', city: 'Boston',
    category: 'ras', logo: '🌐', confidence: 'high',
    products: ['Équipement RAS', 'Systèmes de support de vie', 'Conception de systèmes'],
    website: 'https://www.innovasea.com', email: null, phone: null,
    servesRegion: ['International (export Afrique)'],
  },
  {
    id: 's12', name: 'Integrated Aqua Systems', country: 'États-Unis', city: 'Livraison mondiale',
    category: 'ras', logo: '📐', confidence: 'high',
    products: ['RAS clés en main', 'Bassins', 'Filtration', 'Pompes', 'Contrôle'],
    website: 'https://integrated-aqua.com', email: null, phone: null,
    servesRegion: ['International (export)'],
  },
  {
    id: 's13', name: 'eWater Aquaculture Equipment', country: 'Chine', city: 'Chine',
    category: 'ras', logo: '⚙️', confidence: 'medium',
    products: ['Systèmes RAS industriels', 'Équipement aquacole'],
    website: 'https://www.ewater-ras.com', email: null, phone: null,
    servesRegion: ['International (export Afrique)'],
  },

  // ---- AERATION ----
  {
    id: 's14', name: 'Pentair Aquatic Eco-Systems', country: 'États-Unis', city: 'Apopka, FL',
    category: 'aeration', logo: '💨', confidence: 'high',
    products: ['Aérateurs à roue', 'Soufflantes', 'Diffuseurs', 'Oxygénation', 'Kits de test'],
    website: 'https://pentairaes.com', email: null, phone: null,
    servesRegion: ['International (export mondial)'],
  },
  {
    id: 's15', name: 'FUTI Aquaculture Equipment', country: 'Chine', city: 'Chine',
    category: 'aeration', logo: '🌀', confidence: 'medium',
    products: ['Aérateurs à roue', 'Aérateurs solaires/diesel/électriques'],
    website: 'https://iaerator.com', email: null, phone: null,
    servesRegion: ['International (clients Afrique)'],
  },
  {
    id: 's16', name: 'AQUAMERIK', country: 'Canada', city: 'Québec',
    category: 'aeration', logo: '🍁', confidence: 'high',
    products: ['Aérateurs à roue', 'Équipement d\'écloserie'],
    website: 'https://www.aquamerik.com', email: null, phone: null,
    servesRegion: ['International (francophone)'],
  },

  // ---- WATER TESTING ----
  {
    id: 's17', name: 'YSI (Xylem)', country: 'États-Unis', city: 'Yellow Springs, OH',
    category: 'water', logo: '🔬', confidence: 'high',
    products: ['Oxymètres', 'Sonde multiparamètre ProDSS', 'Sondes qualité d\'eau', 'Moniteurs continus'],
    website: 'https://www.ysi.com', email: null, phone: null,
    servesRegion: ['International (distributeurs Afrique)'],
  },
  {
    id: 's18', name: 'Hanna Instruments', country: 'États-Unis / Italie', city: 'Woonsocket, RI',
    category: 'water', logo: '🧫', confidence: 'high',
    products: ['Kits de test aquacole', 'Photomètre HI83303', 'Sondes pH/O₂/ammoniac/nitrite'],
    website: 'https://hannainst.com', email: null, phone: null,
    servesRegion: ['International (distributeurs Afrique)'],
  },
  {
    id: 's19', name: 'AquaKoom (Geej Gi)', country: 'Sénégal', city: 'Sénégal',
    category: 'water', logo: '🇸🇳', confidence: 'medium',
    products: ['Fournitures aquacoles', 'Équipement'],
    website: 'https://aquakoom.com', email: null, phone: null,
    servesRegion: ['Sénégal'],
  },
];
