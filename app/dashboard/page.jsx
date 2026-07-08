import ProtectedRoute from '@/src/components/ProtectedRoute';
import Portfolio from '@/src/views/Portfolio';

export default function Page() {
  return (
    <ProtectedRoute>
      <Portfolio />
    </ProtectedRoute>
  );
}
