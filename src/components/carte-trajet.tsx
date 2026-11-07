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
      const arr = L.circleMarker([arrivee.lat, arrivee.lng], { radius: 10, color: "#047857", fillOpacity: 0.9 })
        .addTo(carte).bindTooltip(arrivee.nom, { permanent: true, direction: "top" });
      if (depart) {
        L.circleMarker([depart.lat, depart.lng], { radius: 9, color: "#d97706", fillOpacity: 0.9 })
          .addTo(carte).bindTooltip(`Départ : ${depart.nom}`, { permanent: true, direction: "bottom" });
        const ligne = L.polyline([[depart.lat, depart.lng], [arrivee.lat, arrivee.lng]], { color: "#047857", dashArray: "8 6", weight: 4 }).addTo(carte);
        carte.fitBounds(ligne.getBounds(), { padding: [50, 50] });
      } else {
        carte.setView(arr.getLatLng(), 14);
      }
    });
    return () => {
      annule = true;
      carte?.remove();
    };
  }, [depart, arrivee]);
  return <div ref={ref} className="h-80 w-full overflow-hidden rounded-xl border border-stone-200" />;
}
