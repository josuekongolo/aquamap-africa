// Public routes only — the authenticated console never appears here.
export default function sitemap() {
  const base = 'https://aqafrica.com';
  const routes = ['', '/map', '/knowledge', '/suppliers', '/about', '/privacy', '/terms'];
  return routes.map((r) => ({
    url: `${base}${r}`,
    changeFrequency: r === '' ? 'weekly' : 'monthly',
    priority: r === '' ? 1 : 0.7,
  }));
}
