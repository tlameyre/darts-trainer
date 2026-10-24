/**
 * Définition des modes de jeu.
 * Pour ajouter un mode : ajouter un objet ici + les routes dans router/index.js
 * `group` : "train" (s'entraîner) ou "play" (jouer) — sert au regroupement du lobby et de l'accueil.
 * `label` : nom court affiché sur les tuiles de l'accueil et du lobby.
 * `ink` : variante foncée de `color`, lisible en texte sur fond crème.
 */
export const GAME_MODES = [
  {
    id: "score-training",
    label: "Calcul",
    description:
      "Calcule le total de ta volée et entraîne-toi à compter rapidement.",
    color: "#EB6343",
    ink: "#B83D1C",
    icon: "calculator",
    settingsRoute: "score-settings",
    group: "train",
  },
  {
    id: "warmup",
    label: "Échauffement",
    description:
      "Travaille une zone de la cible sur une durée définie et suis ta précision.",
    color: "#1D4ED8",
    ink: "#1D4ED8",
    icon: "dartboard",
    settingsRoute: "warmup-settings",
    group: "train",
  },
  {
    id: "checkout",
    label: "Checkouts",
    description:
      "Révise et teste les combinaisons de finish, de 2 à 170. Flashcards ou quiz noté.",
    color: "#0891B2",
    ink: "#0E7490",
    icon: "checkout",
    settingsRoute: "checkout-settings",
    group: "train",
  },
  {
    id: "x01",
    label: "501",
    description:
      "Descends de 501 (ou 301) à 0 en comptant tes volées. Analyse tes moyennes et tes checkouts.",
    color: "#047857",
    ink: "#047857",
    icon: "dartboard",
    settingsRoute: "x01-settings",
    group: "play",
  },
  {
    id: "x01-online",
    label: "501 en ligne",
    description:
      "Défie un ami à distance : chacun joue sur son appareil, les scores se synchronisent.",
    color: "#B45309",
    ink: "#B45309",
    icon: "globe",
    settingsRoute: "online-settings",
    group: "play",
  },
  {
    id: "tactics",
    label: "Tactics",
    description:
      "Ferme les zones 20 à 12 puis Double, Triple et Bull, le plus vite possible. Façon cricket.",
    color: "#DC2626",
    ink: "#DC2626",
    icon: "cricket-closed",
    settingsRoute: "tactics-settings",
    group: "play",
  },
  {
    id: "tournament",
    label: "Tournoi",
    description:
      "Affronte un groupe de joueurs en bracket à élimination directe ou en championnat par journées, et suis la progression jusqu'au vainqueur.",
    color: "#7C3AED",
    ink: "#7C3AED",
    icon: "trophy",
    settingsRoute: "tournaments",
    group: "play",
  },
];
