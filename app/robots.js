// Public marketing/content pages are crawlable; the agent console is not.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/groups', '/admin', '/register', '/operators', '/reset-password'],
      },
    ],
    sitemap: 'https://aqafrica.com/sitemap.xml',
  };
}
