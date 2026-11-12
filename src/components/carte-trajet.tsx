"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Point = { nom: string; lat: number; lng: number };

export function CarteTrajet({ depart, arrivee }: { depart?: Point; arrivee: Point }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let carte: import("leaflet").Map | undefined;
    let annule = false;
    import("leaflet").then((L) => {
      if (annule || !ref.current) return;
      carte = L.map(ref.current, { scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "© OpenStreetMap",
      }).addTo(carte);
      L.circleMarker([arrivee.lat, arrivee.lng], { radius: 10, color: "#0f5132", fill: false, className: "marqueur-pulse", interactive: false }).addTo(carte);
      const arr = L.circleMarker([arrivee.lat, arrivee.lng], { radius: 10, color: "#ffffff", weight: 3, fillColor: "#0f5132", fillOpacity: 1 })
        .addTo(carte).bindTooltip(arrivee.nom, { permanent: true, direction: "top" });
      if (depart) {
        L.circleMarker([depart.lat, depart.lng], { radius: 9, color: "#ffffff", weight: 3, fillColor: "#b43c0a", fillOpacity: 1 })
          .addTo(carte).bindTooltip("Départ", { permanent: true, direction: "right", offset: [10, 0] });
        const ligne = L.polyline([[depart.lat, depart.lng], [arrivee.lat, arrivee.lng]], { color: "#0f5132", weight: 5, className: "trace-trajet", lineCap: "round" }).addTo(carte);
        carte.setView([arrivee.lat, arrivee.lng], 14);
        carte.flyToBounds(ligne.getBounds(), { padding: [50, 50], duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1.2 });
      } else {
        carte.setView(arr.getLatLng(), 14);
      }
    });
    return () => {
      annule = true;
      carte?.remove();
    };
  }, [depart, arrivee]);
  return <div ref={ref} role="img" aria-label={depart ? `Carte du trajet de ${depart.nom} à ${arrivee.nom}` : `Carte : ${arrivee.nom}`} className="h-72 w-full overflow-hidden rounded-2xl border border-sable-fonce shadow-sm sm:h-96" />;
}
