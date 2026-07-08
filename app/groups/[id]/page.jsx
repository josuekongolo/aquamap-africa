import ProtectedRoute from '@/src/components/ProtectedRoute';
import GroupDetail from '@/src/views/GroupDetail';

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <ProtectedRoute>
      <GroupDetail groupId={id} />
    </ProtectedRoute>
  );
}
