// Services métier : toutes les lectures publiques ne voient que les animations actives.
import type { Pool } from "pg";
import { estEnCours, ligneProgramme, raisonRejet, tempsTrajet, trierParDebut, type Animation, type Lieu } from "@/lib/guide";

export type AnimationAvecLieu = Animation & { lieu: string };

const ISO = (col: string) => `to_char(${col} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
const SELECT_ACTIVES = `
  SELECT a.id, a.titre, a.description, ${ISO("a.debut")} AS debut, ${ISO("a.fin")} AS fin,
         a.lieu_id AS "lieuId", l.nom AS lieu
  FROM animation a JOIN lieu l ON l.id = a.lieu_id
  WHERE a.retiree_le IS NULL`;

export async function listerLieux(base: Pool): Promise<Lieu[]> {
  return (await base.query<Lieu>("SELECT id, nom, lat, lng FROM lieu ORDER BY nom")).rows;
}

/** Agenda d'une journée (AAAA-MM-JJ), trié par heure ; filtré « en cours » si `a` est donné. */
export async function agendaDuJour(base: Pool, jour: string, a?: Date): Promise<AnimationAvecLieu[]> {
  const { rows } = await base.query<AnimationAvecLieu>(`${SELECT_ACTIVES} AND a.debut >= $1 AND a.debut < $2`, [
    `${jour}T00:00:00.000Z`,
    `${jour}T23:59:59.999Z`,
  ]);
  const triees = trierParDebut(rows);
  return a ? triees.filter((x) => estEnCours(x, a)) : triees;
}

export async function animationActive(base: Pool, id: number): Promise<AnimationAvecLieu | null> {
  return (await base.query<AnimationAvecLieu>(`${SELECT_ACTIVES} AND a.id = $1`, [id])).rows[0] ?? null;
}

export type BilanImport = { ajoutees: number; ignorees: number; ecartees: { ligne: number; raison: string }[] };

/** Charge un programme (tableau JSON). Les lignes invalides sont écartées, pas tout le fichier. */
export async function importerProgramme(base: Pool, donnees: unknown): Promise<BilanImport> {
  if (!Array.isArray(donnees)) throw new Error("Le fichier doit contenir une liste d’animations.");
  if (donnees.length > 5000) throw new Error("Fichier trop volumineux (5000 animations au plus).");
  const lieux = new Map((await listerLieux(base)).map((l) => [l.nom.toLowerCase(), l.id]));
  const bilan: BilanImport = { ajoutees: 0, ignorees: 0, ecartees: [] };
  const client = await base.connect();
  try {
    await client.query("BEGIN");
    for (const [i, brut] of donnees.entries()) {
      const ligne = i + 1;
      const p = ligneProgramme.safeParse(brut);
      if (!p.success) { bilan.ecartees.push({ ligne, raison: "champs manquants ou invalides" }); continue; }
      const raison = raisonRejet(p.data.debut, p.data.fin);
      if (raison) { bilan.ecartees.push({ ligne, raison }); continue; }
      const lieuId = lieux.get(p.data.lieu.toLowerCase());
      if (!lieuId) { bilan.ecartees.push({ ligne, raison: `lieu inconnu « ${p.data.lieu} »` }); continue; }
      const r = await client.query(
        "INSERT INTO animation (titre, description, debut, fin, lieu_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
        [p.data.titre, p.data.description, p.data.debut, p.data.fin, lieuId],
      );
      if (r.rowCount) bilan.ajoutees++;
      else bilan.ignorees++; // déjà présente
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return bilan;
}

/** Retire une animation (réversible en base, invisible partout dans le guide). */
export async function retirerAnimation(base: Pool, id: number): Promise<boolean> {
  const r = await base.query("UPDATE animation SET retiree_le = now() WHERE id = $1 AND retiree_le IS NULL", [id]);
  return r.rowCount === 1;
}

export async function itineraire(base: Pool, animationId: number, departId: number) {
  const anim = await animationActive(base, animationId);
  if (!anim) return { erreur: "Animation introuvable." } as const;
  const lieu = (id: number) => base.query<Lieu>("SELECT id, nom, lat, lng FROM lieu WHERE id = $1", [id]).then((r) => r.rows[0]);
  const depart = await lieu(departId);
  if (!depart) return { erreur: "Site de départ inconnu." } as const;
  const arrivee = await lieu(anim.lieuId);
  return { depart, arrivee, ...tempsTrajet(depart, arrivee) } as const;
}

/** Limitation partagée entre instances : true si l'essai est accepté (et compté). */
export async function consommerEssai(base: Pool, cle: string, max: number, fenetreMs: number): Promise<boolean> {
  const depuis = new Date(Date.now() - fenetreMs).toISOString();
  await base.query("DELETE FROM essai WHERE quand < now() - interval '1 day'");
  const { rows } = await base.query<{ n: number }>("SELECT count(*)::int AS n FROM essai WHERE cle = $1 AND quand >= $2", [cle, depuis]);
  if (rows[0].n >= max) return false;
  await base.query("INSERT INTO essai (cle) VALUES ($1)", [cle]);
  return true;
}

export async function effacerEssais(base: Pool, cle: string) {
  await base.query("DELETE FROM essai WHERE cle = $1", [cle]);
}
