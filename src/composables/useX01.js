import { ref, computed } from 'vue'

/**
 * Logique du mode X01 — saisie fléchette par fléchette, double-out obligatoire.
 *
 * Règles implémentées :
 * - Finish valide : dernier dart de type 'double' OU Bull (50 pts)
 * - Bust si : score résultant < 0 | = 1 | = 0 sans double
 * - Bust annule toute la volée (score revient à la valeur avant la volée)
 *
 * @param {{ startScore: number, legsToWin: number }} settings
 */
export function useX01({ startScore, legsToWin }) {
  // ─── État principal ────────────────────────────────────────────────────────
  const completedLegs = ref([])     // manches terminées
  const volleys       = ref([])     // volées de la manche en cours { darts, bust, score }
  const currentDarts  = ref([])     // fléchettes de la volée en cours (0-2 items)
  const phase         = ref('playing') // 'playing' | 'bust' | 'leg-recap' | 'game-over'

  let _bustTimer = null

  // ─── Calculs ──────────────────────────────────────────────────────────────
  /** Score restant au début de la volée courante (après les volées valides) */
  const legRemaining = computed(() =>
    volleys.value
      .filter(v => !v.bust)
      .reduce((acc, v) => acc - v.score, startScore)
  )

  /** Score restant après les fléchettes déjà lancées dans la volée courante */
  const volleyRemaining = computed(() =>
    currentDarts.value.reduce((acc, d) => acc - d.pts, legRemaining.value)
  )

  /** Valeur affichée (toujours >= 0) */
  const displayRemaining = computed(() => Math.max(0, volleyRemaining.value))

  const legNumber    = computed(() => completedLegs.value.length + 1)
  const volleyNumber = computed(() => volleys.value.length + 1)

  // ─── Helpers ──────────────────────────────────────────────────────────────
  /** Un finish est valide uniquement sur un double ou le bull (50) */
  function isValidCheckout(dart) {
    return dart.type === 'double' || (dart.type === 'bull' && dart.pts === 50)
  }

  function triggerBust(newDarts) {
    clearTimeout(_bustTimer)
    volleys.value.push({ darts: newDarts, bust: true, score: 0 })
    currentDarts.value = []
    phase.value = 'bust'
    _bustTimer = setTimeout(() => {
      if (phase.value === 'bust') phase.value = 'playing'
    }, 900)
  }

  function finishLeg() {
    const totalDarts    = volleys.value.reduce((sum, v) => sum + v.darts.length, 0)
    const checkoutScore = volleys.value[volleys.value.length - 1].score

    completedLegs.value.push({
      volleys:      [...volleys.value],
      totalDarts,
      checkoutScore,
    })

    if (completedLegs.value.length >= legsToWin) {
      phase.value = 'game-over'
    } else {
      phase.value = 'leg-recap'
    }
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  function addDart(dart) {
    if (phase.value !== 'playing') return

    const newDarts  = [...currentDarts.value, dart]
    const volleyPts = newDarts.reduce((sum, d) => sum + d.pts, 0)
    const newRem    = legRemaining.value - volleyPts

    // ── Bust ────────────────────────────────────────────────────────────────
    if (newRem < 0 || newRem === 1) {
      triggerBust(newDarts)
      return
    }

    // ── Checkout ────────────────────────────────────────────────────────────
    if (newRem === 0) {
      if (isValidCheckout(dart)) {
        volleys.value.push({ darts: newDarts, bust: false, score: volleyPts })
        currentDarts.value = []
        finishLeg()
      } else {
        // Zéro sans double → bust
        triggerBust(newDarts)
      }
      return
    }

    // ── Fléchette normale ───────────────────────────────────────────────────
    currentDarts.value = newDarts

    // Volée complète (3 fléchettes)
    if (currentDarts.value.length === 3) {
      const score = currentDarts.value.reduce((sum, d) => sum + d.pts, 0)
      volleys.value.push({ darts: [...currentDarts.value], bust: false, score })
      currentDarts.value = []
    }
  }

  function addMiss() {
    addDart({ pts: 0, type: 'miss', label: 'Miss', sector: null })
  }

  function undo() {
    if (phase.value === 'bust') {
      clearTimeout(_bustTimer)
      volleys.value.pop()
      currentDarts.value = []
      phase.value = 'playing'
      return
    }

    if (currentDarts.value.length > 0) {
      currentDarts.value = currentDarts.value.slice(0, -1)
      return
    }

    if (volleys.value.length > 0) {
      const last = volleys.value.pop()
      // Pour une volée valide : restaurer toutes les fléchettes sauf la dernière
      if (!last.bust) {
        currentDarts.value = last.darts.slice(0, -1)
      }
      // Pour un bust : on repart d'une volée vide
    }
  }

  function startNextLeg() {
    volleys.value    = []
    currentDarts.value = []
    phase.value      = 'playing'
  }

  // ─── Statistiques finales ──────────────────────────────────────────────────
  const stats = computed(() => {
    const legs = completedLegs.value
    if (!legs.length) return null

    // Toutes les volées valides (non bust)
    const validVolleys = legs.flatMap(l => l.volleys.filter(v => !v.bust))
    const volleyScores = validVolleys.map(v => v.score)

    const avgVolley = volleyScores.length
      ? Math.round(volleyScores.reduce((a, b) => a + b, 0) / volleyScores.length)
      : 0

    // 3 premières volées valides par manche (= 9 premières fléchettes)
    const first3Scores = legs.flatMap(l => {
      const valid = l.volleys.filter(v => !v.bust).slice(0, 3).map(v => v.score)
      return valid
    })
    const avg9darts = first3Scores.length
      ? Math.round(first3Scores.reduce((a, b) => a + b, 0) / first3Scores.length)
      : 0

    const dartsPerLeg      = legs.map(l => l.totalDarts)
    const avgDartsToFinish = Math.round(dartsPerLeg.reduce((a, b) => a + b, 0) / dartsPerLeg.length)
    const minDarts         = Math.min(...dartsPerLeg)
    const maxDarts         = Math.max(...dartsPerLeg)

    const highestFinish  = Math.max(...legs.map(l => l.checkoutScore), 0)
    const highestVolley  = volleyScores.length ? Math.max(...volleyScores) : 0

    return { avgVolley, avg9darts, avgDartsToFinish, minDarts, maxDarts, highestFinish, highestVolley }
  })

  return {
    completedLegs,
    volleys,
    currentDarts,
    phase,
    legRemaining,
    volleyRemaining,
    displayRemaining,
    legNumber,
    volleyNumber,
    addDart,
    addMiss,
    undo,
    startNextLeg,
    stats,
  }
}
