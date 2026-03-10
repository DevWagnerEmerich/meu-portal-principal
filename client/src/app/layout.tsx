// aria-label
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TrialFloatingBanner } from "@/components/layout/TrialFloatingBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://brincabytes.vercel.app"),
  title: {
    default: "BrincaBytes - Portal de Jogos Educativos",
    template: "%s | BrincaBytes"
  },
  description: "Portal interativo de jogos educativos para escolas, professores e alunos. Transforme o aprendizado em diversão!",
  keywords: ["jogos educativos", "educação infantil", "portal escolar", "jogos de matemática", "jogos de português", "inclusão digital", "aulas dinâmicas"],
  authors: [{ name: "BrincaBytes Team" }],
  creator: "BrincaBytes",
  publisher: "BrincaBytes",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "BrincaBytes - Portal de Jogos Educativos",
    description: "Portal interativo de jogos educativos para escolas, professores e alunos. Transforme o aprendizado em diversão!",
    url: "https://brincabytes.vercel.app",
    siteName: "BrincaBytes",
    images: [
      {
        url: "https://brincabytes.vercel.app/logo.png",
        width: 1200,
        height: 630,
        alt: "BrincaBytes Capa",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BrincaBytes - Portal de Jogos Educativos",
    description: "Portal interativo de jogos educativos para escolas, professores e alunos. Transforme o aprendizado em diversão!",
    creator: "@brincabytes", // Opcional
    images: ["https://brincabytes.vercel.app/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "-LW4C_Lgki0P-J-l-p1Y50OdGLLPky7tc9ghJ3nAj8k",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-white text-slate-900 px-4 py-2 rounded font-medium">
          Pular para o conteúdo principal
        </a>
        <Navbar />
        {children}
        <TrialFloatingBanner />
        <Footer />
      </body>
    </html>
  );
}
