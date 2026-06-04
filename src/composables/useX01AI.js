/**
 * IA adversaire pour le mode X01.
 *
 * Le niveau est défini par deux paramètres réalistes :
 *   - avgVolley     : moyenne de points par volée (3 fléchettes)
 *   - checkoutRate  : probabilité de réussir un checkout quand la cible est accessible
 *
 * La simulation utilise une distribution gaussienne autour de avgVolley pour
 * obtenir des parties naturelles (pas toujours la même volée).
 */

// ─── 10 niveaux de difficulté (interpolation linéaire) ───────────────────────
// Niveau 1 : avgVolley 20, checkout 8%
// Niveau 10 : avgVolley 115, checkout 90%
function _levelLabel(n) {
  if (n <= 2)  return 'Débutant'
  if (n <= 4)  return 'Amateur'
  if (n <= 6)  return 'Intermédiaire'
  if (n <= 8)  return 'Avancé'
  if (n === 9) return 'Expert'
  return 'Pro'
}

export const AI_LEVELS = Array.from({ length: 10 }, (_, i) => {
  const t = i / 9
  return {
    level:        i + 1,
    label:        _levelLabel(i + 1),
    avgVolley:    Math.round(20 + t * 95),
    checkoutRate: Math.round((0.08 + t * 0.82) * 100) / 100,
  }
})

// ─── Checkouts optimaux (score → nb de fléchettes pour finir) ─────────────────
// Table simplifiée : les finishes classiques utilisés pour guider le checkout IA
const CHECKOUT_DARTS = {
  50: 1, 40: 1, 36: 1, 32: 1, 28: 1, 24: 1, 20: 1, 16: 1, 12: 1, 8: 1, 4: 1, 2: 1,
  // 2 fléchettes
  100: 2, 98: 2, 96: 2, 92: 2, 90: 2, 88: 2, 84: 2, 82: 2, 80: 2,
  // 3 fléchettes (valeur par défaut pour tout le reste)
}

function getCheckoutDarts(score) {
  return CHECKOUT_DARTS[score] ?? 3
}

// ─── Distribution gaussienne (Box-Muller) ────────────────────────────────────
function gaussian(mean, stdDev) {
  let u, v
  do {
    u = Math.random()
    v = Math.random()
  } while (u === 0)
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return Math.round(mean + z * stdDev)
}

// ─── Simulation d'une volée IA ───────────────────────────────────────────────
/**
 * Retourne le résultat d'une volée IA.
 * @param {number} remaining  Score restant au début de la volée
 * @param {{ avgVolley: number, checkoutRate: number }} profile
 * @returns {{ score: number, bust: boolean, dartsUsed: number, isCheckout: boolean }}
 */
export function simulateAIVolley(remaining, profile) {
  const stdDev = profile.avgVolley * 0.35  // ~35% de variance → naturel

  // ── Zone de checkout (score ≤ 50 + quelques valeurs hautes courantes) ──────
  if (remaining <= 170) {
    const canCheckout = remaining <= 50 ||
      [60, 66, 70, 74, 76, 80, 81, 82, 84, 85, 86, 87, 88, 90, 92, 94,
       95, 96, 98, 100, 101, 104, 105, 107, 110, 115, 116, 120, 121,
       124, 125, 126, 128, 129, 130, 131, 132, 134, 135, 136, 137, 138,
       139, 140, 141, 144, 148, 150, 151, 160, 161, 164, 167, 170].includes(remaining)

    if (canCheckout && Math.random() < profile.checkoutRate) {
      // Checkout réussi
      return {
        score:      remaining,
        bust:       false,
        dartsUsed:  getCheckoutDarts(remaining),
        isCheckout: true,
      }
    }

    // Checkout raté — l'IA marque une volée partielle (ne dépasse pas remaining - 2)
    // pour rester en vie (éviter bust sur 1 ou dépassement)
    const maxSafe = remaining - 2
    if (maxSafe <= 0) {
      // Ne peut pas scorer sans buster — volée nulle
      return { score: 0, bust: false, dartsUsed: 3, isCheckout: false }
    }

    const raw = Math.abs(gaussian(Math.min(profile.avgVolley * 0.6, maxSafe * 0.7), stdDev * 0.5))
    const clamped = Math.max(0, Math.min(raw, maxSafe))
    return { score: clamped, bust: false, dartsUsed: 3, isCheckout: false }
  }

  // ── Volée normale ────────────────────────────────────────────────────────
  const raw     = gaussian(profile.avgVolley, stdDev)
  const score   = Math.max(0, Math.min(raw, 180))   // bornes physiques
  const newRem  = remaining - score

  // Bust si ça dépasse ou tombe sur 1
  if (newRem < 0 || newRem === 1) {
    return { score: 0, bust: true, dartsUsed: 3, isCheckout: false }
  }

  return { score, bust: false, dartsUsed: 3, isCheckout: false }
}
