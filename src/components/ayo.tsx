import Image from "next/image";
import ayo from "../../public/ayo.jpg";

/** Ayo, mascotte des JOJ Dakar 2026 (image fournie par l'équipe). */
export function Ayo({ className = "", priorite = false }: { className?: string; priorite?: boolean }) {
  return (
    <span className={`block overflow-hidden rounded-[2rem] bg-white shadow-lg ring-4 ring-white/70 ${className}`}>
      <Image src={ayo} alt="Ayo, la mascotte des JOJ Dakar 2026" priority={priorite} sizes="(min-width: 640px) 240px, 128px"
        className="h-full w-full object-contain" />
    </span>
  );
}

/** Tête d'Ayo dans un rond (avatar). */
export function AvatarAyo({ className = "", decoratif = true }: { className?: string; decoratif?: boolean }) {
  return (
    <span className={`block shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-soleil ${className}`}>
      <Image src={ayo} alt={decoratif ? "" : "Ayo"} sizes="64px"
        className="h-full w-full scale-[1.9] object-cover object-[50%_18%]" style={{ transformOrigin: "50% 22%" }} />
    </span>
  );
}
