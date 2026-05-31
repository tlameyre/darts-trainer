import { ref, computed } from 'vue'

/**
 * Logique du mode X01 (301 / 501 / custom).
 * @param {{ startScore: number, legsToWin: number }} settings
 */
export function useX01({ startScore, legsToWin }) {
  // ─── État ──────────────────────────────────────────────────────────────────
  const completedLegs = ref([])      // legs terminées
  const volleys       = ref([])      // volées de la manche courante : { score, bust, darts }
  const phase         = ref('playing') // 'playing' | 'checkout-darts' | 'leg-recap' | 'game-over'
  const inputStr      = ref('')

  // ─── Calculs courants ──────────────────────────────────────────────────────
  const legNumber = computed(() => completedLegs.value.length + 1)

  const remaining = computed(() =>
    volleys.value
      .filter(v => !v.bust)
      .reduce((acc, v) => acc - v.score, startScore)
  )

  const currentVolleyNumber = computed(() =>
    volleys.value.length + 1
  )

  const inputValue = computed(() =>
    inputStr.value === '' ? null : Number(inputStr.value)
  )

  // ─── Saisie clavier ────────────────────────────────────────────────────────
  function addDigit(d) {
    if (inputStr.value.length >= 3) return
    const next = inputStr.value + String(d)
    if (Number(next) > 180) return
    inputStr.value = next
  }

  function removeDigit() {
    inputStr.value = inputStr.value.slice(0, -1)
  }

  // ─── Actions de jeu ────────────────────────────────────────────────────────
  function confirmVolley() {
    if (inputValue.value === null) return
    const score = inputValue.value
    inputStr.value = ''

    if (score > remaining.value) {
      // Bust automatique (trop haut)
      volleys.value.push({ score, bust: true, darts: 3 })
      return
    }

    if (score === remaining.value) {
      // Checkout !
      volleys.value.push({ score, bust: false, darts: 3 })
      phase.value = 'checkout-darts'
      return
    }

    volleys.value.push({ score, bust: false, darts: 3 })
  }

  function bustDirect() {
    inputStr.value = ''
    volleys.value.push({ score: 0, bust: true, darts: 3 })
  }

  function undoLast() {
    if (volleys.value.length === 0) return
    const last = volleys.value[volleys.value.length - 1]
    // Si on était en checkout-darts, revenir au jeu
    if (phase.value === 'checkout-darts') phase.value = 'playing'
    volleys.value.pop()
    inputStr.value = ''
    // Restaurer la valeur de la dernière volée dans l'input si elle n'est pas un bust direct
    if (last && !last.bust) inputStr.value = String(last.score)
  }

  /** Appelé depuis le modal « combien de fléchettes pour le finish ? » */
  function confirmCheckout(darts) {
    // Mettre à jour le nombre de fléchettes de la dernière volée (checkout)
    volleys.value[volleys.value.length - 1].darts = darts

    // Total de fléchettes pour cette manche
    const totalDarts    = volleys.value.reduce((acc, v) => acc + v.darts, 0)
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

  function startNextLeg() {
    volleys.value = []
    inputStr.value = ''
    phase.value = 'playing'
  }

  // ─── Statistiques finales ──────────────────────────────────────────────────
  const stats = computed(() => {
    const legs = completedLegs.value
    if (!legs.length) return null

    // Toutes les volées valides (non bust)
    const allValid = legs.flatMap(l => l.volleys.filter(v => !v.bust).map(v => v.score))

    const avgVolley = allValid.length
      ? Math.round(allValid.reduce((a, b) => a + b, 0) / allValid.length)
      : 0

    // Moyenne des 3 premières volées valides par manche (= 9 premières fléchettes)
    const first3 = legs.flatMap(l => {
      let count = 0
      const res = []
      for (const v of l.volleys) {
        if (count >= 3) break
        if (!v.bust) { res.push(v.score); count++ }
      }
      return res
    })
    const avg9darts = first3.length
      ? Math.round(first3.reduce((a, b) => a + b, 0) / first3.length)
      : 0

    // Fléchettes par manche
    const dartsPerLeg      = legs.map(l => l.totalDarts)
    const avgDartsToFinish = Math.round(dartsPerLeg.reduce((a, b) => a + b, 0) / dartsPerLeg.length)
    const minDarts         = Math.min(...dartsPerLeg)
    const maxDarts         = Math.max(...dartsPerLeg)

    // Checkouts
    const checkouts    = legs.map(l => l.checkoutScore)
    const highestFinish = Math.max(...checkouts, 0)

    // Volée la plus haute
    const highestVolley = allValid.length ? Math.max(...allValid) : 0

    return {
      avgVolley,
      avg9darts,
      avgDartsToFinish,
      minDarts,
      maxDarts,
      highestFinish,
      highestVolley,
    }
  })

  return {
    completedLegs,
    volleys,
    phase,
    remaining,
    legNumber,
    currentVolleyNumber,
    inputStr,
    inputValue,
    addDigit,
    removeDigit,
    confirmVolley,
    bustDirect,
    undoLast,
    confirmCheckout,
    startNextLeg,
    stats,
  }
}
