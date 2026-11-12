import type { Metadata } from "next";
import { AvatarAyo } from "@/components/ayo";
import { FormQuestion } from "./formulaire";

export const metadata: Metadata = { title: "Demander" };

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="flex items-start gap-4 animate-apparition">
        <AvatarAyo className="ayo-entree ayo-salut h-20 w-20 shadow-lg" />
        <div>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">Demandez à <span className="text-terre">Ayo</span></h1>
          <p className="mt-1 text-gris">Dites ce que vous cherchez, avec vos mots. L’assistant choisit jusqu’à 3 animations du jour pour vous.</p>
        </div>
      </section>
      <FormQuestion />
    </div>
  );
}
