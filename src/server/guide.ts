// Services métier : toutes les lectures publiques ne voient que les animations actives.
import type { DatabaseSync } from "node:sqlite";
import { estEnCours, ligneProgramme, raisonRejet, tempsTrajet, trierParDebut, type Animation, type Lieu } from "@/lib/guide";

export type AnimationAvecLieu = Animation & { lieu: string };

const SELECT_ACTIVES = `
  SELECT a.id, a.titre, a.description, a.debut, a.fin, a.lieu_id AS lieuId, l.nom AS lieu
  FROM animation a JOIN lieu l ON l.id = a.lieu_id
  WHERE a.retiree_le IS NULL`;

export function listerLieux(base: DatabaseSync): Lieu[] {
  return base.prepare("SELECT id, nom, lat, lng FROM lieu ORDER BY nom").all() as Lieu[];
}

/** Agenda d'une journée (AAAA-MM-JJ), trié par heure ; filtré « en cours » si `a` est donné. */
export function agendaDuJour(base: DatabaseSync, jour: string, a?: Date): AnimationAvecLieu[] {
  const lignes = base
    .prepare(`${SELECT_ACTIVES} AND a.debut >= ? AND a.debut < ?`)
    .all(`${jour}T00:00:00.000Z`, `${jour}T23:59:59.999Z`) as AnimationAvecLieu[];
  const triees = trierParDebut(lignes);
  return a ? triees.filter((x) => estEnCours(x, a)) : triees;
}

export function animationActive(base: DatabaseSync, id: number): AnimationAvecLieu | null {
  return (base.prepare(`${SELECT_ACTIVES} AND a.id = ?`).get(id) as AnimationAvecLieu | undefined) ?? null;
}

export type BilanImport = { ajoutees: number; ignorees: number; ecartees: { ligne: number; raison: string }[] };

/** Charge un programme (tableau JSON). Les lignes invalides sont écartées, pas tout le fichier. */
export function importerProgramme(base: DatabaseSync, donnees: unknown): BilanImport {
  if (!Array.isArray(donnees)) throw new Error("Le fichier doit contenir une liste d’animations.");
  if (donnees.length > 5000) throw new Error("Fichier trop volumineux (5000 animations au plus).");
  const lieux = new Map(listerLieux(base).map((l) => [l.nom.toLowerCase(), l.id]));
  const ins = base.prepare(
    "INSERT OR IGNORE INTO animation (titre, description, debut, fin, lieu_id) VALUES (?, ?, ?, ?, ?)",
  );
  const bilan: BilanImport = { ajoutees: 0, ignorees: 0, ecartees: [] };
  base.exec("BEGIN");
  try {
    donnees.forEach((brut, i) => {
      const ligne = i + 1;
      const p = ligneProgramme.safeParse(brut);
      if (!p.success) return bilan.ecartees.push({ ligne, raison: "champs manquants ou invalides" });
      const raison = raisonRejet(p.data.debut, p.data.fin);
      if (raison) return bilan.ecartees.push({ ligne, raison });
      const lieuId = lieux.get(p.data.lieu.toLowerCase());
      if (!lieuId) return bilan.ecartees.push({ ligne, raison: `lieu inconnu « ${p.data.lieu} »` });
      const r = ins.run(p.data.titre, p.data.description, p.data.debut, p.data.fin, lieuId);
      if (r.changes) bilan.ajoutees++;
      else bilan.ignorees++; // déjà présente
    });
    base.exec("COMMIT");
  } catch (e) {
    base.exec("ROLLBACK");
    throw e;
  }
  return bilan;
}

/** Retire une animation (réversible en base, invisible partout dans le guide). */
export function retirerAnimation(base: DatabaseSync, id: number): boolean {
  const r = base
    .prepare("UPDATE animation SET retiree_le = ? WHERE id = ? AND retiree_le IS NULL")
    .run(new Date().toISOString(), id);
  return r.changes === 1;
}

export function itineraire(base: DatabaseSync, animationId: number, departId: number) {
  const anim = animationActive(base, animationId);
  if (!anim) return { erreur: "Animation introuvable." } as const;
  const depart = base.prepare("SELECT id, nom, lat, lng FROM lieu WHERE id = ?").get(departId) as Lieu | undefined;
  if (!depart) return { erreur: "Site de départ inconnu." } as const;
  const arrivee = base.prepare("SELECT id, nom, lat, lng FROM lieu WHERE id = ?").get(anim.lieuId) as Lieu;
  return { depart, arrivee, ...tempsTrajet(depart, arrivee) } as const;
}
