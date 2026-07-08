import ProtectedRoute from '@/src/components/ProtectedRoute';
import OperatorEdit from '@/src/views/OperatorEdit';

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <ProtectedRoute>
      <OperatorEdit operatorId={id} />
    </ProtectedRoute>
  );
}
