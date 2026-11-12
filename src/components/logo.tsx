/** Soleil d'Ayo Guide (décoratif). */
export function Soleil({ className = "", tourne = false }: { className?: string; tourne?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <g className={tourne ? "origin-center animate-rotation-lente" : ""} style={{ transformBox: "fill-box" }}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="19" y="1" width="2" height="7" rx="1" fill="currentColor" transform={`rotate(${i * 30} 20 20)`} />
        ))}
      </g>
      <circle cx="20" cy="20" r="9" fill="currentColor" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <Soleil className="h-8 w-8 text-soleil" tourne />
      <span className="leading-none">
        <span className="block font-display text-xl font-extrabold tracking-tight">Ayo Guide</span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-white/80">JOJ Dakar 2026</span>
      </span>
    </span>
  );
}
