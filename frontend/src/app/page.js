
import LandingUI from "../views/LandingUI";
import { SITE } from "../lib/site";
import AppHeader from "./LandingPage/Header";
import Footer from "./LandingPage/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      publisher: {
        "@id": `${SITE.url}/#organization`,
      },
      inLanguage: SITE.language,
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE.url}/#software`,
      name: SITE.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SITE.description,
      url: SITE.url,
      image: `${SITE.url}/og-image.png`,
      publisher: {
        "@id": `${SITE.url}/#organization`,
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        description: "Visit the website for available plans.",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
<header className="fixed inset-x-0 top-0 z-50 w-full">
  <AppHeader />
</header>

      <main className="min-h-screen">
        <LandingUI />
      </main>

      <Footer />
    </>
  );
}
