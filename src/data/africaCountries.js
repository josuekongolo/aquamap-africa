// All 54 African countries for the map's country-data layer. Factual reference
// only — name, flag, approximate centroid [lat, lng] and ISO-3 code. Production
// figures come LIVE from the World Bank (src/lib/worldbank.js); no stat is invented
// here. The three pilot countries (Senegal, Côte d'Ivoire, Cameroon) are enriched
// with the hand-verified authority / target data from institutions.js.
import { countries as curated } from './institutions';

const BASE = [
  { name: 'Algérie', flag: '🇩🇿', iso3: 'DZA', coords: [28.0, 1.7] },
  { name: 'Angola', flag: '🇦🇴', iso3: 'AGO', coords: [-11.2, 17.9] },
  { name: 'Bénin', flag: '🇧🇯', iso3: 'BEN', coords: [9.3, 2.3] },
  { name: 'Botswana', flag: '🇧🇼', iso3: 'BWA', coords: [-22.3, 24.7] },
  { name: 'Burkina Faso', flag: '🇧🇫', iso3: 'BFA', coords: [12.2, -1.6] },
  { name: 'Burundi', flag: '🇧🇮', iso3: 'BDI', coords: [-3.4, 29.9] },
  { name: 'Cap-Vert', flag: '🇨🇻', iso3: 'CPV', coords: [16.0, -24.0] },
  { name: 'Cameroun', flag: '🇨🇲', iso3: 'CMR', coords: [5.7, 12.74] },
  { name: 'République centrafricaine', flag: '🇨🇫', iso3: 'CAF', coords: [6.6, 20.9] },
  { name: 'Tchad', flag: '🇹🇩', iso3: 'TCD', coords: [15.5, 18.7] },
  { name: 'Comores', flag: '🇰🇲', iso3: 'COM', coords: [-11.9, 43.9] },
  { name: 'Congo', flag: '🇨🇬', iso3: 'COG', coords: [-0.7, 15.8] },
  { name: 'RD Congo', flag: '🇨🇩', iso3: 'COD', coords: [-2.9, 23.7] },
  { name: "Côte d'Ivoire", flag: '🇨🇮', iso3: 'CIV', coords: [7.54, -5.55] },
  { name: 'Djibouti', flag: '🇩🇯', iso3: 'DJI', coords: [11.8, 42.6] },
  { name: 'Égypte', flag: '🇪🇬', iso3: 'EGY', coords: [26.8, 30.8] },
  { name: 'Guinée équatoriale', flag: '🇬🇶', iso3: 'GNQ', coords: [1.6, 10.3] },
  { name: 'Érythrée', flag: '🇪🇷', iso3: 'ERI', coords: [15.2, 39.8] },
  { name: 'Eswatini', flag: '🇸🇿', iso3: 'SWZ', coords: [-26.5, 31.5] },
  { name: 'Éthiopie', flag: '🇪🇹', iso3: 'ETH', coords: [9.1, 40.5] },
  { name: 'Gabon', flag: '🇬🇦', iso3: 'GAB', coords: [-0.8, 11.6] },
  { name: 'Gambie', flag: '🇬🇲', iso3: 'GMB', coords: [13.4, -15.3] },
  { name: 'Ghana', flag: '🇬🇭', iso3: 'GHA', coords: [7.9, -1.0] },
  { name: 'Guinée', flag: '🇬🇳', iso3: 'GIN', coords: [9.9, -9.7] },
  { name: 'Guinée-Bissau', flag: '🇬🇼', iso3: 'GNB', coords: [12.0, -15.0] },
  { name: 'Kenya', flag: '🇰🇪', iso3: 'KEN', coords: [0.0, 37.9] },
  { name: 'Lesotho', flag: '🇱🇸', iso3: 'LSO', coords: [-29.6, 28.2] },
  { name: 'Libéria', flag: '🇱🇷', iso3: 'LBR', coords: [6.4, -9.4] },
  { name: 'Libye', flag: '🇱🇾', iso3: 'LBY', coords: [26.3, 17.2] },
  { name: 'Madagascar', flag: '🇲🇬', iso3: 'MDG', coords: [-18.8, 46.9] },
  { name: 'Malawi', flag: '🇲🇼', iso3: 'MWI', coords: [-13.3, 34.3] },
  { name: 'Mali', flag: '🇲🇱', iso3: 'MLI', coords: [17.6, -4.0] },
  { name: 'Mauritanie', flag: '🇲🇷', iso3: 'MRT', coords: [20.3, -10.9] },
  { name: 'Maurice', flag: '🇲🇺', iso3: 'MUS', coords: [-20.3, 57.6] },
  { name: 'Maroc', flag: '🇲🇦', iso3: 'MAR', coords: [31.8, -7.1] },
  { name: 'Mozambique', flag: '🇲🇿', iso3: 'MOZ', coords: [-18.7, 35.5] },
  { name: 'Namibie', flag: '🇳🇦', iso3: 'NAM', coords: [-22.6, 17.1] },
  { name: 'Niger', flag: '🇳🇪', iso3: 'NER', coords: [17.6, 8.1] },
  { name: 'Nigéria', flag: '🇳🇬', iso3: 'NGA', coords: [9.1, 8.7] },
  { name: 'Rwanda', flag: '🇷🇼', iso3: 'RWA', coords: [-1.9, 29.9] },
  { name: 'Sao Tomé-et-Principe', flag: '🇸🇹', iso3: 'STP', coords: [0.2, 6.6] },
  { name: 'Sénégal', flag: '🇸🇳', iso3: 'SEN', coords: [14.5, -14.45] },
  { name: 'Seychelles', flag: '🇸🇨', iso3: 'SYC', coords: [-4.7, 55.5] },
  { name: 'Sierra Leone', flag: '🇸🇱', iso3: 'SLE', coords: [8.5, -11.8] },
  { name: 'Somalie', flag: '🇸🇴', iso3: 'SOM', coords: [5.2, 46.2] },
  { name: 'Afrique du Sud', flag: '🇿🇦', iso3: 'ZAF', coords: [-30.6, 22.9] },
  { name: 'Soudan du Sud', flag: '🇸🇸', iso3: 'SSD', coords: [7.9, 30.0] },
  { name: 'Soudan', flag: '🇸🇩', iso3: 'SDN', coords: [15.5, 30.2] },
  { name: 'Tanzanie', flag: '🇹🇿', iso3: 'TZA', coords: [-6.4, 34.9] },
  { name: 'Togo', flag: '🇹🇬', iso3: 'TGO', coords: [8.6, 0.8] },
  { name: 'Tunisie', flag: '🇹🇳', iso3: 'TUN', coords: [33.9, 9.6] },
  { name: 'Ouganda', flag: '🇺🇬', iso3: 'UGA', coords: [1.4, 32.3] },
  { name: 'Zambie', flag: '🇿🇲', iso3: 'ZMB', coords: [-13.1, 27.8] },
  { name: 'Zimbabwe', flag: '🇿🇼', iso3: 'ZWE', coords: [-19.0, 29.2] },
];

const curatedByName = Object.fromEntries(curated.map((c) => [c.name, c]));

// All 54, with the 3 pilot countries enriched by the curated institutional data.
export const africaCountries = BASE.map((b) => ({ ...b, ...(curatedByName[b.name] || {}) }));

// ISO-3 → display name, for the World Bank query.
export const ISO_TO_NAME = Object.fromEntries(BASE.map((b) => [b.iso3, b.name]));
