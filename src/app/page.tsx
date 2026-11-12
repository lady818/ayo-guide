import { Suspense, ViewTransition } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { aujourdhuiDakar, estEnCours, heureSchema, JOJ_DEBUT, jourSchema } from "@/lib/guide";
import { db } from "@/server/db";
import { agendaDuJour } from "@/server/guide";
import { CarteAnimation, SqueletteListe } from "@/components/carte-animation";
import { Soleil } from "@/components/logo";
import { Ayo, AvatarAyo } from "@/components/ayo";
import { CentrerJour } from "@/components/centrer-jour";

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

type Params = { jour?: string; a?: string; maintenant?: string };

const JOURS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(JOJ_DEBUT);
  d.setUTCDate(d.getUTCDate() + i);
  return d.toISOString().slice(0, 10);
});

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-baobab px-5 pb-9 pt-6 text-white shadow-xl shadow-baobab/25 sm:px-9 sm:pb-12 sm:pt-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <span className="aurore aurore-1 -left-16 -top-20 h-64 w-64 bg-[#1f8a5b]" />
          <span className="aurore aurore-2 -right-10 top-10 h-72 w-72 bg-ocean" />
          <span className="aurore aurore-3 bottom-[-6rem] left-1/3 h-60 w-60 bg-soleil/60" />
          <Soleil className="absolute -bottom-14 -left-12 h-44 w-44 text-soleil/10" tourne />
        </div>
        <div className="relative flex flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <p className="animate-apparition text-xs font-bold uppercase tracking-[0.18em] text-soleil sm:text-sm">
              Jeux Olympiques de la Jeunesse · Dakar 2026
            </p>
            <h1 className="mt-2 animate-apparition text-[2rem] font-extrabold leading-[1.08] [animation-delay:80ms] sm:text-5xl">
              Que faire <span className="texte-soleil">maintenant</span> à Dakar&nbsp;?
            </h1>
            <p className="mt-3 animate-apparition text-[17px] leading-relaxed text-white/90 [animation-delay:160ms]">
              Le programme du jour, trié par heure, avec les lieux et le temps pour y aller.
            </p>
            <div className="mt-6 flex animate-apparition flex-wrap gap-3 [animation-delay:240ms]">
              <Link href="/?maintenant=1" className="appui brillant inline-flex min-h-12 items-center gap-2 whitespace-nowrap rounded-full bg-soleil px-5 font-bold text-encre shadow-lg shadow-black/20 hover:bg-[#ffc21a]">
                <span className="h-2.5 w-2.5 animate-pulsation rounded-full bg-terre" aria-hidden="true" />
                En cours maintenant
              </Link>
              <Link href="/demander" className="appui inline-flex min-h-12 items-center gap-2 whitespace-nowrap rounded-full border-2 border-white/60 bg-white/5 px-5 font-semibold text-white backdrop-blur hover:bg-white/15">
                <AvatarAyo className="h-7 w-7 ring-1" />
                Demander à Ayo
              </Link>
            </div>
          </div>
          <div className="relative flex items-end gap-3 self-start sm:self-auto">
            <span aria-hidden="true" className="absolute inset-x-4 -bottom-3 h-5 rounded-[50%] bg-black/25 blur-md" />
            <div className="ayo-entree">
              <Ayo priorite className="ayo-salut h-32 w-36 shrink-0 sm:h-60 sm:w-72" />
            </div>
            <p className="bulle-pop relative mb-8 rounded-2xl rounded-bl-none bg-white px-3.5 py-2 text-sm font-bold text-baobab shadow-lg [animation-delay:900ms] sm:absolute sm:-left-24 sm:top-2 sm:mb-0 sm:rounded-bl-2xl sm:rounded-br-none">
              Salut, moi c’est Ayo&nbsp;! 👋
            </p>
          </div>
        </div>
        <div aria-hidden="true" className="kente absolute inset-x-0 bottom-0 h-2.5" />
      </section>
      <Suspense
        fallback={
          <ViewTransition exit="descend" default="none">
            <SqueletteListe />
          </ViewTransition>
        }
      >
        <ViewTransition enter="monte" default="none">
          <Agenda params={searchParams as Promise<Params>} />
        </ViewTransition>
      </Suspense>
    </div>
  );
}

