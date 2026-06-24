// Proxy + cache for CrossRef works search (reliable, keyless). Keeps the upstream
// server-side and caches results for a day. Returns { papers: [...] }.
export const revalidate = 86400;

const MAILTO = 'i.josuekongolo@gmail.com'; // CrossRef "polite pool" contact

export async function GET(request) {
  const q = new URL(request.url).searchParams.get('q') || 'smallholder aquaculture Africa';
  try {
    const url =
      'https://api.crossref.org/works' +
      `?query=${encodeURIComponent(q)}&rows=4&select=title,author,published,DOI,URL` +
      `&mailto=${encodeURIComponent(MAILTO)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return Response.json({ papers: [] });
    const json = await res.json();
    const items = json?.message?.items || [];
    const papers = items
      .filter(it => it.title && it.title.length)
      .map(it => ({
        title: Array.isArray(it.title) ? it.title[0] : it.title,
        year: it.published?.['date-parts']?.[0]?.[0] ?? null,
        authors: (it.author || []).slice(0, 3)
          .map(a => [a.given, a.family].filter(Boolean).join(' '))
          .filter(Boolean),
        url: it.DOI ? `https://doi.org/${it.DOI}` : it.URL,
        openAccess: false,
      }));
    return Response.json({ papers });
  } catch {
    return Response.json({ papers: [] });
  }
}
