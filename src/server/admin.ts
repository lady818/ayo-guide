import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "./db";
import { consommerEssai, effacerEssais } from "./guide";

const COOKIE = "guide_admin";
const DUREE_MS = 8 * 60 * 60 * 1000;
const MAX_ESSAIS = 5;
const FENETRE_MS = 15 * 60 * 1000;

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
  const cle = `admin:${await adresseIp()}`;
  const base = await db();
  if (!(await consommerEssai(base, cle, MAX_ESSAIS, FENETRE_MS))) return "Trop d’essais. Réessayez dans 15 minutes.";
  if (typeof code !== "string" || !egal(code, codeAdmin())) return "Code d’accès incorrect.";
  await effacerEssais(base, cle);
  const expire = Date.now() + DUREE_MS;
  (await cookies()).set(COOKIE, `${expire}.${signer(expire)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_MS / 1000,
  });
  return null;
}

export async function adresseIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
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
