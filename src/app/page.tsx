import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { aujourdhuiDakar, estEnCours, heureSchema, jourSchema } from "@/lib/guide";
import { db } from "@/server/db";
import { agendaDuJour } from "@/server/guide";
import { CarteAnimation } from "@/components/carte-animation";

type Params = { jour?: string; a?: string; maintenant?: string };

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<p>Chargement de l’agenda…</p>}>
      <Agenda params={searchParams as Promise<Params>} />
    </Suspense>
  );
}

async function Agenda({ params }: { params: Promise<Params> }) {
  await connection();
  const p = await params;
  const now = new Date();
  const maintenant = p.maintenant === "1";
  const jour = maintenant ? aujourdhuiDakar() : jourSchema.safeParse(p.jour).success ? p.jour! : aujourdhuiDakar();
  const heure = maintenant ? now.toISOString().slice(11, 16) : heureSchema.safeParse(p.a).success ? p.a! : undefined;
  const instant = heure ? new Date(`${jour}T${heure}:00.000Z`) : undefined;
  const liste = agendaDuJour(db(), jour, instant);
  const dateLisible = new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold">Que faire aujourd’hui ?</h1>
        <p className="text-stone-600">Le programme officiel des Jeux, trié par heure, avec les lieux.</p>
      </section>

      <form className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm" action="/">
        <label className="flex flex-col text-sm font-medium">
          Jour
          <input type="date" name="jour" defaultValue={jour} min="2026-10-31" max="2026-11-13"
            className="mt-1 h-11 rounded-lg border border-stone-300 px-3" />
        </label>
        <label className="flex flex-col text-sm font-medium">
          En cours à (facultatif)
          <input type="time" name="a" defaultValue={heure ?? ""} className="mt-1 h-11 rounded-lg border border-stone-300 px-3" />
        </label>
        <button className="h-11 rounded-lg bg-emerald-700 px-4 font-medium text-white">Afficher</button>
        <Link href="/?maintenant=1" className="flex h-11 items-center rounded-lg bg-amber-400 px-4 font-medium text-stone-900">
          En cours maintenant
        </Link>
      </form>

      <h2 className="text-lg font-semibold first-letter:uppercase">
        {dateLisible}
        {heure && <> — en cours à {heure.replace(":", " h ")}</>}
        <span className="ml-2 text-sm font-normal text-stone-500">({liste.length} animation{liste.length > 1 ? "s" : ""})</span>
      </h2>
      {liste.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-stone-600">
          {heure ? "Aucune animation en cours à cette heure." : "Aucune animation ce jour-là."}
        </p>
      ) : (
        <ul className="space-y-3">
          {liste.map((a) => (
            <CarteAnimation key={a.id} a={a} enCours={!heure && estEnCours(a, now)} />
          ))}
        </ul>
      )}
    </div>
  );
}
