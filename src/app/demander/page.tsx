import type { Metadata } from "next";
import { Soleil } from "@/components/logo";
import { FormQuestion } from "./formulaire";

export const metadata: Metadata = { title: "Demander" };

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="flex items-start gap-4 animate-apparition">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-baobab shadow-md">
          <Soleil className="h-9 w-9 text-soleil" tourne />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold leading-tight">Demandez à Ayo</h1>
          <p className="mt-1 text-gris">Dites ce que vous cherchez, avec vos mots. L’assistant choisit jusqu’à 3 animations du jour pour vous.</p>
        </div>
      </section>
      <FormQuestion />
    </div>
  );
}
