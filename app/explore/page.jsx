import ProtectedRoute from '@/src/components/ProtectedRoute';
import Explore from '@/src/views/Explore';

export const metadata = { title: 'Explorer la carte — AquaMap Africa' };

export default function Page() {
  return (
    <ProtectedRoute>
      <Explore />
    </ProtectedRoute>
  );
}
