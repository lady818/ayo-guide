"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/", label: "Agenda", icone: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" },
  { href: "/demander", label: "Demander", icone: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5" },
  { href: "/admin", label: "Admin", icone: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" },
];

function actif(pathname: string, href: string) {
  return href === "/" ? pathname === "/" || pathname.startsWith("/animations") : pathname.startsWith(href);
}

function Icone({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/** Liens de l'en-tête (ordinateur et tablette). */
export function NavHaut() {
  return <LiensHaut pathname={usePathname()} />;
}

export function LiensHaut({ pathname }: { pathname: string }) {
  return (
    <ul className="hidden items-center gap-1 sm:flex">
      {LIENS.map((l) => {
        const estActif = actif(pathname, l.href);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={estActif ? "page" : undefined}
              className={`appui flex min-h-11 items-center rounded-full px-4 font-medium ${
                estActif ? "bg-white text-baobab" : "text-white hover:bg-white/15"
              }`}
            >
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Barre d'onglets en bas de l'écran (téléphone). */
export function NavBas() {
  return <OngletsBas pathname={usePathname()} />;
}

export function OngletsBas({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Navigation principale" style={{ viewTransitionName: "onglets" }} className="fixed inset-x-0 bottom-0 z-20 border-t border-sable-fonce bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <ul className="grid grid-cols-3">
        {LIENS.map((l) => {
          const estActif = actif(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={estActif ? "page" : undefined}
                className={`appui flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                  estActif ? "text-baobab" : "text-gris"
                }`}
              >
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300 ${estActif ? "scale-110 bg-baobab-clair" : ""}`}>
                  <Icone d={l.icone} />
                </span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
