"use client";
import { useActionState } from "react";
import { connexionAction, importAction, type EtatConnexion, type EtatImport } from "./actions";

export function FormConnexion() {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(connexionAction, {});
  return (
    <form action={action} className="max-w-sm space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <label className="block text-sm font-medium">
        Code d’accès
        <input name="code" type="password" required autoComplete="current-password"
          className="mt-1 h-11 w-full rounded-lg border border-stone-300 px-3" />
      </label>
      {etat.erreur && <p role="alert" className="text-sm text-red-700">{etat.erreur}</p>}
      <button disabled={enCours} className="h-11 w-full rounded-lg bg-emerald-700 font-medium text-white disabled:opacity-60">
        Entrer
      </button>
    </form>
  );
}

export function FormImport() {
  const [etat, action, enCours] = useActionState<EtatImport, FormData>(importAction, {});
  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Charger le programme officiel</h2>
      <p className="text-sm text-stone-600">
        Fichier JSON : une liste de{" "}
        <code className="rounded bg-stone-100 px-1">{`{ "titre", "description", "debut": "2026-11-07T14:00", "fin", "lieu" }`}</code>{" "}
        (heures de Dakar, lieu = nom d’un site connu).
      </p>
      <input type="file" name="programme" accept="application/json,.json" className="block w-full text-sm" />
      <textarea name="texte" rows={4} placeholder="… ou collez le JSON ici"
        className="w-full rounded-lg border border-stone-300 p-2 font-mono text-xs" />
      <button disabled={enCours} className="h-11 rounded-lg bg-emerald-700 px-4 font-medium text-white disabled:opacity-60">
        {enCours ? "Chargement…" : "Charger"}
      </button>
      {etat.erreur && <p role="alert" className="text-sm text-red-700">{etat.erreur}</p>}
      {etat.bilan && (
        <div role="status" className="rounded-lg bg-emerald-50 p-3 text-sm">
          <p><strong>{etat.bilan.ajoutees}</strong> ajoutée(s), {etat.bilan.ignorees} déjà présente(s), {etat.bilan.ecartees.length} écartée(s).</p>
          {etat.bilan.ecartees.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-red-800">
              {etat.bilan.ecartees.slice(0, 20).map((e) => <li key={e.ligne}>Ligne {e.ligne} : {e.raison}</li>)}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
