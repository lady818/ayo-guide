"use client";
import { useActionState, useRef, useState } from "react";
import { CarteAnimation, SqueletteListe } from "@/components/carte-animation";
import { AvatarAyo } from "@/components/ayo";
import { questionAction, type EtatQuestion } from "./actions";

const EXEMPLES = [
  "J’ai 3 heures avec mes enfants, que faire ?",
  "Je suis à Diamniadio et j’aime le sport",
  "Un concert ou de la musique ce soir ?",
  "Quelque chose au bord de la mer",
];

export function FormQuestion() {
  const [etat, action, enCours] = useActionState<EtatQuestion, FormData>(questionAction, {});
  const [texte, setTexte] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const plus = etat.restantes === 0;

  return (
    <div className="space-y-5">
      <form ref={formRef} action={action} className="space-y-3 rounded-3xl border border-sable-fonce bg-white p-4 shadow-sm sm:p-5">
        <label htmlFor="question" className="block font-semibold">Votre question</label>
        <textarea
          id="question" name="question" rows={3} maxLength={300} value={texte}
          onChange={(e) => setTexte(e.target.value)}
          aria-invalid={etat.erreur && !etat.question ? true : undefined}
          aria-describedby="aide-question"
          placeholder="Ex. : que puis-je faire cet après-midi ?"
          className="w-full resize-none rounded-2xl border border-stone-300 bg-sable p-3 text-base leading-relaxed focus:border-baobab"
        />
        <p id="aide-question" className="flex justify-between text-xs text-gris">
          <span>
            {etat.restantes !== undefined
              ? `Il vous reste ${etat.restantes} question${etat.restantes > 1 ? "s" : ""} aujourd’hui.`
              : "5 questions par jour et par personne."}
          </span>
          <span aria-hidden="true">{texte.length}/300</span>
        </p>
        {etat.erreur && <p role="alert" className="rounded-xl bg-[#fdebe3] px-3 py-2 text-sm font-medium text-terre">{etat.erreur}</p>}
        <button disabled={enCours || plus} className="appui inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-baobab px-5 font-semibold text-white hover:bg-[#0b3f27] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
          {enCours ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              Ayo réfléchit…
            </>
          ) : "Demander"}
        </button>
      </form>

      <div>
        <p className="mb-2 text-sm font-semibold text-gris">Idées de questions</p>
        <ul className="flex flex-wrap gap-2">
          {EXEMPLES.map((ex) => (
            <li key={ex}>
              <button
                type="button" disabled={enCours || plus}
                onClick={() => { setTexte(ex); requestAnimationFrame(() => formRef.current?.requestSubmit()); }}
                className="appui min-h-11 rounded-full border border-baobab/30 bg-white px-4 text-left text-sm font-medium text-baobab hover:bg-baobab-clair disabled:opacity-50"
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <section aria-live="polite" aria-busy={enCours} className="space-y-3">
        {enCours ? (
          <>
            <div className="flex items-center gap-3">
              <AvatarAyo className="h-12 w-12 animate-bounce" />
              <p className="rounded-2xl rounded-bl-none bg-white px-4 py-2 font-semibold text-baobab shadow-sm">Ayo cherche pour vous…</p>
            </div>
            <SqueletteListe n={3} />
          </>
        ) : etat.suggestions ? (
          etat.suggestions.length === 0 ? (
            <div className="animate-apparition rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center">
              <AvatarAyo className="mx-auto mb-2 h-14 w-14" />
              <p>Aucune animation du jour ne correspond. Essayez une autre question.</p>
            </div>
          ) : (
            <>
              <h2 className="flex items-center gap-3 text-xl font-bold">
                <AvatarAyo className="h-11 w-11" />
                Ayo vous propose
              </h2>
              <ul className="cascade space-y-3">
                {etat.suggestions.map((s) => (
                  <CarteAnimation key={s.animation.id} a={s.animation}>
                    <p className="mt-2 flex gap-2 rounded-xl bg-baobab-clair p-3 text-[15px] leading-relaxed">
                      <AvatarAyo className="h-7 w-7" />
                      <span><span className="sr-only">Pourquoi : </span>{s.pourquoi}</span>
                    </p>
                  </CarteAnimation>
                ))}
              </ul>
            </>
          )
        ) : null}
      </section>
    </div>
  );
}
