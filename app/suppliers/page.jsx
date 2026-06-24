import Suppliers from '@/src/views/Suppliers';

export const metadata = {
  title: 'Fournisseurs aquacoles vérifiés (aliments, alevins, RAS) — AquaMap Africa',
  description: 'Annuaire de fournisseurs réels desservant le Sénégal, la Côte d’Ivoire et le Cameroun : aliments, alevins, équipement RAS, aération et tests d’eau.',
};

export default function Page() {
  return <Suppliers />;
}
