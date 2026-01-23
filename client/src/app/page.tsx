import { Hero } from "@/components/sections/Hero";
import { FeaturedGames } from "@/components/sections/FeaturedGames";

export default function Home() {
  return (
    <main id="main" className="min-h-screen bg-slate-950 text-slate-100">
      <Hero />
      <FeaturedGames />
    </main>
  );
}
