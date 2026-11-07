import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { formatHeure } from "@/lib/guide";
import type { AnimationAvecLieu } from "./guide";

export type Suggestion = { animation: AnimationAvecLieu; pourquoi: string };

const reponseSchema = z.object({
  suggestions: z.array(z.object({ id: z.number().int(), pourquoi: z.string().max(400) })).max(10),
});

/** Ne garde que des animations existantes du jour, sans doublon, 3 au plus. */
export function filtrerSuggestions(brutes: { id: number; pourquoi: string }[], candidates: AnimationAvecLieu[]): Suggestion[] {
  const parId = new Map(candidates.map((a) => [a.id, a]));
  const vues = new Set<number>();
  const res: Suggestion[] = [];
  for (const s of brutes) {
    const a = parId.get(s.id);
    if (!a || vues.has(s.id)) continue;
    vues.add(s.id);
    res.push({ animation: a, pourquoi: s.pourquoi });
    if (res.length === 3) break;
  }
  return res;
}

export async function demanderAssistant(question: string, candidates: AnimationAvecLieu[], maintenant: string) {
  if (candidates.length === 0) return [];
  const programme = candidates
    .map((a) => `#${a.id} | ${formatHeure(a.debut)}–${formatHeure(a.fin)} | ${a.titre} | ${a.lieu} | ${a.description}`)
    .join("\n");
  const client = new Anthropic();
  const r = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 2000,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: { id: { type: "integer" }, pourquoi: { type: "string" } },
                required: ["id", "pourquoi"],
                additionalProperties: false,
              },
            },
          },
          required: ["suggestions"],
          additionalProperties: false,
        },
      },
    },
    system:
      "Tu es le guide des Jeux Olympiques de la Jeunesse de Dakar 2026. On te donne le programme du jour " +
      "(une animation par ligne, préfixée par son identifiant #id). Propose au plus 3 animations de CETTE liste " +
      "qui répondent le mieux à la question du visiteur, en tenant compte de l’heure actuelle (évite ce qui est déjà fini). " +
      "Pour chacune, explique en une ou deux phrases simples, en français, pourquoi elle convient. " +
      "N’invente jamais d’animation ni d’identifiant. Si rien ne convient, renvoie une liste vide.",
    messages: [
      {
        role: "user",
        content: `Heure actuelle à Dakar : ${maintenant}\n\nProgramme du jour :\n${programme}\n\nQuestion du visiteur : ${question}`,
      },
    ],
  });
  if (r.stop_reason === "refusal") return [];
  const texte = r.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const parse = reponseSchema.safeParse(JSON.parse(texte));
  if (!parse.success) throw new Error("Réponse de l’assistant illisible.");
  return filtrerSuggestions(parse.data.suggestions, candidates);
}
