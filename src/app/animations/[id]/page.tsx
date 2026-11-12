import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { estEnCours, formatDuree, formatHeure } from "@/lib/guide";
import { db } from "@/server/db";
import { animationActive, itineraire, listerLieux } from "@/server/guide";
import { CarteTrajet } from "@/components/carte-trajet";
import { BadgeEnCours } from "@/components/carte-animation";

const id = z.coerce.number().int().positive();

export default function Page(props: PageProps<"/animations/[id]">) {
  return (
    <Suspense fallback={<div className="h-64 animate-chargement rounded-3xl bg-sable-fonce" aria-label="Chargement" />}>
      <Detail params={props.params} searchParams={props.searchParams as Promise<{ depart?: string }>} />
    </Suspense>
  );
}

async function Detail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ depart?: string }> }) {
  await connection();
  const animId = id.safeParse((await params).id);
  if (!animId.success) notFound();
  const base = await db();
  const a = await animationActive(base, animId.data);
  if (!a) notFound();
  const lieux = await listerLieux(base);
  const arrivee = lieux.find((l) => l.id === a.lieuId)!;
  const departBrut = (await searchParams).depart;
  let trajet: Awaited<ReturnType<typeof itineraire>> | null = null;
  if (departBrut !== undefined) {
    const d = id.safeParse(departBrut);
    trajet = d.success ? await itineraire(base, a.id, d.data) : { erreur: "Site de départ inconnu." };
  }
  const ok = trajet && !("erreur" in trajet) ? trajet : null;
  const date = new Date(a.debut).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  return (
    <div className="space-y-6">
      <Link href={`/?jour=${a.debut.slice(0, 10)}`} className="appui inline-flex min-h-11 items-center gap-1 rounded-lg font-semibold text-baobab">
        <span aria-hidden="true">←</span> Retour à l’agenda
      </Link>

      <section className="animate-apparition relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-sable-fonce sm:p-7">
        <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-baobab via-soleil to-terre" aria-hidden="true" />
        {estEnCours(a, new Date()) && <div className="mb-2"><BadgeEnCours /></div>}
        <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{a.titre}</h1>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl bg-sable p-3">
            <dt className="text-xl" aria-hidden="true">🕒</dt>
            <dd><span className="sr-only">Horaire : </span>{date.charAt(0).toUpperCase() + date.slice(1)}<br /><strong>{formatHeure(a.debut)} → {formatHeure(a.fin)}</strong></dd>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-sable p-3">
            <dt className="text-xl" aria-hidden="true">📍</dt>
            <dd><span className="sr-only">Lieu : </span><strong>{a.lieu}</strong></dd>
          </div>
        </dl>
        {a.description && <p className="mt-4 text-[17px] leading-relaxed">{a.description}</p>}
      </section>

      <section aria-labelledby="titre-trajet" className="space-y-4">
        <h2 id="titre-trajet" className="text-xl font-bold">Comment y aller ?</h2>
        <form action={`/animations/${a.id}`} className="flex flex-wrap items-end gap-3 rounded-2xl border border-sable-fonce bg-white p-4 shadow-sm">
          <div className="flex min-w-0 flex-1 flex-col">
            <label htmlFor="depart" className="text-sm font-semibold">Je pars de</label>
            <select id="depart" name="depart" defaultValue={departBrut ?? ""} required
              aria-invalid={trajet && "erreur" in trajet ? true : undefined}
              aria-describedby={trajet && "erreur" in trajet ? "erreur-depart" : undefined}
              className="mt-1 h-12 w-full rounded-xl border border-stone-300 bg-sable px-3 text-base">
              <option value="" disabled>Choisir un site connu…</option>
              {lieux.filter((l) => l.id !== a.lieuId).map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
            </select>
          </div>
          <button className="appui h-12 rounded-xl bg-baobab px-5 font-semibold text-white hover:bg-[#0b3f27]">Calculer</button>
          {trajet && "erreur" in trajet && <p id="erreur-depart" role="alert" className="w-full text-sm font-medium text-terre">{trajet.erreur}</p>}
        </form>

        {ok && (
          <div className="cascade grid grid-cols-2 gap-3" aria-live="polite">
            <div className="rounded-2xl bg-baobab-clair p-4 text-center">
              <p className="text-3xl" aria-hidden="true">🚶🏾</p>
              <p className="font-display text-2xl font-extrabold text-baobab">{formatDuree(ok.piedMin)}</p>
              <p className="text-sm font-medium text-gris">à pied</p>
            </div>
            <div className="rounded-2xl bg-[#fdf1d6] p-4 text-center">
              <p className="text-3xl" aria-hidden="true">🚗</p>
              <p className="font-display text-2xl font-extrabold text-[#7a4b00]">{formatDuree(ok.voitureMin)}</p>
              <p className="text-sm font-medium text-gris">en voiture</p>
            </div>
            <p className="col-span-2 text-xs text-gris">
              Environ {ok.km.toString().replace(".", ",")} km depuis {ok.depart.nom}. Estimation (distance × 1,3 ; 5 km/h à pied, 35 km/h en voiture), tracé indicatif.
            </p>
          </div>
        )}
        <CarteTrajet arrivee={{ nom: arrivee.nom, lat: arrivee.lat, lng: arrivee.lng }}
          depart={ok ? { nom: ok.depart.nom, lat: ok.depart.lat, lng: ok.depart.lng } : undefined} />
      </section>
    </div>
  );
}
