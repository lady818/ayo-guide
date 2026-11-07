"use client";
import { useActionState } from "react";
import { CarteAnimation } from "@/components/carte-animation";
import { questionAction, type EtatQuestion } from "./actions";

export function FormQuestion() {
  const [etat, action, enCours] = useActionState<EtatQuestion, FormData>(questionAction, {});
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
        <textarea name="question" rows={3} maxLength={300} defaultValue={etat.question}
          placeholder="Que puis-je faire cet après-midi ?" className="w-full rounded-lg border border-stone-300 p-3" />
        {etat.erreur && <p role="alert" className="text-sm text-red-700">{etat.erreur}</p>}
        <button disabled={enCours} className="h-11 rounded-lg bg-emerald-700 px-4 font-medium text-white disabled:opacity-60">
          {enCours ? "L’assistant réfléchit…" : "Demander"}
        </button>
      </form>
      {etat.suggestions && (
        etat.suggestions.length === 0 ? (
          <p className="rounded-xl bg-white p-4 text-stone-600">Aucune animation du jour ne correspond.</p>
        ) : (
          <ul className="space-y-3">
            {etat.suggestions.map((s) => (
              <CarteAnimation key={s.animation.id} a={s.animation}>
                <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm">💬 {s.pourquoi}</p>
              </CarteAnimation>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
