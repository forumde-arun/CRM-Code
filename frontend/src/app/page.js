import LoginView from '@/views/LoginView';
import { SITE } from '@/lib/site';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: SITE.description,
  url: SITE.url,
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LoginView />
    </>
  );
}
