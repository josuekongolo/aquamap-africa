import { Suspense } from 'react';
import Login from '@/src/views/Login';

export const metadata = { title: 'Connexion — AQAFRIKA', robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
