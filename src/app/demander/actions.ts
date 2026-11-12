"use server";
import { z } from "zod";
import { aujourdhuiDakar } from "@/lib/guide";
import { db } from "@/server/db";
import { agendaDuJour, compterEssais, consommerEssai } from "@/server/guide";
import { adresseIp } from "@/server/admin";
import { demanderAssistant, type Suggestion } from "@/server/assistant";

export type EtatQuestion = { question?: string; erreur?: string; suggestions?: Suggestion[]; restantes?: number };

const QUESTIONS_PAR_JOUR = 5;
const JOUR_MS = 24 * 60 * 60 * 1000;
const questionSchema = z.string().trim().min(1, "Écrivez votre question.").max(300, "Question trop longue (300 caractères au plus).");

export async function questionAction(_: EtatQuestion, form: FormData): Promise<EtatQuestion> {
  const q = questionSchema.safeParse(form.get("question") ?? "");
  if (!q.success) return { erreur: q.error.issues[0]?.message ?? "Question invalide." };
  const base = await db();
  const cle = `ia:${await adresseIp()}`;
  // Protège le coût de l'IA : 5 questions par personne et par 24 h, 500 / jour au total.
  if (!(await consommerEssai(base, cle, QUESTIONS_PAR_JOUR, JOUR_MS)))
    return { question: q.data, restantes: 0, erreur: "Vous avez utilisé vos 5 questions du jour. Revenez demain !" };
  const restantes = Math.max(0, QUESTIONS_PAR_JOUR - (await compterEssais(base, cle, JOUR_MS)));
  if (!(await consommerEssai(base, "ia:total", 500, JOUR_MS)))
    return { question: q.data, restantes, erreur: "L’assistant a atteint sa limite du jour." };
  const now = new Date();
  const candidates = (await agendaDuJour(base, aujourdhuiDakar())).filter((a) => Date.parse(a.fin) > now.getTime());
  if (candidates.length === 0) return { question: q.data, restantes, suggestions: [] };
  try {
    const suggestions = await demanderAssistant(q.data, candidates, now.toISOString().slice(11, 16));
    return { question: q.data, restantes, suggestions };
  } catch (e) {
    console.error("assistant", e);
    return { question: q.data, restantes, erreur: "L’assistant est indisponible pour le moment. Réessayez." };
  }
}
