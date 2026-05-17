import { ref } from 'vue'

/**
 * Store léger pour partager les settings entre SettingsView et GameView.
 * Évoluera vers Pinia quand le projet grandira (profil, stats...).
 */
export const gameSettings = ref(null)
