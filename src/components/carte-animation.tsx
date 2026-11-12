import Link from "next/link";
import { formatHeure } from "@/lib/guide";
import type { AnimationAvecLieu } from "@/server/guide";

export function BadgeEnCours() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-terre px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
      <span className="h-2 w-2 animate-pulsation rounded-full bg-white" aria-hidden="true" />
      En cours
    </span>
  );
}

export function CarteAnimation({ a, enCours, children }: { a: AnimationAvecLieu; enCours?: boolean; children?: React.ReactNode }) {
  return (
    <li>
      <article
        className={`group relative flex gap-4 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
          enCours ? "border-terre/40 ring-1 ring-terre/20" : "border-sable-fonce"
        }`}
      >
        <span className={`absolute inset-y-0 left-0 w-1.5 ${enCours ? "bg-terre" : "bg-baobab"}`} aria-hidden="true" />
        <div className="w-[4.5rem] shrink-0 pl-1 text-center sm:w-20">
          <p className="whitespace-nowrap font-display text-base font-bold leading-tight text-baobab sm:text-xl">{formatHeure(a.debut)}</p>
          <p className="whitespace-nowrap text-xs text-gris">
            <span className="sr-only">jusqu’à </span>
            <span aria-hidden="true">→ </span>
            {formatHeure(a.fin)}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          {enCours && <div className="mb-1.5"><BadgeEnCours /></div>}
          <h3 className="text-lg font-bold leading-snug">
            <Link href={`/animations/${a.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {a.titre}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-gris">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 text-terre" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
            <span className="sr-only">Lieu : </span>{a.lieu}
          </p>
          {children && <div className="relative z-10">{children}</div>}
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-baobab">
            Comment y aller
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </p>
        </div>
      </article>
    </li>
  );
}

export function SqueletteListe({ n = 4 }: { n?: number }) {
  return (
    <ul className="space-y-3" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="h-28 animate-chargement rounded-2xl bg-sable-fonce" />
      ))}
    </ul>
  );
}
