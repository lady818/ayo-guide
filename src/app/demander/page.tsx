import { FormQuestion } from "./formulaire";

export default function Page() {
  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold">Posez votre question</h1>
        <p className="text-stone-600">Ex. : « J’ai 3 heures à Diamniadio avec mes enfants, que faire ? »</p>
      </section>
      <FormQuestion />
    </div>
  );
}
