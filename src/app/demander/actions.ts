"use server";
import { z } from "zod";
import { aujourdhuiDakar } from "@/lib/guide";
import { db } from "@/server/db";
import { agendaDuJour, consommerEssai } from "@/server/guide";
import { adresseIp } from "@/server/admin";
import { demanderAssistant, type Suggestion } from "@/server/assistant";

export type EtatQuestion = { question?: string; erreur?: string; suggestions?: Suggestion[] };

const questionSchema = z.string().trim().min(1, "Posez une question.").max(300, "Question trop longue (300 caractères au plus).");

export async function questionAction(_: EtatQuestion, form: FormData): Promise<EtatQuestion> {
  const q = questionSchema.safeParse(form.get("question") ?? "");
  if (!q.success) return { erreur: q.error.issues[0]?.message ?? "Question invalide." };
  const base = await db();
  // Protège le coût de l'IA : 10 questions / 10 min par personne, 500 / jour au total.
  if (!(await consommerEssai(base, `ia:${await adresseIp()}`, 10, 10 * 60 * 1000)))
    return { question: q.data, erreur: "Trop de questions. Réessayez dans quelques minutes." };
  if (!(await consommerEssai(base, "ia:total", 500, 24 * 60 * 60 * 1000)))
    return { question: q.data, erreur: "L’assistant a atteint sa limite du jour." };
  const now = new Date();
  const candidates = (await agendaDuJour(base, aujourdhuiDakar())).filter((a) => Date.parse(a.fin) > now.getTime());
  if (candidates.length === 0) return { question: q.data, suggestions: [] };
  try {
    const suggestions = await demanderAssistant(q.data, candidates, now.toISOString().slice(11, 16));
    return { question: q.data, suggestions };
  } catch (e) {
    console.error("assistant", e);
    return { question: q.data, erreur: "L’assistant est indisponible pour le moment. Réessayez." };
  }
}
