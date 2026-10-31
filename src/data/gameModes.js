/**
 * Définition des modes de jeu.
 * Pour ajouter un mode : ajouter un objet ici + les routes dans router/index.js
 * `group` : "train" (s'entraîner) ou "play" (jouer) — sert au regroupement du lobby et de l'accueil.
 * `description` : une phrase pour le catalogue de la page Jouer.
 * `players` : liste parmi "solo" | "multi" | "online" — filtres de la page Jouer.
 * `label` : nom court affiché sur les tuiles de l'accueil et du lobby.
 * `ink` : variante foncée de `color`, lisible en texte sur fond crème.
 */
export const GAME_MODES = [
  {
    id: "score-training",
    label: "Calcul",
    color: "#EB6343",
    ink: "#B83D1C",
    icon: "calculator",
    settingsRoute: "score-settings",
    description: "Compte le total de ta volée, de plus en plus vite.",
    players: ["solo"],
    group: "train",
  },
  {
    id: "warmup",
    label: "Échauffement",
    color: "#1D4ED8",
    ink: "#1D4ED8",
    icon: "dartboard",
    settingsRoute: "warmup-settings",
    description: "Travaille une zone de la cible et suis ta précision.",
    players: ["solo"],
    group: "train",
  },
  {
    id: "checkout",
    label: "Checkouts",
    color: "#0891B2",
    ink: "#0E7490",
    icon: "checkout",
    settingsRoute: "checkout-settings",
    description: "Trouve la route de chaque score, en révision ou en quiz.",
    players: ["solo"],
    group: "train",
  },
  {
    id: "x01",
    label: "501",
    color: "#047857",
    ink: "#047857",
    icon: "dartboard",
    settingsRoute: "x01-settings",
    description: "Du 101 au 501, contre tes amis ou un DartBot.",
    players: ["multi"],
    group: "play",
  },
  {
    id: "x01-online",
    label: "501 en ligne",
    color: "#BE185D",
    ink: "#BE185D",
    icon: "globe",
    settingsRoute: "online-settings",
    description: "Défie un ami à distance, chacun sur son appareil.",
    players: ["online"],
    group: "play",
  },
  {
    id: "tactics",
    label: "Tactics",
    color: "#DC2626",
    ink: "#DC2626",
    icon: "cricket-closed",
    settingsRoute: "tactics-settings",
    description: "Ferme les zones 20 à 12 avant les autres.",
    players: ["multi"],
    group: "play",
  },
  {
    id: "tournament",
    label: "Tournoi",
    color: "#7C3AED",
    ink: "#7C3AED",
    icon: "trophy",
    settingsRoute: "tournaments",
    description: "Ligue ou coupe entre amis.",
    players: ["multi", "online"],
    group: "play",
  },
];
