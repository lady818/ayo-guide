import { Pool } from "pg";
import { initialiser } from "./schema";

const g = globalThis as unknown as { guidePool?: Pool; guidePret?: Promise<void> };

/** Pool PostgreSQL (DATABASE_URL), tables créées et données de démo chargées au premier appel. */
export async function db(): Promise<Pool> {
  if (!g.guidePool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquante.");
    g.guidePool = new Pool({
      connectionString: url,
      max: 3,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true },
    });
    g.guidePret = initialiser(g.guidePool).catch((e) => {
      g.guidePret = undefined;
      g.guidePool = undefined;
      throw e;
    });
  }
  await g.guidePret;
  return g.guidePool!;
}
