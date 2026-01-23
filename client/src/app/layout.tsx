import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Educatech - Portal de Jogos Educativos",
  description: "Aprenda brincando com os melhores jogos educativos.",
  openGraph: {
    title: "Educatech - Portal de Jogos Educativos",
    description: "Aprenda brincando com os melhores jogos educativos.",
    type: "website",
    url: "https://educatech.com.br", // URL fictícia para passar na validação
    images: [{ url: "/og-image.jpg" }],
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
      </body>
    </html>
  );
}
