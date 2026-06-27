# Mes Droits, Ma Voix

Application web pour ESAT : droits, agenda, comptes-rendus de réunions, ateliers
et messagerie, avec deux types de comptes (administrateur et travailleur).

- **Sans configuration**, l'app tourne en **mode démo** : données en mémoire,
  remises à zéro à chaque rechargement. Parfait pour tester.
- **Avec Supabase configuré**, les données sont **persistées et partagées** entre
  tous les utilisateurs, et les fichiers joints sont stockés en ligne.

## Démarrer en local

```bash
npm install        # (déjà fait dans ce dépôt)
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Comptes de démo : **Jean D.** (travailleur, chef d'atelier) code `1234` ·
**Marie L.** (administratrice) code `2580`.

---

## Passer en « vraie app » : base de données + fichiers (Supabase)

### 1. Créer le projet Supabase
1. Aller sur [supabase.com](https://supabase.com) → **New project** (le palier
   gratuit suffit). Noter le mot de passe de la base.
2. Une fois le projet prêt, ouvrir **SQL Editor** → **New query**, coller tout le
   contenu de [`supabase/schema.sql`](supabase/schema.sql) et cliquer **Run**.
   Cela crée les tables et le bucket de fichiers (aucune donnée n'est insérée :
   l'app se remplit toute seule au premier lancement).

### 2. Récupérer les clés
Dans Supabase → **Project Settings → API** :
- **Project URL** → variable `NEXT_PUBLIC_SUPABASE_URL`
- **Project API keys → `service_role`** (secrète) → variable `SUPABASE_SERVICE_ROLE_KEY`

### 3. En local
```bash
cp .env.local.example .env.local
# puis remplir les deux valeurs dans .env.local
npm run dev
```
Au premier lancement, les données de démo sont copiées dans Supabase. Ensuite,
tout est persisté : rechargez la page, vos comptes-rendus sont toujours là.

---

## Déployer en ligne (Vercel)

1. Pousser ce dépôt sur GitHub.
2. Aller sur [vercel.com/new](https://vercel.com/new), importer le dépôt
   (Vercel détecte Next.js automatiquement).
3. Dans **Environment Variables**, ajouter les deux mêmes variables que ci-dessus :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Cliquer **Deploy**. L'app est en ligne sur une URL `…vercel.app`.

À chaque `git push`, Vercel redéploie automatiquement.

---

## Architecture (en bref)

- **Interface** : Next.js (App Router) + React, état client via Zustand
  (`store/useAppStore.ts`).
- **Persistance** : Server Actions (`app/actions.ts`) qui parlent à Supabase en
  REST (`lib/supabaseRest.ts`). La clé `service_role` reste **uniquement côté
  serveur**. Le store s'hydrate au démarrage et synchronise automatiquement chaque
  changement vers la base.
- **Fichiers** : les pièces jointes des comptes-rendus sont envoyées dans le
  bucket Supabase **attachments** ; seule l'URL publique est stockée.

### Limites connues (pistes d'amélioration)
- Les Server Actions ne vérifient pas encore l'identité de l'appelant (la
  connexion par code à 4 chiffres reste côté client). Pour un usage en
  production sensible, ajouter une vraie session côté serveur.
- Les conversations utilisent un identifiant numérique basé sur l'horodatage ;
  suffisant ici, à renforcer si le volume de messagerie grandit.
