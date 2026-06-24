import ProtectedRoute from '@/src/components/ProtectedRoute';
import Dashboard from '@/src/views/Dashboard';

export default function Page() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
