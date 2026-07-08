import ProtectedRoute from '@/src/components/ProtectedRoute';
import OperatorDetail from '@/src/views/OperatorDetail';

export default async function Page({ params }) {
  const { operatorId } = await params;
  return (
    <ProtectedRoute>
      <OperatorDetail operatorId={operatorId} />
    </ProtectedRoute>
  );
}
