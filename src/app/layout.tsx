import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guide JOJ Dakar 2026",
  description: "Que faire maintenant aux Jeux Olympiques de la Jeunesse de Dakar, où, et comment y aller.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <header className="bg-emerald-800 text-white">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
            <Link href="/" className="mr-auto text-lg font-bold">
              Guide JOJ Dakar <span className="text-amber-300">2026</span>
            </Link>
            <Link href="/" className="py-2 hover:underline">Agenda</Link>
            <Link href="/demander" className="py-2 hover:underline">Demander</Link>
            <Link href="/admin" className="py-2 text-emerald-200 hover:underline">Admin</Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
