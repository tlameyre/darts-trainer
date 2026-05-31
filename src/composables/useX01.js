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
  const completedLegs        = ref([])      // manches terminées
  const volleys              = ref([])      // volées de la manche en cours { darts, bust, score, doublesAttempted?, dartsToFinish?, doublesThrown? }
  const currentDarts         = ref([])      // fléchettes de la volée en cours (0-3 items)
  const phase                = ref('playing') // 'playing' | 'bust' | 'leg-recap' | 'game-over'
  const volleyCompleting     = ref(false)   // true pendant les 700ms après la 3e fléchette
  const pendingDoublesPrompt = ref(false)   // true → modal doubles tentés (volée non-checkout)
  const pendingCheckout      = ref(null)    // { defaultDarts, checkoutScore } → modal checkout

  let _bustTimer     = null
  let _completeTimer = null

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

  function triggerBust(newDarts, wasInCheckoutZone = false) {
    clearTimeout(_bustTimer)
    volleys.value.push({ darts: newDarts, bust: true, score: 0 })
    currentDarts.value = []
    phase.value = 'bust'
    _bustTimer = setTimeout(() => {
      if (phase.value === 'bust') phase.value = 'playing'
      // Demander le nombre de doubles tentés si on était en zone de checkout
      if (wasInCheckoutZone) pendingDoublesPrompt.value = true
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
    if (phase.value !== 'playing' || volleyCompleting.value) return

    // Capturer le score avant la volée pour savoir si on était en zone de checkout
    const remainingAtStart = legRemaining.value
    const inCheckoutZone   = remainingAtStart <= 50

    const newDarts  = [...currentDarts.value, dart]
    const volleyPts = newDarts.reduce((sum, d) => sum + d.pts, 0)
    const newRem    = remainingAtStart - volleyPts

    // ── Bust ────────────────────────────────────────────────────────────────
    if (newRem < 0 || newRem === 1) {
      triggerBust(newDarts, inCheckoutZone)
      return
    }

    // ── Checkout ────────────────────────────────────────────────────────────
    if (newRem === 0) {
      if (isValidCheckout(dart)) {
        // Afficher la fléchette 700ms, puis ouvrir la modale checkout
        currentDarts.value = newDarts
        volleyCompleting.value = true
        const score = volleyPts
        const darts = [...newDarts]
        clearTimeout(_completeTimer)
        _completeTimer = setTimeout(() => {
          volleys.value.push({ darts, bust: false, score })
          currentDarts.value = []
          volleyCompleting.value = false
          // Ouvrir la modale avec le nombre de fléchettes pré-rempli
          pendingCheckout.value = { defaultDarts: darts.length, checkoutScore: score }
        }, 700)
      } else {
        // Zéro sans double → bust
        triggerBust(newDarts, inCheckoutZone)
      }
      return
    }

    // ── Fléchette normale ───────────────────────────────────────────────────
    currentDarts.value = newDarts

    // Volée complète (3 fléchettes) : délai avant soustraction, comme le warmup
    if (currentDarts.value.length === 3) {
      volleyCompleting.value = true
      const score = currentDarts.value.reduce((sum, d) => sum + d.pts, 0)
      const darts = [...currentDarts.value]
      clearTimeout(_completeTimer)
      _completeTimer = setTimeout(() => {
        volleys.value.push({ darts, bust: false, score })
        currentDarts.value = []
        volleyCompleting.value = false
        // Demander le nombre de doubles tentés si on était en zone de checkout
        if (inCheckoutZone) pendingDoublesPrompt.value = true
      }, 700)
    }
  }

  // ─── Mode volée totale ────────────────────────────────────────────────────
  /** Saisie du total d'une volée d'un coup (mode simplifié) */
  function confirmVolleyTotal(total) {
    if (phase.value !== 'playing' || volleyCompleting.value) return

    const remainingAtStart = legRemaining.value
    const inCheckoutZone   = remainingAtStart <= 50
    const newRem           = remainingAtStart - total
    const syntheticDart    = { pts: total, type: 'volley', label: String(total), sector: null }

    if (newRem < 0 || newRem === 1) {
      triggerBust([syntheticDart], inCheckoutZone)
      return
    }

    if (newRem === 0) {
      // Score exact → checkout possible, ouvrir la modale
      currentDarts.value     = [syntheticDart]
      volleyCompleting.value = true
      clearTimeout(_completeTimer)
      _completeTimer = setTimeout(() => {
        volleys.value.push({ darts: [syntheticDart], bust: false, score: total })
        currentDarts.value     = []
        volleyCompleting.value = false
        pendingCheckout.value  = { defaultDarts: 1, checkoutScore: total }
      }, 700)
      return
    }

    // Volée normale
    currentDarts.value     = [syntheticDart]
    volleyCompleting.value = true
    clearTimeout(_completeTimer)
    _completeTimer = setTimeout(() => {
      volleys.value.push({ darts: [syntheticDart], bust: false, score: total })
      currentDarts.value     = []
      volleyCompleting.value = false
      if (inCheckoutZone) pendingDoublesPrompt.value = true
    }, 700)
  }

  /** Bust explicite (mode volée totale) */
  function bustVolley() {
    if (phase.value !== 'playing' || volleyCompleting.value) return
    const inCheckoutZone = legRemaining.value <= 50
    triggerBust([{ pts: 0, type: 'miss', label: 'Bust', sector: null }], inCheckoutZone)
  }

  /** Enregistre le nombre de doubles tentés sur la dernière volée (hors checkout) */
  function confirmDoublesAttempted(n) {
    if (volleys.value.length > 0) {
      const last = volleys.value[volleys.value.length - 1]
      volleys.value[volleys.value.length - 1] = { ...last, doublesAttempted: n }
    }
    pendingDoublesPrompt.value = false
  }

  /** Confirmation checkout : enregistre les données puis termine la manche */
  function confirmCheckout({ dartsToFinish, doublesThrown }) {
    if (volleys.value.length > 0) {
      const last = volleys.value[volleys.value.length - 1]
      volleys.value[volleys.value.length - 1] = { ...last, dartsToFinish, doublesThrown }
    }
    pendingCheckout.value = null
    finishLeg()
  }

  function addMiss() {
    addDart({ pts: 0, type: 'miss', label: 'Miss', sector: null })
  }

  function undo() {
    if (volleyCompleting.value) {
      // Annuler pendant le délai de fin de volée
      clearTimeout(_completeTimer)
      volleyCompleting.value = false
      currentDarts.value = currentDarts.value.slice(0, -1)
      return
    }

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
    clearTimeout(_completeTimer)
    clearTimeout(_bustTimer)
    volleys.value              = []
    currentDarts.value         = []
    volleyCompleting.value     = false
    pendingDoublesPrompt.value = false
    pendingCheckout.value      = null
    phase.value                = 'playing'
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
    volleyCompleting,
    pendingDoublesPrompt,
    pendingCheckout,
    legRemaining,
    legNumber,
    volleyNumber,
    addDart,
    addMiss,
    undo,
    confirmVolleyTotal,
    bustVolley,
    confirmDoublesAttempted,
    confirmCheckout,
    startNextLeg,
    stats,
  }
}
