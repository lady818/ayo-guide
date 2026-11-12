"use client";
import { useEffect } from "react";

/** Fait défiler la barre des jours jusqu'au jour choisi. */
export function CentrerJour({ jour }: { jour: string }) {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-jour="${jour}"]`);
    const barre = el?.closest("ul");
    if (el && barre) barre.scrollLeft = el.offsetLeft - barre.clientWidth / 2 + el.clientWidth / 2;
  }, [jour]);
  return null;
}