async function Agenda({ params }: { params: Promise<Params> }) {
  await connection();
  const p = await params;
  const now = new Date();
  const aujourdhui = aujourdhuiDakar();
  const maintenant = p.maintenant === "1";
  const jour = maintenant ? aujourdhui : jourSchema.safeParse(p.jour).success ? p.jour! : aujourdhui;
  const heure = maintenant ? now.toISOString().slice(11, 16) : heureSchema.safeParse(p.a).success ? p.a! : undefined;
  const instant = heure ? new Date(`${jour}T${heure}:00.000Z`) : undefined;
  const liste = await agendaDuJour(await db(), jour, instant);
  const libelle = (j: string, o: Intl.DateTimeFormatOptions) => new Date(`${j}T12:00:00Z`).toLocaleDateString("fr-FR", { ...o, timeZone: "UTC" });

  return (
    <div className="space-y-6">
      <nav aria-label="Choisir le jour">
        <ul className="sans-barre -mx-4 flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 py-1">
          {JOURS.map((j) => {
            const choisi = j === jour;
            return (
              <li key={j} className="snap-start" data-jour={j}>
                <Link
                  href={`/?jour=${j}`}
                  aria-current={choisi ? "date" : undefined}
                  aria-label={`${libelle(j, { weekday: "long", day: "numeric", month: "long" })}${j === aujourdhui ? ", aujourd’hui" : ""}`}
                  className={`appui flex min-h-16 w-14 flex-col items-center justify-center rounded-2xl border text-center ${
                    choisi ? "pop border-baobab bg-baobab text-white shadow-lg shadow-baobab/30" : "border-sable-fonce bg-white hover:-translate-y-0.5 hover:border-baobab/40 hover:shadow-md"
                  }`}
                >
                  <span className={`text-[11px] font-semibold uppercase ${choisi ? "text-white/85" : "text-gris"}`}>{libelle(j, { weekday: "short" }).replace(".", "")}</span>
                  <span className="font-display text-xl font-bold leading-none">{libelle(j, { day: "numeric" })}</span>
                  {j === aujourdhui && <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${choisi ? "bg-soleil" : "bg-terre"}`} aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
        <CentrerJour jour={jour} />
      </nav>

      <form action="/" className="flex flex-wrap items-end gap-3 rounded-2xl border border-sable-fonce bg-white p-4 shadow-sm">
        <input type="hidden" name="jour" value={jour} />
        <div className="flex flex-col">
          <label htmlFor="heure" className="text-sm font-semibold">Ce qui est en cours à</label>
          <input id="heure" type="time" name="a" defaultValue={heure ?? ""} required
            className="mt-1 h-12 rounded-xl border border-stone-300 bg-sable px-3 text-base focus:border-baobab" />
        </div>
        <button className="appui h-12 rounded-xl bg-baobab px-5 font-semibold text-white hover:bg-[#0b3f27]">Filtrer</button>
        {heure && (
          <Link href={`/?jour=${jour}`} className="appui flex h-12 items-center rounded-xl px-3 font-semibold text-baobab underline-offset-4 hover:underline">
            Toute la journée
          </Link>
        )}
      </form>

      <section aria-labelledby="titre-liste" className="space-y-3">
        <h2 id="titre-liste" className="flex flex-wrap items-baseline gap-x-2 text-xl font-bold">
          {majuscule(libelle(jour, { weekday: "long", day: "numeric", month: "long" }))}
          {heure && <span className="text-terre">· en cours à {heure.replace(":", " h ")}</span>}
          <span className="font-sans text-sm font-medium text-gris">
            {liste.length} animation{liste.length > 1 ? "s" : ""}
          </span>
        </h2>
        {liste.length === 0 ? (
          <div className="animate-apparition rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <AvatarAyo className="reflechit mx-auto h-16 w-16" />
            <p className="mt-2 font-semibold">{heure ? "Aucune animation en cours à cette heure." : "Aucune animation ce jour-là."}</p>
            {heure && <Link href={`/?jour=${jour}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-baobab underline">Voir toute la journée</Link>}
          </div>
        ) : (
          <ul className="cascade space-y-3">
            {liste.map((a) => (
              <CarteAnimation key={a.id} a={a} enCours={heure ? true : jour === aujourdhui && estEnCours(a, now)} instant={instant ?? (jour === aujourdhui ? now : undefined)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
