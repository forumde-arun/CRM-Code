

import HomeClient from "../app/LandingPage/HomeClient";
import FeatureShowcase from "../app/LandingPage/FeatureShowcase";

export default function LandingUI() {
  return (
    <main className="min-h-screen">
    
        <HomeClient />

        <section className="bg-gradient-to-b from-[#011e09] via-[#2a4e32] to-[#27702e] px-6 pb-20 pt-10 text-center">
          <h2 className="text-4xl font-black leading-tight text-white sm:text-6xl">
            Features We Provide
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-green-50 sm:text-xl">
            Powerful WhatsApp Business tools designed to grow and scale
            your business faster.
          </p>
        </section>

        <FeatureShowcase />
   
    </main>
  );
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );
}
