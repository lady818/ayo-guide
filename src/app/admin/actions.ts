"use server";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { connecterAdmin, deconnecterAdmin, estAdmin } from "@/server/admin";
import { importerProgramme, retirerAnimation, type BilanImport } from "@/server/guide";

export type EtatConnexion = { erreur?: string };
export type EtatImport = { erreur?: string; bilan?: BilanImport };

export async function connexionAction(_: EtatConnexion, form: FormData): Promise<EtatConnexion> {
  const erreur = await connecterAdmin(form.get("code"));
  if (erreur) return { erreur };
  refresh();
  return {};
}

export async function deconnexionAction() {
  await deconnecterAdmin();
  refresh();
}

const TAILLE_MAX = 2 * 1024 * 1024;

export async function importAction(_: EtatImport, form: FormData): Promise<EtatImport> {
  if (!(await estAdmin())) return { erreur: "Accès refusé : code d’accès requis." };
  const fichier = form.get("programme");
  const collé = form.get("texte");
  let texte = "";
  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > TAILLE_MAX) return { erreur: "Fichier trop gros (2 Mo au plus)." };
    texte = await fichier.text();
  } else if (typeof collé === "string" && collé.trim()) {
    if (collé.length > TAILLE_MAX) return { erreur: "Texte trop long." };
    texte = collé;
  } else return { erreur: "Choisissez un fichier JSON ou collez le programme." };
  let donnees: unknown;
  try {
    donnees = JSON.parse(texte);
  } catch {
    return { erreur: "Le fichier n’est pas un JSON valide." };
  }
  try {
    const bilan = importerProgramme(db(), donnees);
    refresh();
    return { bilan };
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Import impossible." };
  }
}

const idSchema = z.coerce.number().int().positive();

export async function retirerAction(form: FormData) {
  if (!(await estAdmin())) throw new Error("Accès refusé.");
  const id = idSchema.safeParse(form.get("id"));
  if (!id.success) throw new Error("Identifiant invalide.");
  retirerAnimation(db(), id.data);
  refresh();
}
