import ProtectedRoute from '@/src/components/ProtectedRoute';
import Register from '@/src/views/Register';

export default function Page() {
  return (
    <ProtectedRoute>
      <Register />
    </ProtectedRoute>
  );
}
