import { describe, expect, it, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { estEnCours, raisonRejet, tempsTrajet } from "@/lib/guide";
import { initialiser } from "@/server/schema";
import { agendaDuJour, animationActive, importerProgramme, itineraire, listerLieux, retirerAnimation } from "@/server/guide";
import { filtrerSuggestions } from "@/server/assistant";

let base: DatabaseSync;
beforeEach(() => {
  base = new DatabaseSync(":memory:");
  initialiser(base, false);
});
const J = "2026-11-07";
const prog = (o: Record<string, unknown> = {}) => ({ titre: "Concert", debut: `${J}T14:00`, fin: `${J}T15:00`, lieu: "Plage de Saly", ...o });

describe("TR1 agenda", () => {
  it("début inclus, fin exclue", () => {
    const a = { debut: `${J}T14:00:00.000Z`, fin: `${J}T15:00:00.000Z` };
    expect(estEnCours(a, new Date(`${J}T14:00:00Z`))).toBe(true);
    expect(estEnCours(a, new Date(`${J}T14:59:59Z`))).toBe(true);
    expect(estEnCours(a, new Date(`${J}T15:00:00Z`))).toBe(false);
    expect(estEnCours(a, new Date(`${J}T13:59:59Z`))).toBe(false);
  });
  it("trie par heure et filtre en cours à 15 h", () => {
    importerProgramme(base, [prog({ titre: "B", debut: `${J}T16:00`, fin: `${J}T18:00` }), prog({ titre: "A" }), prog({ titre: "C", debut: `${J}T14:30`, fin: `${J}T17:00` })]);
    expect(agendaDuJour(base, J).map((a) => a.titre)).toEqual(["A", "C", "B"]);
    expect(agendaDuJour(base, J, new Date(`${J}T15:00:00Z`)).map((a) => a.titre)).toEqual(["C"]);
    expect(agendaDuJour(base, J)[0].lieu).toBe("Plage de Saly");
  });
});

describe("TR2 import", () => {
  it("écarte fin ≤ début, hors Jeux, lieu inconnu, champs invalides", () => {
    const b = importerProgramme(base, [
      prog(),
      prog({ titre: "X", fin: `${J}T14:00` }),
      prog({ titre: "Y", debut: "2026-11-20T10:00", fin: "2026-11-20T11:00" }),
      prog({ titre: "Z", lieu: "Lune" }),
      { titre: "" },
    ]);
    expect(b.ajoutees).toBe(1);
    expect(b.ecartees.map((e) => e.ligne)).toEqual([2, 3, 4, 5]);
  });
  it("ne duplique pas un réimport", () => {
    importerProgramme(base, [prog()]);
    expect(importerProgramme(base, [prog()])).toMatchObject({ ajoutees: 0, ignorees: 1 });
  });
  it("bornes des Jeux", () => {
    expect(raisonRejet("2026-10-31T00:00:00.000Z", "2026-10-31T01:00:00.000Z")).toBeNull();
    expect(raisonRejet("2026-11-13T22:00:00.000Z", "2026-11-13T23:00:00.000Z")).toBeNull();
    expect(raisonRejet("2026-10-30T22:00:00.000Z", "2026-10-30T23:00:00.000Z")).not.toBeNull();
  });
  it("la base refuse aussi fin ≤ début", () => {
    expect(() => base.prepare("INSERT INTO animation (titre, debut, fin, lieu_id) VALUES ('x', ?, ?, 1)").run(`${J}T15:00:00.000Z`, `${J}T14:00:00.000Z`)).toThrow();
  });
});

describe("TR3 retrait", () => {
  it("une animation retirée n’apparaît plus nulle part", () => {
    importerProgramme(base, [prog()]);
    const [a] = agendaDuJour(base, J);
    expect(retirerAnimation(base, a.id)).toBe(true);
    expect(agendaDuJour(base, J)).toHaveLength(0);
    expect(animationActive(base, a.id)).toBeNull();
    expect(itineraire(base, a.id, 1)).toEqual({ erreur: "Animation introuvable." });
  });
});

describe("TR4 itinéraire", () => {
  it("temps à pied et en voiture depuis un site connu", () => {
    importerProgramme(base, [prog({ lieu: "Dakar Arena (Diamniadio)" })]);
    const [a] = agendaDuJour(base, J);
    const dep = listerLieux(base).find((l) => l.nom.startsWith("Place de l"))!;
    const r = itineraire(base, a.id, dep.id);
    expect("erreur" in r).toBe(false);
    if (!("erreur" in r)) expect(r.piedMin).toBeGreaterThan(r.voitureMin);
  });
  it("site de départ inconnu refusé", () => {
    importerProgramme(base, [prog()]);
    const [a] = agendaDuJour(base, J);
    expect(itineraire(base, a.id, 9999)).toEqual({ erreur: "Site de départ inconnu." });
  });
  it("même lieu ≈ 1 min", () => {
    const l = { id: 1, nom: "x", lat: 14.7, lng: -17.4 };
    expect(tempsTrajet(l, l)).toMatchObject({ piedMin: 1, voitureMin: 1 });
  });
});

describe("TR5 suggestions", () => {
  it("ne garde que des animations existantes, sans doublon, 3 au plus", () => {
    importerProgramme(base, ["A", "B", "C", "D"].map((t) => prog({ titre: t })));
    const c = agendaDuJour(base, J);
    const r = filtrerSuggestions([{ id: 999, pourquoi: "" }, { id: c[0].id, pourquoi: "" }, { id: c[0].id, pourquoi: "" }, ...c.slice(1).map((a) => ({ id: a.id, pourquoi: "" }))], c);
    expect(r.map((s) => s.animation.id)).toEqual(c.slice(0, 3).map((a) => a.id));
  });
});
