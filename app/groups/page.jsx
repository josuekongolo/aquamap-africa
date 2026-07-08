import ProtectedRoute from '@/src/components/ProtectedRoute';
import Groups from '@/src/views/Groups';

export default function Page() {
  return (
    <ProtectedRoute>
      <Groups />
    </ProtectedRoute>
  );
}
