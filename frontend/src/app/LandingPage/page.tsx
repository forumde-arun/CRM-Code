import { Suspense } from "react";
import HomeClient from "./HomeClient";
import FeatureShowcase from "./FeatureShowcase";
import Contact from "./contanct";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeClient />
      <div className="bg-gradient-to-b from-[#011e09] via-[#2a4e32] via-[#22662a] to-[#27702e] pt-10 pb-20 text-center">
  <h2 className="text-6xl font-black text-white leading-tight">
    Features we Provide
   
  </h2>

  <p className="mt-6 text-xl text-green-50 max-w-3xl mx-auto">
    Powerful WhatsApp Business tools designed to grow and scale your business faster.
  </p>
</div>
      <FeatureShowcase/>
      <Contact/>
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-600">
        Loading…
      </p>
    </div>
  );
}
