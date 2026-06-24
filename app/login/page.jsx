import { Suspense } from 'react';
import Login from '@/src/views/Login';

export const metadata = { title: 'Connexion — AquaMap Africa', robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
