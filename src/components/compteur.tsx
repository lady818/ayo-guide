"use client";
import { useEffect, useState } from "react";
import { formatDuree } from "@/lib/guide";

/** Durée qui défile de 0 à sa valeur (instantané si « réduire les animations »). */
export function DureeAnimee({ minutes }: { minutes: number }) {
  const [valeur, setValeur] = useState(minutes);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const debut = performance.now();
    const duree = 900;
    const etape = (t: number) => {
      const p = Math.min(1, (t - debut) / duree);
      setValeur(Math.max(1, Math.round(minutes * (1 - Math.pow(1 - p, 3)))));
      if (p < 1) raf = requestAnimationFrame(etape);
    };
    raf = requestAnimationFrame(etape);
    return () => cancelAnimationFrame(raf);
  }, [minutes]);
  return (
    <>
      <span aria-hidden="true">{formatDuree(valeur)}</span>
      <span className="sr-only">{formatDuree(minutes)}</span>
    </>
  );
}
