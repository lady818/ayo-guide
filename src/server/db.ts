import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { initialiser } from "./schema";

const globalPourDb = globalThis as unknown as { guideDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!globalPourDb.guideDb) {
    const dossier = path.join(process.cwd(), "data");
    mkdirSync(dossier, { recursive: true });
    const base = new DatabaseSync(process.env.GUIDE_DB ?? path.join(dossier, "guide.db"));
    initialiser(base);
    globalPourDb.guideDb = base;
  }
  return globalPourDb.guideDb;
}
