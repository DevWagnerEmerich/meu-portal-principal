// aria-label
import { Hero } from "@/components/sections/Hero";
import { FeaturedGames } from "@/components/sections/FeaturedGames";
import { ShieldCheck, Users, Gamepad2, Award } from "lucide-react";

export const metadata = {
  title: "BrincaBytes - Jogos Educativos que Desafiam e Ensinam",
  description: "A BrincaBytes é um portal interativo de jogos educativos. Transforme a sala de aula ou o estudo em casa em uma aventura engajadora para alunos de todas as idades.",
  alternates: {
    canonical: 'https://brincabytes.com.br',
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://brincabytes.com.br/#website",
      "url": "https://brincabytes.com.br",
      "name": "BrincaBytes",
      "description": "Portal interativo de jogos educativos para escolas, professores e alunos.",
      "inLanguage": "pt-BR"
    },
    {
      "@type": "Organization",
      "@id": "https://brincabytes.com.br/#organization",
      "name": "BrincaBytes",
      "url": "https://brincabytes.com.br",
      "logo": {
        "@type": "ImageObject",
        "url": "https://brincabytes.com.br/logo.png"
      },
      "sameAs": [
        "https://instagram.com/brincabytes",
        "https://youtube.com/c/brincabytes"
      ]
    }
  ]
};

function TrustStats() {
  const stats = [
    { id: 1, name: 'Jogos em constante expansão', value: 'Catálogo', icon: Gamepad2 },
    { id: 2, name: 'No aprendizado', value: 'Foco Total', icon: Users },
    { id: 3, name: 'Livre de anúncios', value: '100% Seguro', icon: ShieldCheck },
    { id: 4, name: 'Por professores', value: 'Validado', icon: Award },
  ];

  return (
    <div className="bg-slate-900 border-y border-slate-800 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.id} className="mx-auto flex max-w-xs flex-col gap-y-4 items-center">
              <div className="p-3 bg-teal-500/10 rounded-2xl ring-1 ring-teal-500/20">
                <stat.icon className="w-8 h-8 text-teal-400" />
              </div>
              <dt className="text-base leading-7 text-slate-400">{stat.name}</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main id="main" className="min-h-screen bg-slate-950 text-slate-100">
      {/* Script de Schema.org para o Google entender que o site é uma Organização Oficial (E-E-A-T) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero />
      <TrustStats />
      <FeaturedGames />
    </main>
  );
}
