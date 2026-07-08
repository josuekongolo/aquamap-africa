import ProtectedRoute from '@/src/components/ProtectedRoute';
import GroupReport from '@/src/views/GroupReport';

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <ProtectedRoute>
      <GroupReport groupId={id} />
    </ProtectedRoute>
  );
}
