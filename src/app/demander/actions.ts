"use server";
import { z } from "zod";
import { aujourdhuiDakar } from "@/lib/guide";
import { db } from "@/server/db";
import { agendaDuJour } from "@/server/guide";
import { demanderAssistant, type Suggestion } from "@/server/assistant";

export type EtatQuestion = { question?: string; erreur?: string; suggestions?: Suggestion[] };

const questionSchema = z.string().trim().min(1, "Posez une question.").max(300, "Question trop longue (300 caractères au plus).");

export async function questionAction(_: EtatQuestion, form: FormData): Promise<EtatQuestion> {
  const q = questionSchema.safeParse(form.get("question") ?? "");
  if (!q.success) return { erreur: q.error.issues[0]?.message ?? "Question invalide." };
  const now = new Date();
  const candidates = agendaDuJour(db(), aujourdhuiDakar()).filter((a) => Date.parse(a.fin) > now.getTime());
  if (candidates.length === 0) return { question: q.data, suggestions: [] };
  try {
    const suggestions = await demanderAssistant(q.data, candidates, now.toISOString().slice(11, 16));
    return { question: q.data, suggestions };
  } catch (e) {
    console.error("assistant", e);
    return { question: q.data, erreur: "L’assistant est indisponible pour le moment. Réessayez." };
  }
}
