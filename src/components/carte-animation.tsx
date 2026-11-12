import { ViewTransition } from "react";
import Link from "next/link";
import { formatDuree, formatHeure } from "@/lib/guide";
import type { AnimationAvecLieu } from "@/server/guide";

export function BadgeEnCours() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-terre px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
      <span className="h-2 w-2 animate-pulsation rounded-full bg-white" aria-hidden="true" />
      En cours
    </span>
  );
}

/** Barre « déjà écoulé » d'une animation en cours, avec le temps restant. */
function Progression({ a, instant }: { a: AnimationAvecLieu; instant: Date }) {
  const debut = Date.parse(a.debut);
  const fin = Date.parse(a.fin);
  const pct = Math.min(100, Math.max(0, ((instant.getTime() - debut) / (fin - debut)) * 100));
  const resteMin = Math.max(1, Math.round((fin - instant.getTime()) / 60000));
  return (
    <div className="mt-2.5">
      <div
        role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
        aria-label="Avancement de l’animation"
        className="progression h-2 overflow-hidden rounded-full bg-terre/15"
      >
        <span className="block h-full rounded-full bg-gradient-to-r from-soleil to-terre" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs font-semibold text-terre">Encore {formatDuree(resteMin)}</p>
    </div>
  );
}

export function CarteAnimation({
  a, enCours, instant, children,
}: { a: AnimationAvecLieu; enCours?: boolean; instant?: Date; children?: React.ReactNode }) {
  return (
    <li>
      <article
        className={`revele carte-vivante group relative flex gap-4 overflow-hidden rounded-3xl border bg-white/95 p-4 shadow-sm backdrop-blur sm:p-5 ${
          enCours ? "border-terre/35 ring-1 ring-terre/15" : "border-sable-fonce"
        }`}
      >
        <span
          className={`absolute inset-y-0 left-0 w-1.5 transition-all duration-300 group-hover:w-2.5 ${enCours ? "bg-gradient-to-b from-soleil to-terre" : "bg-baobab"}`}
          aria-hidden="true"
        />
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
            <ViewTransition name={`titre-${a.id}`} share="morph" default="none">
              <Link
                href={`/animations/${a.id}`}
                className="inline-block after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-focus-within:underline"
              >
                {a.titre}
              </Link>
            </ViewTransition>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-gris">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 text-terre transition-transform group-hover:-translate-y-0.5" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
            <span className="sr-only">Lieu : </span>{a.lieu}
          </p>
          {enCours && instant && <Progression a={a} instant={instant} />}
          {children && <div className="relative z-10">{children}</div>}
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-baobab">
            Comment y aller
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
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
        <li key={i} className="flex h-28 gap-4 rounded-3xl border border-sable-fonce bg-white/80 p-4">
          <span className="h-10 w-16 animate-chargement rounded-xl bg-sable-fonce" />
          <span className="flex-1 space-y-2">
            <span className="block h-5 w-3/4 animate-chargement rounded-lg bg-sable-fonce" />
            <span className="block h-4 w-1/2 animate-chargement rounded-lg bg-sable-fonce" />
          </span>
        </li>
      ))}
    </ul>
  );
}
