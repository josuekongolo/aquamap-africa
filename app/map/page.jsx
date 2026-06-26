import MapPage from '@/src/views/MapPage';
import { getAquacultureProduction } from '@/src/lib/worldbank';

export const metadata = {
  title: "Carte de l'aquaculture en Afrique — AQAFRIKA",
  description: "Sites aquacoles et données de production à travers toute l'Afrique (54 pays, Banque mondiale), avec les autorités et objectifs nationaux des pays pilotes.",
};

// Revalidate the live World Bank data once a day.
export const revalidate = 86400;

export default async function Page() {
  const liveProduction = await getAquacultureProduction();
  return <MapPage liveProduction={liveProduction} />;
}
