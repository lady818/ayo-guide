import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { estEnCours, raisonRejet, tempsTrajet } from "@/lib/guide";
import { initialiser } from "@/server/schema";
import { agendaDuJour, animationActive, consommerEssai, importerProgramme, itineraire, listerLieux, retirerAnimation } from "@/server/guide";
import { filtrerSuggestions } from "@/server/assistant";

// Base dédiée aux tests (jamais la base de démo).
const url = process.env.TEST_DATABASE_URL ?? "postgres://budgety:budgety@localhost:5432/guide_joj_test";
if (!/_test$/.test(new URL(url).pathname)) throw new Error("Les tests exigent une base dont le nom finit par _test.");
const base = new Pool({ connectionString: url });
afterAll(() => base.end());

beforeEach(async () => {
  await base.query("DROP TABLE IF EXISTS animation, lieu, essai CASCADE");
  await initialiser(base, false);
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
  it("trie par heure et filtre en cours à 15 h", async () => {
    await importerProgramme(base, [prog({ titre: "B", debut: `${J}T16:00`, fin: `${J}T18:00` }), prog({ titre: "A" }), prog({ titre: "C", debut: `${J}T14:30`, fin: `${J}T17:00` })]);
    const jour = await agendaDuJour(base, J);
    expect(jour.map((a) => a.titre)).toEqual(["A", "C", "B"]);
    expect(jour[0]).toMatchObject({ lieu: "Plage de Saly", debut: `${J}T14:00:00.000Z` });
    expect((await agendaDuJour(base, J, new Date(`${J}T15:00:00Z`))).map((a) => a.titre)).toEqual(["C"]);
  });
});

describe("TR2 import", () => {
  it("écarte fin ≤ début, hors Jeux, lieu inconnu, champs invalides", async () => {
    const b = await importerProgramme(base, [
      prog(),
      prog({ titre: "X", fin: `${J}T14:00` }),
      prog({ titre: "Y", debut: "2026-11-20T10:00", fin: "2026-11-20T11:00" }),
      prog({ titre: "Z", lieu: "Lune" }),
      { titre: "" },
    ]);
    expect(b.ajoutees).toBe(1);
    expect(b.ecartees.map((e) => e.ligne)).toEqual([2, 3, 4, 5]);
  });
  it("ne duplique pas un réimport", async () => {
    await importerProgramme(base, [prog()]);
    expect(await importerProgramme(base, [prog()])).toMatchObject({ ajoutees: 0, ignorees: 1 });
  });
  it("bornes des Jeux", () => {
    expect(raisonRejet("2026-10-31T00:00:00.000Z", "2026-10-31T01:00:00.000Z")).toBeNull();
    expect(raisonRejet("2026-11-13T22:00:00.000Z", "2026-11-13T23:00:00.000Z")).toBeNull();
    expect(raisonRejet("2026-10-30T22:00:00.000Z", "2026-10-30T23:00:00.000Z")).not.toBeNull();
  });
  it("la base refuse aussi fin ≤ début et hors Jeux", async () => {
    const ins = (d: string, f: string) => base.query("INSERT INTO animation (titre, debut, fin, lieu_id) VALUES ('x', $1, $2, 1)", [d, f]);
    await expect(ins(`${J}T15:00:00Z`, `${J}T14:00:00Z`)).rejects.toThrow();
    await expect(ins("2026-12-01T10:00:00Z", "2026-12-01T11:00:00Z")).rejects.toThrow();
  });
});

describe("TR3 retrait", () => {
  it("une animation retirée n’apparaît plus nulle part", async () => {
    await importerProgramme(base, [prog()]);
    const [a] = await agendaDuJour(base, J);
    expect(await retirerAnimation(base, a.id)).toBe(true);
    expect(await agendaDuJour(base, J)).toHaveLength(0);
    expect(await animationActive(base, a.id)).toBeNull();
    expect(await itineraire(base, a.id, 1)).toEqual({ erreur: "Animation introuvable." });
  });
});

describe("TR4 itinéraire", () => {
  it("temps à pied et en voiture depuis un site connu", async () => {
    await importerProgramme(base, [prog({ lieu: "Dakar Arena (Diamniadio)" })]);
    const [a] = await agendaDuJour(base, J);
    const dep = (await listerLieux(base)).find((l) => l.nom.startsWith("Place de l"))!;
    const r = await itineraire(base, a.id, dep.id);
    expect("erreur" in r).toBe(false);
    if (!("erreur" in r)) expect(r.piedMin).toBeGreaterThan(r.voitureMin);
  });
  it("site de départ inconnu refusé", async () => {
    await importerProgramme(base, [prog()]);
    const [a] = await agendaDuJour(base, J);
    expect(await itineraire(base, a.id, 9999)).toEqual({ erreur: "Site de départ inconnu." });
  });
  it("même lieu ≈ 1 min", () => {
    const l = { id: 1, nom: "x", lat: 14.7, lng: -17.4 };
    expect(tempsTrajet(l, l)).toMatchObject({ piedMin: 1, voitureMin: 1 });
  });
});

describe("TR5 suggestions", () => {
  it("ne garde que des animations existantes, sans doublon, 3 au plus", async () => {
    await importerProgramme(base, ["A", "B", "C", "D"].map((t) => prog({ titre: t })));
    const c = await agendaDuJour(base, J);
    const r = filtrerSuggestions([{ id: 999, pourquoi: "" }, { id: c[0].id, pourquoi: "" }, { id: c[0].id, pourquoi: "" }, ...c.slice(1).map((a) => ({ id: a.id, pourquoi: "" }))], c);
    expect(r.map((s) => s.animation.id)).toEqual(c.slice(0, 3).map((a) => a.id));
  });
});

describe("limitation des essais", () => {
  it("refuse au-delà du maximum", async () => {
    for (let i = 0; i < 3; i++) expect(await consommerEssai(base, "t", 3, 60_000)).toBe(true);
    expect(await consommerEssai(base, "t", 3, 60_000)).toBe(false);
    expect(await consommerEssai(base, "autre", 3, 60_000)).toBe(true);
  });
});

describe("données de démo", () => {
  it("se chargent sans doublon même si l’initialisation est lancée deux fois en même temps", async () => {
    await base.query("DROP TABLE IF EXISTS animation, lieu, essai CASCADE");
    await initialiser(base);
    await Promise.all([initialiser(base), initialiser(base)]);
    expect(await agendaDuJour(base, J)).toHaveLength(9);
  });
});
