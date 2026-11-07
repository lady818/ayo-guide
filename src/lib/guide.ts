// Règles métier pures (testables sans base). Dakar = UTC+0 toute l'année :
// les heures sont stockées en ISO UTC et affichées telles quelles.
import { z } from "zod";

export const JOJ_DEBUT = "2026-10-31T00:00:00.000Z";
export const JOJ_FIN_EXCLUE = "2026-11-14T00:00:00.000Z"; // jusqu'au 13 novembre inclus

export type Animation = {
  id: number;
  titre: string;
  description: string;
  debut: string; // ISO UTC
  fin: string; // ISO UTC
  lieuId: number;
};

export type Lieu = { id: number; nom: string; lat: number; lng: number };

/** En cours si début ≤ heure < fin (début inclus, fin exclue). */
export function estEnCours(a: Pick<Animation, "debut" | "fin">, heure: Date): boolean {
  const t = heure.getTime();
  return Date.parse(a.debut) <= t && t < Date.parse(a.fin);
}

export function trierParDebut<T extends Pick<Animation, "debut">>(liste: T[]): T[] {
  return [...liste].sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
}

/** Raison du rejet d'une animation importée, ou null si elle est valide. */
export function raisonRejet(debut: string, fin: string): string | null {
  const d = Date.parse(debut);
  const f = Date.parse(fin);
  if (Number.isNaN(d) || Number.isNaN(f)) return "date invalide";
  if (f <= d) return "la fin n’est pas après le début";
  if (d < Date.parse(JOJ_DEBUT) || f > Date.parse(JOJ_FIN_EXCLUE))
    return "hors des Jeux (31 octobre – 13 novembre 2026)";
  return null;
}

// Heure locale de Dakar sans fuseau (« 2026-11-07T14:00 ») → ISO UTC.
const heureDakar = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|\+00:00)?$/, "format AAAA-MM-JJTHH:MM attendu")
  .transform((s) => new Date(/Z|\+00:00$/.test(s) ? s : `${s}Z`).toISOString());

export const ligneProgramme = z.object({
  titre: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).default(""),
  debut: heureDakar,
  fin: heureDakar,
  lieu: z.string().trim().min(1).max(120),
});
export type LigneProgramme = z.infer<typeof ligneProgramme>;

export const jourSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const heureSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

// --- Trajets : estimation sans service externe ---
const R_TERRE_KM = 6371;
export function distanceKm(a: Pick<Lieu, "lat" | "lng">, b: Pick<Lieu, "lat" | "lng">): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_TERRE_KM * Math.asin(Math.sqrt(h));
}

export const FACTEUR_DETOUR = 1.3;
export const VITESSE_PIED_KMH = 5;
export const VITESSE_VOITURE_KMH = 35; // circulation dakaroise

export function tempsTrajet(depart: Lieu, arrivee: Lieu) {
  const km = distanceKm(depart, arrivee) * FACTEUR_DETOUR;
  return {
    km: Math.round(km * 10) / 10,
    piedMin: Math.max(1, Math.round((km / VITESSE_PIED_KMH) * 60)),
    voitureMin: Math.max(1, Math.round((km / VITESSE_VOITURE_KMH) * 60)),
  };
}

export function formatDuree(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export function formatHeure(iso: string): string {
  return iso.slice(11, 16).replace(":", " h ");
}

export function aujourdhuiDakar(): string {
  return new Date().toISOString().slice(0, 10);
}
