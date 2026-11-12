import type { Pool } from "pg";
import { JOJ_DEBUT, JOJ_FIN_EXCLUE } from "@/lib/guide";

// Sites connus du guide (coordonnées approximatives).
export const LIEUX_CONNUS: [string, number, number][] = [
  ["Dakar Arena (Diamniadio)", 14.7375, -17.1789],
  ["Stade Abdoulaye Wade (Diamniadio)", 14.7413, -17.1914],
  ["Centre des Expositions (Diamniadio)", 14.7231, -17.1823],
  ["Gare TER de Diamniadio", 14.7286, -17.1857],
  ["Stade Iba Mar Diop (Dakar)", 14.6844, -17.4517],
  ["Piscine Olympique (Dakar)", 14.6878, -17.4655],
  ["Tour de l’Œuf – Corniche (Dakar)", 14.6904, -17.4709],
  ["Place de l’Indépendance (Dakar)", 14.6681, -17.4319],
  ["Plage de Saly", 14.4469, -17.0122],
  ["Aéroport AIBD", 14.67, -17.0733],
];

// Extrait recopié pour la démo (hypothèse du PRD) : même journée type chaque jour des Jeux.
const JOURNEE_TYPE: [string, string, string, string, number][] = [
  ["Initiation à la lutte sénégalaise", "Découverte des prises de base avec des lutteurs, ouvert à tous.", "09:00", "12:00", 2],
  ["Athlétisme – séries du matin", "Séries du 100 m et du 400 m haies, places libres en tribune.", "10:00", "13:00", 1],
  ["Fan zone des Jeux", "Écrans géants, jeux, restauration et animations musicales.", "11:00", "18:00", 0],
  ["Concert mbalax sur la Corniche", "Concert en plein air face à l’océan.", "13:00", "15:00", 6],
  ["Basket 3x3 – phase de poules", "Matchs rapides garçons et filles, ambiance garantie.", "14:00", "16:30", 0],
  ["Beach handball – démonstration", "Démonstration et initiation sur la plage.", "14:30", "17:00", 8],
  ["Natation – finales", "Finales du 50 m et du 200 m nage libre.", "15:00", "17:00", 5],
  ["Atelier dessin pour enfants", "Les enfants dessinent la mascotte des Jeux, matériel fourni.", "16:00", "19:00", 2],
  ["Soirée concert des Jeux", "Grand concert de clôture de la journée.", "18:00", "22:00", 4],
];

export async function initialiser(base: Pool, avecDemo = true) {
  await base.query(`
    CREATE TABLE IF NOT EXISTS lieu (
      id SERIAL PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL
    );
    CREATE TABLE IF NOT EXISTS animation (
      id SERIAL PRIMARY KEY,
      titre TEXT NOT NULL CHECK (length(titre) BETWEEN 1 AND 120),
      description TEXT NOT NULL DEFAULT '',
      debut TIMESTAMPTZ NOT NULL,
      fin TIMESTAMPTZ NOT NULL,
      lieu_id INTEGER NOT NULL REFERENCES lieu(id),
      retiree_le TIMESTAMPTZ,
      CHECK (fin > debut),
      CHECK (debut >= '${JOJ_DEBUT}' AND fin <= '${JOJ_FIN_EXCLUE}'),
      UNIQUE (titre, debut, lieu_id)
    );
    CREATE INDEX IF NOT EXISTS animation_debut ON animation(debut);
    CREATE TABLE IF NOT EXISTS essai (
      cle TEXT NOT NULL,
      quand TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS essai_cle ON essai(cle, quand);
  `);
  const { rows } = await base.query<{ n: number }>("SELECT count(*)::int AS n FROM lieu");
  if (rows[0].n >= LIEUX_CONNUS.length) return;

  for (const [nom, lat, lng] of LIEUX_CONNUS)
    await base.query("INSERT INTO lieu (nom, lat, lng) VALUES ($1, $2, $3) ON CONFLICT (nom) DO NOTHING", [nom, lat, lng]);
  if (!avecDemo) return;

  const ids = new Map(
    (await base.query<{ id: number; nom: string }>("SELECT id, nom FROM lieu")).rows.map((l) => [l.nom, l.id]),
  );
  const valeurs: unknown[] = [];
  const lignes: string[] = [];
  for (let jour = new Date(JOJ_DEBUT); jour.toISOString() < JOJ_FIN_EXCLUE; jour.setUTCDate(jour.getUTCDate() + 1)) {
    const j = jour.toISOString().slice(0, 10);
    for (const [titre, desc, d, f, lieu] of JOURNEE_TYPE) {
      const n = valeurs.length;
      lignes.push(`($${n + 1}, $${n + 2}, $${n + 3}, $${n + 4}, $${n + 5})`);
      valeurs.push(titre, desc, `${j}T${d}:00.000Z`, `${j}T${f}:00.000Z`, ids.get(LIEUX_CONNUS[lieu][0]));
    }
  }
  await base.query(
    `INSERT INTO animation (titre, description, debut, fin, lieu_id) VALUES ${lignes.join(",")} ON CONFLICT DO NOTHING`,
    valeurs,
  );
}
