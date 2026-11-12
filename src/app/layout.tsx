import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { Logo } from "@/components/logo";
import { LiensHaut, NavBas, NavHaut, OngletsBas } from "@/components/navigation";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Ayo Guide — JOJ Dakar 2026", template: "%s · Ayo Guide" },
  description: "Que faire maintenant aux Jeux Olympiques de la Jeunesse de Dakar, où, et comment y aller.",
  applicationName: "Ayo Guide",
};

export const viewport: Viewport = {
  themeColor: "#0f5132",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#contenu" className="sr-only z-50 rounded-lg bg-soleil px-4 py-3 font-semibold text-encre focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
          Aller au contenu
        </a>
        <header className="sticky top-0 z-30 bg-baobab text-white shadow-md shadow-baobab/20">
          <nav aria-label="Navigation" className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
            <Link href="/" aria-label="Ayo Guide, accueil" className="appui flex min-h-11 items-center rounded-lg">
              <Logo />
            </Link>
            <Suspense fallback={<LiensHaut pathname="" />}>
              <NavHaut />
            </Suspense>
          </nav>
        </header>
        <main id="contenu" className="mx-auto w-full max-w-4xl flex-1 px-4 pb-28 pt-5 sm:pb-12 sm:pt-8">
          {children}
        </main>
        <footer className="hidden border-t border-sable-fonce py-6 text-center text-sm text-gris sm:block">
          Ayo Guide · Jeux Olympiques de la Jeunesse, Dakar 2026 · Données de démonstration
        </footer>
        <Suspense fallback={<OngletsBas pathname="" />}>
          <NavBas />
        </Suspense>
      </body>
    </html>
  );
}
