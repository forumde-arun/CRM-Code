import './globals.css';
import { SITE } from '@/lib/site';

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: '%s | CRM' },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ['WhatsApp CRM', 'WhatsApp Business API', 'WhatsApp bulk messaging', 'WhatsApp campaigns', 'message templates', 'customer messaging'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', siteName: SITE.name, title: SITE.title, description: SITE.description, url: '/' },
  twitter: { card: 'summary', title: SITE.title, description: SITE.description },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f8a52' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
