"use client";
import { useActionState } from "react";
import { connexionAction, importAction, type EtatConnexion, type EtatImport } from "./actions";

export function FormConnexion() {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(connexionAction, {});
  return (
    <form action={action} className="max-w-sm space-y-3 rounded-2xl border border-sable-fonce bg-white p-4 shadow-sm sm:p-5">
      <label htmlFor="code" className="block text-sm font-semibold">Code d’accès</label>
        <input id="code" name="code" type="password" required autoComplete="current-password"
          aria-describedby={etat.erreur ? "erreur-code" : undefined} aria-invalid={etat.erreur ? true : undefined}
          className="mt-1 h-12 w-full rounded-xl border border-stone-300 bg-sable px-3 text-base" />
      {etat.erreur && <p id="erreur-code" role="alert" className="text-sm text-terre font-medium">{etat.erreur}</p>}
      <button disabled={enCours} className="h-12 w-full rounded-xl bg-baobab hover:bg-[#0b3f27] appui font-medium text-white disabled:opacity-60">
        Entrer
      </button>
    </form>
  );
}

export function FormImport() {
  const [etat, action, enCours] = useActionState<EtatImport, FormData>(importAction, {});
  return (
    <form action={action} className="space-y-3 rounded-2xl border border-sable-fonce bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold">Charger le programme officiel</h2>
      <p className="text-sm text-gris">
        Fichier JSON : une liste de{" "}
        <code className="rounded bg-stone-100 px-1">{`{ "titre", "description", "debut": "2026-11-07T14:00", "fin", "lieu" }`}</code>{" "}
        (heures de Dakar, lieu = nom d’un site connu).
      </p>
      <label htmlFor="programme" className="block text-sm font-semibold">Fichier JSON</label>
      <input id="programme" type="file" name="programme" accept="application/json,.json" className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-baobab-clair file:px-4 file:font-semibold file:text-baobab" />
      <label htmlFor="texte" className="block text-sm font-semibold">… ou collez le programme</label>
      <textarea id="texte" name="texte" rows={4} placeholder="… ou collez le JSON ici"
        className="w-full rounded-lg border border-stone-300 p-2 font-mono text-xs" />
      <button disabled={enCours} className="h-12 rounded-xl bg-baobab hover:bg-[#0b3f27] appui px-4 font-medium text-white disabled:opacity-60">
        {enCours ? "Chargement…" : "Charger"}
      </button>
      {etat.erreur && <p role="alert" className="text-sm text-terre font-medium">{etat.erreur}</p>}
      {etat.bilan && (
        <div role="status" className="rounded-lg bg-baobab-clair p-3 text-sm">
          <p><strong>{etat.bilan.ajoutees}</strong> ajoutée(s), {etat.bilan.ignorees} déjà présente(s), {etat.bilan.ecartees.length} écartée(s).</p>
          {etat.bilan.ecartees.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-terre">
              {etat.bilan.ecartees.slice(0, 20).map((e) => <li key={e.ligne}>Ligne {e.ligne} : {e.raison}</li>)}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
