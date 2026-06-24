import ProtectedRoute from '@/src/components/ProtectedRoute';
import Admin from '@/src/views/Admin';

export default function Page() {
  return (
    <ProtectedRoute adminOnly>
      <Admin />
    </ProtectedRoute>
  );
}
