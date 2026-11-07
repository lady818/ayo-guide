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
        <h1 className="text-2xl font-bold">Espace admin</h1>
        <FormConnexion />
      </div>
    );
  }
  const p = await params;
  const jour = jourSchema.safeParse(p.jour).success ? p.jour! : aujourdhuiDakar();
  const liste = agendaDuJour(db(), jour);
  const lieux = listerLieux(db());
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Espace admin</h1>
        <form action={deconnexionAction}><button className="py-2 text-sm text-stone-600 underline">Se déconnecter</button></form>
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
            <input type="date" name="jour" defaultValue={jour} className="mt-1 h-11 rounded-lg border border-stone-300 px-3" />
          </label>
          <button className="h-11 rounded-lg bg-stone-200 px-4 font-medium">Voir</button>
        </form>
        <ul className="divide-y rounded-xl bg-white shadow-sm">
          {liste.map((a) => (
            <li key={a.id} className="flex items-center gap-3 p-3">
              <span className="w-28 font-mono text-sm">{formatHeure(a.debut)}–{formatHeure(a.fin)}</span>
              <span className="min-w-0 flex-1 text-sm"><strong>{a.titre}</strong><br /><span className="text-stone-500">{a.lieu}</span></span>
              <form action={retirerAction}>
                <input type="hidden" name="id" value={a.id} />
                <button className="h-11 rounded-lg border border-red-300 px-3 text-sm font-medium text-red-700 hover:bg-red-50">Retirer</button>
              </form>
            </li>
          ))}
          {liste.length === 0 && <li className="p-3 text-sm text-stone-500">Aucune animation ce jour-là.</li>}
        </ul>
      </section>
    </div>
  );
}
