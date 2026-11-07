import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { formatDuree, formatHeure } from "@/lib/guide";
import { db } from "@/server/db";
import { animationActive, itineraire, listerLieux } from "@/server/guide";
import { CarteTrajet } from "@/components/carte-trajet";

const id = z.coerce.number().int().positive();

export default function Page(props: PageProps<"/animations/[id]">) {
  return (
    <Suspense fallback={<p>Chargement…</p>}>
      <Detail params={props.params} searchParams={props.searchParams as Promise<{ depart?: string }>} />
    </Suspense>
  );
}

async function Detail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ depart?: string }> }) {
  await connection();
  const animId = id.safeParse((await params).id);
  if (!animId.success) notFound();
  const base = db();
  const a = animationActive(base, animId.data);
  if (!a) notFound();
  const lieux = listerLieux(base);
  const arrivee = lieux.find((l) => l.id === a.lieuId)!;
  const departBrut = (await searchParams).depart;
  let trajet: ReturnType<typeof itineraire> | null = null;
  if (departBrut !== undefined) {
    const d = id.safeParse(departBrut);
    trajet = d.success ? itineraire(base, a.id, d.data) : { erreur: "Site de départ inconnu." };
  }
  const ok = trajet && !("erreur" in trajet) ? trajet : null;

  return (
    <div className="space-y-5">
      <Link href={`/?jour=${a.debut.slice(0, 10)}`} className="inline-block py-2 text-sm text-emerald-700 hover:underline">← Agenda</Link>
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold">{a.titre}</h1>
        <p className="mt-1 font-medium text-emerald-800">
          {new Date(a.debut).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
          {" · "}{formatHeure(a.debut)} → {formatHeure(a.fin)}
        </p>
        <p className="text-stone-600">📍 {a.lieu}</p>
        {a.description && <p className="mt-2">{a.description}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Comment y aller ?</h2>
        <form className="flex flex-wrap items-end gap-3" action={`/animations/${a.id}`}>
          <label className="flex flex-col text-sm font-medium">
            Je pars de
            <select name="depart" defaultValue={departBrut ?? ""} required className="mt-1 h-11 rounded-lg border border-stone-300 bg-white px-3">
              <option value="" disabled>Choisir un site…</option>
              {lieux.filter((l) => l.id !== a.lieuId).map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
            </select>
          </label>
          <button className="h-11 rounded-lg bg-emerald-700 px-4 font-medium text-white">Calculer</button>
        </form>
        {trajet && "erreur" in trajet && <p role="alert" className="text-red-700">{trajet.erreur}</p>}
        {ok && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-4 text-center shadow-sm">
              <div className="text-3xl">🚶</div>
              <div className="text-xl font-bold">{formatDuree(ok.piedMin)}</div>
              <div className="text-sm text-stone-500">à pied</div>
            </div>
            <div className="rounded-xl bg-white p-4 text-center shadow-sm">
              <div className="text-3xl">🚗</div>
              <div className="text-xl font-bold">{formatDuree(ok.voitureMin)}</div>
              <div className="text-sm text-stone-500">en voiture</div>
            </div>
            <p className="col-span-2 text-xs text-stone-500">
              Environ {ok.km} km. Estimation (distance × 1,3 ; 5 km/h à pied, 35 km/h en voiture). Tracé indicatif.
            </p>
          </div>
        )}
        <CarteTrajet arrivee={{ nom: arrivee.nom, lat: arrivee.lat, lng: arrivee.lng }}
          depart={ok ? { nom: ok.depart.nom, lat: ok.depart.lat, lng: ok.depart.lng } : undefined} />
      </section>
    </div>
  );
}
