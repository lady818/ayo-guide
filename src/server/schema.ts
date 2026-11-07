import type { DatabaseSync } from "node:sqlite";
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

export function initialiser(base: DatabaseSync, avecDemo = true) {
  base.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS lieu (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE,
      lat REAL NOT NULL,
      lng REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS animation (
      id INTEGER PRIMARY KEY,
      titre TEXT NOT NULL CHECK (length(titre) BETWEEN 1 AND 120),
      description TEXT NOT NULL DEFAULT '',
      debut TEXT NOT NULL,
      fin TEXT NOT NULL,
      lieu_id INTEGER NOT NULL REFERENCES lieu(id),
      retiree_le TEXT,
      CHECK (fin > debut),
      CHECK (debut >= '${JOJ_DEBUT}' AND fin <= '${JOJ_FIN_EXCLUE}'),
      UNIQUE (titre, debut, lieu_id)
    );
    CREATE INDEX IF NOT EXISTS animation_debut ON animation(debut);
  `);
  const nbLieux = base.prepare("SELECT count(*) AS n FROM lieu").get() as { n: number };
  if (nbLieux.n > 0) return;

  const insLieu = base.prepare("INSERT INTO lieu (nom, lat, lng) VALUES (?, ?, ?)");
  const ids = LIEUX_CONNUS.map(([nom, lat, lng]) => Number(insLieu.run(nom, lat, lng).lastInsertRowid));
  if (!avecDemo) return;

  const insAnim = base.prepare(
    "INSERT INTO animation (titre, description, debut, fin, lieu_id) VALUES (?, ?, ?, ?, ?)",
  );
  for (let jour = new Date(JOJ_DEBUT); jour.toISOString() < JOJ_FIN_EXCLUE; jour.setUTCDate(jour.getUTCDate() + 1)) {
    const j = jour.toISOString().slice(0, 10);
    for (const [titre, desc, d, f, lieu] of JOURNEE_TYPE) {
      insAnim.run(titre, desc, `${j}T${d}:00.000Z`, `${j}T${f}:00.000Z`, ids[lieu]);
    }
  }
}
