// Real, verified technical resources for the AquaMap Africa knowledge base.
// Every entry is a genuine, freely accessible publication from FAO, WorldFish,
// ECOWAS or a national authority, with a working URL.
// Sourced and verified June 2026. Do not add fabricated documents or URLs here.

export const knowledgeCategories = [
  { id: 'all', label: { fr: 'Tout', en: 'All' }, icon: '📚' },
  { id: 'species', label: { fr: 'Espèces', en: 'Species' }, icon: '🐟' },
  { id: 'disease', label: { fr: 'Santé & maladies', en: 'Health & disease' }, icon: '🦠' },
  { id: 'feed', label: { fr: 'Alimentation & FCR', en: 'Feed & FCR' }, icon: '🌾' },
  { id: 'water', label: { fr: "Qualité de l'eau", en: 'Water quality' }, icon: '💧' },
  { id: 'ras', label: { fr: 'Systèmes RAS', en: 'RAS systems' }, icon: '♻️' },
  { id: 'regulation', label: { fr: 'Réglementation', en: 'Regulation' }, icon: '📋' },
];

export const knowledge = [
  // ---- SPECIES ----
  {
    id: 'k1',
    category: 'species',
    icon: '🦐',
    title: 'Farming freshwater prawns — manual for Macrobrachium rosenbergii',
    org: 'FAO — Fisheries Technical Paper 428',
    url: 'https://www.fao.org/4/y4100e/y4100e00.htm',
    lang: ['EN', 'FR', 'ES'],
    desc: {
      fr: "Guide pratique pour l'écloserie, le pré-grossissement et le grossissement des crevettes d'eau douce.",
      en: 'Practical guide to freshwater prawn hatchery, nursery and grow-out culture.',
    },
  },
  {
    id: 'k2',
    category: 'species',
    icon: '🐟',
    title: 'Nile tilapia (Oreochromis niloticus) — species profile',
    org: 'FAO — Cultured Aquatic Species Information Programme',
    url: 'https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_niletilapia.htm',
    lang: ['EN'],
    desc: {
      fr: "Profil FAO du tilapia du Nil : biologie, systèmes d'élevage et production.",
      en: 'FAO profile of Nile tilapia: biology, husbandry systems and production.',
    },
  },
  {
    id: 'k3',
    category: 'species',
    icon: '🐡',
    title: 'African catfish (Clarias gariepinus) production manual',
    org: 'FAO (Péteri et al., 2015)',
    url: 'https://openknowledge.fao.org/server/api/core/bitstreams/f8fb572b-7d08-45cc-ac5c-4aa7ef4c5e4d/content',
    lang: ['EN'],
    desc: {
      fr: 'Manuel complet sur la reproduction, la production d\'alevins et le grossissement du silure africain.',
      en: 'Full manual on African catfish reproduction, fingerling production and grow-out.',
    },
  },
  {
    id: 'k4',
    category: 'species',
    icon: '🐠',
    title: 'Artificial reproduction and pond rearing of the African catfish',
    org: 'FAO',
    url: 'https://www.fao.org/4/ac578e/AC578E11.htm',
    lang: ['EN'],
    desc: {
      fr: 'Techniques de reproduction induite, écloserie et élevage en étang du silure africain.',
      en: 'Induced spawning, hatchery and pond rearing techniques for African catfish.',
    },
  },
  {
    id: 'k5',
    category: 'species',
    icon: '🎣',
    title: 'Carp polyculture manual (Cyprinus carpio)',
    org: 'FAO — Technical Paper 554',
    url: 'https://www.fao.org/4/i1794e/i1794e00.htm',
    lang: ['EN'],
    desc: {
      fr: 'Principes et techniques de la polyculture de la carpe commune en étang.',
      en: 'Principles and techniques of common carp pond polyculture.',
    },
  },

  // ---- DISEASE / HEALTH ----
  {
    id: 'k6',
    category: 'disease',
    icon: '🦠',
    title: 'Tilapia lake virus (TiLV) disease strategy manual',
    org: 'FAO — Circular NFIM/C1220',
    url: 'https://openknowledge.fao.org/items/b2e0313a-745f-40b3-a3e2-998bcefc53f4',
    lang: ['EN'],
    desc: {
      fr: 'Planification d\'urgence et biosécurité pour réduire les pertes dues au virus TiLV.',
      en: 'Contingency planning and biosecurity to reduce losses from the TiLV virus.',
    },
  },
  {
    id: 'k7',
    category: 'disease',
    icon: '🛡️',
    title: 'Progressive Management Pathway for Aquaculture Biosecurity (PMP/AB)',
    org: 'FAO',
    url: 'https://www.fao.org/in-action/aquatic-health-management-biosecurity/our-approach/en',
    lang: ['EN', 'FR'],
    desc: {
      fr: 'Cadre par étapes, basé sur le risque, pour renforcer la biosécurité aquacole.',
      en: 'Risk-based, staged framework for building aquaculture biosecurity.',
    },
  },
  {
    id: 'k8',
    category: 'disease',
    icon: '🎓',
    title: 'Aquaculture biosecurity: managing disease risks (free e-learning)',
    org: 'FAO eLearning Academy',
    url: 'https://elearning.fao.org/course/view.php?id=979',
    lang: ['EN'],
    desc: {
      fr: 'Cours gratuit en ligne sur la biosécurité et la gestion des risques de maladies.',
      en: 'Free online course on biosecurity and disease-risk management.',
    },
  },

  // ---- FEED & FCR ----
  {
    id: 'k9',
    category: 'feed',
    icon: '📊',
    title: 'On-farm feeding and feed management in aquaculture',
    org: 'FAO — Technical Paper 583',
    url: 'https://www.fao.org/4/i3481e/i3481e.pdf',
    lang: ['EN'],
    desc: {
      fr: "Stratégies d'alimentation et amélioration du FCR pour les systèmes à petite échelle.",
      en: 'Feeding strategies and FCR improvement for small-scale systems.',
    },
  },
  {
    id: 'k10',
    category: 'feed',
    icon: '🌾',
    title: 'Farm-made aquafeeds — using local ingredients',
    org: 'FAO — Technical Paper 343',
    url: 'https://www.fao.org/4/v4430e/V4430E00.htm',
    lang: ['EN'],
    desc: {
      fr: "Formuler des aliments à faible coût à partir d'ingrédients locaux disponibles.",
      en: 'Formulating low-cost feeds from locally available ingredients.',
    },
  },
  {
    id: 'k11',
    category: 'feed',
    icon: '🧪',
    title: 'Quality low-cost fish feed formulation & production',
    org: 'WorldFish — extension manual',
    url: 'https://www.aquafeed.com/documents/239/0520256001629890546.pdf',
    lang: ['EN'],
    desc: {
      fr: 'Ingrédients locaux (manioc, tourteau d\'arachide, son de riz) pour aliments tilapia/silure.',
      en: 'Local ingredients (cassava, groundnut cake, rice bran) for tilapia/catfish feed.',
    },
  },
  {
    id: 'k12',
    category: 'feed',
    icon: '🪰',
    title: 'Black soldier fly larvae as a fishmeal substitute',
    org: 'FAO',
    url: 'https://www.fao.org/platforms/water-scarcity/Outreach/blog-on-water-scarcity/blog-detail/sustainable-land-and-water-for-food-security/2024/06/18/the-black-soldier-fly-revolution-in-support-of-waste-reduction--food-security--and--water-conservation/en',
    lang: ['EN'],
    desc: {
      fr: 'Les larves de mouche soldat noire comme protéine alternative à la farine de poisson.',
      en: 'Black soldier fly larvae as an alternative protein to fishmeal.',
    },
  },

  // ---- WATER QUALITY ----
  {
    id: 'k13',
    category: 'water',
    icon: '💧',
    title: "Améliorer la qualité de l'eau d'un étang",
    org: 'FAO — Méthodes simples pour l\'aquaculture',
    url: 'https://www.fao.org/fishery/static/FAO_Training/FAO_Training/General/x6709f/x6709f02.htm',
    lang: ['FR'],
    desc: {
      fr: 'Gestion pratique de la qualité de l\'eau : pH, transparence, température, oxygène dissous.',
      en: 'Practical pond water-quality management: pH, transparency, temperature, dissolved oxygen.',
    },
  },
  {
    id: 'k14',
    category: 'water',
    icon: '📖',
    title: "Méthodes simples pour l'aquaculture (collection complète)",
    org: 'FAO',
    url: 'https://www.fao.org/fishery/static/FAO_Training/FAO_Training/General/intro_f.htm',
    lang: ['FR'],
    desc: {
      fr: "Index des manuels FAO en français : eau, sol, topographie, construction et gestion d'étangs.",
      en: 'Index of FAO French manuals: water, soil, topography, pond construction and management.',
    },
  },

  // ---- RAS ----
  {
    id: 'k15',
    category: 'ras',
    icon: '♻️',
    title: 'Small-scale aquaponic food production (integrated/RAS)',
    org: 'FAO — Technical Paper 589',
    url: 'https://openknowledge.fao.org/server/api/core/bitstreams/2ca21047-390f-42cd-bd1d-0c2ebc9c1df2/content',
    lang: ['EN'],
    desc: {
      fr: 'Introduction aux systèmes en recirculation : réutilisation de l\'eau, biofiltration, conception.',
      en: 'Introduction to recirculating systems: water reuse, biofiltration, design.',
    },
  },

  // ---- REGULATION ----
  {
    id: 'k16',
    category: 'regulation',
    icon: '🌍',
    title: 'Stratégie régionale CEDEAO pour la pêche et l\'aquaculture (CSF-DPA 2019)',
    org: 'CEDEAO / ECOWAS (ECOWAP)',
    url: 'https://ecowap.ecowas.int/media/ecowap/file_document/2019_Regional_strategy_Fisheries__Aquaculture_CSFS-FAD_EN.pdf',
    lang: ['EN', 'FR'],
    desc: {
      fr: 'Stratégie régionale CEDEAO pour une pêche et une aquaculture durables.',
      en: 'ECOWAS regional strategy for sustainable fisheries and aquaculture.',
    },
  },
  {
    id: 'k17',
    category: 'regulation',
    icon: '🇸🇳',
    title: 'Loi n° 2022-06 portant Code de l\'aquaculture (Sénégal)',
    org: 'République du Sénégal / FAOLEX',
    url: 'https://faolex.fao.org/docs/pdf/sen213333.pdf',
    lang: ['FR'],
    desc: {
      fr: 'Code national de l\'aquaculture du Sénégal (Journal Officiel n°7528, 14 mai 2022).',
      en: "Senegal's national Aquaculture Code (Official Gazette no. 7528, 14 May 2022).",
    },
  },
  {
    id: 'k18',
    category: 'regulation',
    icon: '🇨🇮',
    title: 'Loi n° 2016-554 relative à la pêche et à l\'aquaculture (Côte d\'Ivoire)',
    org: 'République de Côte d\'Ivoire / FAOLEX',
    url: 'https://www.fao.org/faolex/results/details/en/c/LEX-FAOC159952/',
    lang: ['FR'],
    desc: {
      fr: 'Loi ivoirienne sur la pêche et l\'aquaculture (121 articles).',
      en: "Côte d'Ivoire's fisheries and aquaculture law (121 articles).",
    },
  },
];
