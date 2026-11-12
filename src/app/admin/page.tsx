import { Suspense } from "react";
import { connection } from "next/server";
import { aujourdhuiDakar, formatHeure, jourSchema } from "@/lib/guide";
import { db } from "@/server/db";
import { estAdmin } from "@/server/admin";
import { agendaDuJour, listerLieux } from "@/server/guide";
import { deconnexionAction, retirerAction } from "./actions";
import { FormConnexion, FormImport } from "./formulaires";

export default function Page({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p>Chargement…</p>}>
      <Admin params={searchParams as Promise<{ jour?: string }>} />
    </Suspense>
  );
}

async function Admin({ params }: { params: Promise<{ jour?: string }> }) {
  await connection();
  if (!(await estAdmin())) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold">Espace admin</h1>
        <FormConnexion />
      </div>
    );
  }
  const p = await params;
  const jour = jourSchema.safeParse(p.jour).success ? p.jour! : aujourdhuiDakar();
  const base = await db();
  const [liste, lieux] = await Promise.all([agendaDuJour(base, jour), listerLieux(base)]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Espace admin</h1>
        <form action={deconnexionAction}><button className="py-2 text-sm text-gris underline">Se déconnecter</button></form>
      </div>
      <FormImport />
      <details className="rounded-xl bg-white p-4 text-sm shadow-sm">
        <summary className="cursor-pointer font-medium">Sites connus ({lieux.length})</summary>
        <ul className="mt-2 list-disc pl-5">{lieux.map((l) => <li key={l.id}>{l.nom}</li>)}</ul>
      </details>
      <section className="space-y-3">
        <form className="flex items-end gap-3" action="/admin">
          <label className="flex flex-col text-sm font-medium">
            Animations du
            <input type="date" name="jour" defaultValue={jour} className="mt-1 h-12 rounded-xl border border-stone-300 bg-sable px-3 text-base" />
          </label>
          <button className="appui h-12 rounded-xl bg-sable-fonce px-5 font-semibold">Voir</button>
        </form>
        <ul className="divide-y divide-sable-fonce overflow-hidden rounded-2xl border border-sable-fonce bg-white shadow-sm">
          {liste.map((a) => (
            <li key={a.id} className="flex items-center gap-3 p-3">
              <span className="w-28 font-mono text-sm">{formatHeure(a.debut)}–{formatHeure(a.fin)}</span>
              <span className="min-w-0 flex-1 text-sm"><strong>{a.titre}</strong><br /><span className="text-gris">{a.lieu}</span></span>
              <form action={retirerAction}>
                <input type="hidden" name="id" value={a.id} />
                <button aria-label={`Retirer « ${a.titre} »`} className="appui h-11 rounded-xl border border-terre/40 px-4 text-sm font-semibold text-terre hover:bg-[#fdebe3]">Retirer</button>
              </form>
            </li>
          ))}
          {liste.length === 0 && <li className="p-3 text-sm text-gris">Aucune animation ce jour-là.</li>}
        </ul>
      </section>
    </div>
  );
}
