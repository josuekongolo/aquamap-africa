import Home from '@/src/views/Home';
import { getDirectoryCounts } from '@/src/lib/counts';

// Re-read the live directory counts at most hourly.
export const revalidate = 3600;

export default async function Page() {
  const counts = await getDirectoryCounts();
  return <Home counts={counts} />;
}
