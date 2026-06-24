import MapPage from '@/src/views/MapPage';
import { getAquacultureProduction } from '@/src/lib/worldbank';

export const metadata = {
  title: "Carte de l'aquaculture en Afrique francophone — AquaMap Africa",
  description: "Panorama institutionnel : autorités nationales, chiffres de production officiels et objectifs au Sénégal, en Côte d'Ivoire et au Cameroun.",
};

// Revalidate the live World Bank data once a day.
export const revalidate = 86400;

export default async function Page() {
  const liveProduction = await getAquacultureProduction();
  return <MapPage liveProduction={liveProduction} />;
}
