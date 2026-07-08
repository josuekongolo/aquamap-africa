import ProtectedRoute from '@/src/components/ProtectedRoute';
import Settings from '@/src/views/Settings';

export default function Page() {
  return (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  );
}
