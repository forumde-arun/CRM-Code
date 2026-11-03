import { SITE } from '@/lib/site';

export default function manifest() {
  return { name: SITE.name, short_name: SITE.name, description: SITE.description, start_url: '/', display: 'standalone', background_color: '#f8fafc', theme_color: '#0f8a52' };
}
