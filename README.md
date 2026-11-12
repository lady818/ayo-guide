# Guide JOJ Dakar 2026

« Qu’est-ce que je peux faire maintenant, où, et comment y aller ? »

## Lancer

```bash
pnpm install
cp .env.example .env.local   # renseigner ADMIN_CODE (8+ caractères) et ANTHROPIC_API_KEY
pnpm dev                     # http://localhost:3000
pnpm test                    # règles du PRD (Vitest)
```

Base PostgreSQL (`DATABASE_URL`) : tables créées au premier appel, avec les sites connus et un
extrait de programme de démonstration (même journée type chaque jour des Jeux). En local, la base
`guide_joj` du conteneur Docker de Budgety ; les tests utilisent `guide_joj_test`.

## En ligne

https://guide-joj-dakar.vercel.app — Vercel (projet `guide-joj-dakar`) + base Neon.
Mise à jour : `npx vercel deploy --prod`. Variables de production : `ADMIN_CODE`, `ANTHROPIC_API_KEY`,
`DATABASE_URL` (ajoutée par l’intégration Neon). Questions à l’IA limitées à 10 / 10 min par
personne et 500 / jour au total.

## Tranches

| | Écran | Règles |
|---|---|---|
| TR1 | `/` agenda du jour, filtre « en cours à » / « en cours maintenant » | début inclus, fin exclue ; heures de Dakar (UTC+0) |
| TR2 | `/admin` : import JSON du programme | code d’accès (cookie signé 8 h, 5 essais / 15 min) ; fin ≤ début ou hors 31/10–13/11/2026 écartée (aussi `CHECK` en base) ; lieu inconnu écarté ; réimport sans doublon |
| TR3 | `/admin` : bouton « Retirer » | code requis ; une animation retirée disparaît de toutes les lectures publiques |
| TR4 | `/animations/[id]` : carte OpenStreetMap + temps à pied / en voiture | départ parmi les sites connus, sinon refusé ; estimation distance × 1,3, 5 km/h et 35 km/h |
| TR5 | `/demander` : question → 3 animations max expliquées par Claude | question vide refusée ; seules les animations actives du jour encore à venir sont proposées, ids vérifiés côté serveur |

Format d’import : `[{ "titre", "description", "debut": "2026-11-07T14:00", "fin": "2026-11-07T16:00", "lieu": "Plage de Saly" }]`.

## Limites connues
- Le droit de reprendre le programme officiel reste à vérifier (risque du PRD) ; les données de démo sont fictives.
- Tracé de carte indicatif (ligne droite), pas un calcul d’itinéraire routier.
