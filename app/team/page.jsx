import ProtectedRoute from '@/src/components/ProtectedRoute';
import Team from '@/src/views/Team';

export default function Page() {
  return (
    <ProtectedRoute coordinatorOnly>
      <Team />
    </ProtectedRoute>
  );
}
