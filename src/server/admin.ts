import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

const COOKIE = "guide_admin";
const DUREE_MS = 8 * 60 * 60 * 1000;
const MAX_ESSAIS = 5;
const FENETRE_MS = 15 * 60 * 1000;
const essais = new Map<string, { n: number; depuis: number }>();

function codeAdmin(): string {
  const code = process.env.ADMIN_CODE;
  if (!code || code.length < 8) throw new Error("ADMIN_CODE manquant ou trop court (8 caractères minimum).");
  return code;
}

function signer(expire: number): string {
  const cle = createHash("sha256").update(`guide-joj:${codeAdmin()}`).digest();
  return createHmac("sha256", cle).update(`admin:${expire}`).digest("hex");
}

function egal(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Vérifie le code (avec limitation des essais) et ouvre une session admin. */
export async function connecterAdmin(code: unknown): Promise<string | null> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const maintenant = Date.now();
  const e = essais.get(ip);
  if (e && maintenant - e.depuis < FENETRE_MS && e.n >= MAX_ESSAIS)
    return "Trop d’essais. Réessayez dans 15 minutes.";
  if (typeof code !== "string" || !egal(code, codeAdmin())) {
    const actuel = e && maintenant - e.depuis < FENETRE_MS ? e : { n: 0, depuis: maintenant };
    essais.set(ip, { n: actuel.n + 1, depuis: actuel.depuis });
    return "Code d’accès incorrect.";
  }
  essais.delete(ip);
  const expire = maintenant + DUREE_MS;
  (await cookies()).set(COOKIE, `${expire}.${signer(expire)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_MS / 1000,
  });
  return null;
}

export async function estAdmin(): Promise<boolean> {
  const valeur = (await cookies()).get(COOKIE)?.value;
  if (!valeur) return false;
  const [exp, sig] = valeur.split(".");
  const expire = Number(exp);
  if (!Number.isFinite(expire) || expire < Date.now() || !sig) return false;
  return egal(sig, signer(expire));
}

export async function deconnecterAdmin() {
  (await cookies()).delete(COOKIE);
}
