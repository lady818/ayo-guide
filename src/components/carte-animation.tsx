import Link from "next/link";
import { formatHeure } from "@/lib/guide";
import type { AnimationAvecLieu } from "@/server/guide";

export function CarteAnimation({ a, enCours, children }: { a: AnimationAvecLieu; enCours?: boolean; children?: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-24 shrink-0 font-mono text-sm font-semibold text-emerald-800">
          {formatHeure(a.debut)}
          <br />
          <span className="text-stone-500">→ {formatHeure(a.fin)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            <Link href={`/animations/${a.id}`} className="hover:underline">{a.titre}</Link>
            {enCours && <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">en cours</span>}
          </h3>
          <p className="text-sm text-stone-600">📍 {a.lieu}</p>
          {children}
          <Link href={`/animations/${a.id}`} className="mt-2 inline-block py-2 text-sm font-medium text-emerald-700 hover:underline">
            Comment y aller →
          </Link>
        </div>
      </div>
    </li>
  );
}
