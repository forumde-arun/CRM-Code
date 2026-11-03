import { SITE } from '@/lib/site';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: ['/'], disallow: ['/connection', '/templates', '/contacts', '/campaigns', '/api/'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
