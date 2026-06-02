# Darts Math Counter — Instructions Claude

## Stack

- **Vue 3** avec `<script setup>` + Composition API (pas d'Options API)
- **Vue Router 5** — historique `createWebHistory`, base `/darts-trainer/`
- **Pinia** — gestion d'état, tous les stores utilisent la setup syntax (`defineStore` avec une fonction)
- **Supabase** (`@supabase/supabase-js`) — auth + base de données + RLS
- **SCSS** — variables globales dans `src/styles/_variables.scss`, mixins disponibles partout
- **Vite** — pas de TypeScript, tout en `.js` / `.vue`

## Structure du projet

```
src/
  components/        # Composants réutilisables (ex: AppButton, AppIcon, AppModal)
    x01/             # Sous-composants spécifiques au jeu X01
    badges/          # Sous-composants spécifiques aux badges
  views/             # Pages entières, une par route
  store/             # État global : authStore.js, dbStore.js, badgeStore.js, gameStore.js
  composables/       # Logique réutilisable : useX01.js, useWarmup.js, useDarts.js
  data/              # Données statiques : badges.js, gameModes.js
  lib/               # Clients externes : supabase.js
  styles/            # SCSS global : _variables.scss, _fonts.scss, _base.scss, _reset.scss
  router/index.js    # Définition des routes + guard d'auth
```

## Conventions de code

- **Langue** : les commentaires et les noms de variables/fonctions sont en **anglais**
- **SCSS** : BEM pour les classes (`.block__element--modifier`), styles `scoped` dans les composants
- **Icônes** : toujours via `<AppIcon name="..." />` — les icônes sont définies dans `AppIconDefs.vue` avec `fill="currentColor"`, uniquement Font Awesome Free
- **Composants** : découper en sous-composants dès qu'une section est significative ou réutilisable
- **Imports** : chemins relatifs explicites (pas d'alias `@`)

## SCSS — variables, typographie et responsive

Toutes les variables et mixins sont disponibles globalement dans les `<style scoped>` (injectés via `vite.config.js`). Ne jamais définir de valeurs brutes pour les couleurs, espacements, tailles de police ou rayons — utiliser exclusivement les variables de `_variables.scss`.

### Variables disponibles

```scss
// Couleurs
$bg, $orange, $accent, $error, $muted, $text-color, $white, $blue ...

// Espacements (padding et gap)
$padding-xxs / xs / sm / md / lg / xl / xxl
$gap-xxs / xs / sm / md / lg / xl / xxl

// Rayons
$radius-sm / md / lg / pill

// Bordures
$border-sm / md / lg
```

### Typographie — mixins obligatoires

Ne jamais écrire `font-size`, `font-weight` ou `font-family` directement. Utiliser les mixins de `_fonts.scss` :

```scss
// Corps de texte (Outfit light)
@include text-xxs / xs / sm / md / lg / xl / xxl

// Titres (Outfit semibold)
@include title-xxs / xs / sm / md / lg / xl / xxl / xxxl

// Grands affichages (scores, chiffres)
@include display-xs / sm / md / lg / xl
```

### Responsive — media queries

Les breakpoints sont définis dans `_variables.scss` :

```scss
$bp-mobile: 480px;
$bp-tablet: 768px;
$bp-laptop: 1025px;
$bp-desktop: 1280px;
```

Toujours utiliser ces variables dans les media queries, jamais de valeurs brutes :

```scss
// ✅ correct
@media (min-width: $bp-laptop) {
  .block { @include title-lg; }
}

// ❌ interdit
@media (min-width: 1024px) {
  .block { font-size: 18px; }
}
```

Le responsive est **mobile-first** : styles de base pour mobile, overrides dans `@media (min-width: $bp-laptop)`. Les media queries sont placées à la fin du bloc `<style scoped>`, regroupées en un seul bloc par breakpoint.

## Store et données

Tous les stores utilisent Pinia avec la **setup syntax**. Dans les composants, toujours appeler `useXxxStore()` dans `<script setup>`, jamais en dehors.

- `useAuthStore` — `user`, `profile`, `isAuth`, `loading` + fonctions auth Supabase
- `useDbStore` — toutes les requêtes Supabase (fetch/save), jamais dans les vues directement
- `useBadgeStore` — logique de déblocage des badges
- `useGameStore` — état de la partie en cours (`gameSettings`)

Le router est une exception : Pinia n'est pas disponible au top-level du fichier, donc `useXxxStore()` est appelé **dans** `beforeEach`.

## Supabase / BDD

- RLS activée sur toutes les tables — chaque policy utilise `auth.uid()`
- Schéma de référence dans `supabase_schema.sql` à la racine
- Pour toute nouvelle table, ajouter le SQL correspondant dans `supabase_schema.sql`
- Les requêtes Supabase vont dans `dbStore.js`, pas dans les composants

## Routing

- Routes protégées par défaut — `meta: { public: true }` pour les routes publiques
- `meta: { hideNav: true }` pour masquer la BottomNav (vues de jeu)
- La BottomNav a 4 onglets : Accueil (`/`), Jouer (`/play`), Stats (`/stats`), Profil (`/profile`)

## Git

- Committer après chaque tâche terminée avec un message clair
- Ne **jamais** pusher sans demande explicite de l'utilisateur

## Ce qu'il ne faut pas faire

- Ne pas utiliser l'Options API Vue
- Ne pas utiliser `storeToRefs` ou déstructurer directement un store Pinia (perd la réactivité) — accéder via `store.prop`
- Ne pas créer de fichiers TypeScript
- Ne pas utiliser d'alias `@` pour les imports
- Ne pas installer de librairies sans en discuter d'abord
- Ne pas laisser de code mort, d'imports inutilisés, de variables non utilisées
- Ne pas ajouter de commentaires évidents — seulement quand le "pourquoi" est non-évident
