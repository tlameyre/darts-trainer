import { ref, computed, watch } from 'vue'
import { simulateAIVolley } from './useX01AI.js'

/**
 * Gère l'état et la logique du bot IA dans une partie X01.
 *
 * @param {object} options
 * @param {object} options.aiProfile    - Profil IA (null = pas de bot)
 * @param {object} options.settings     - { startScore, legsToWin }
 * @param {import('vue').Ref} options.volleys
 * @param {import('vue').Ref} options.phase
 * @param {import('vue').Ref} options.legRemaining
 * @param {import('vue').Ref} options.pendingDoublesPrompt
 * @param {import('vue').Ref} options.pendingCheckout
 * @param {Function} options.startNextLeg
 */
export function useX01AIOpponent({
  aiProfile,
  settings,
  volleys,
  phase,
  legRemaining,
  pendingDoublesPrompt,
  pendingCheckout,
  startNextLeg,
}) {
  if (!aiProfile) {
    // Mode solo — on expose des valeurs neutres
    return {
      aiRemaining:      ref(settings.startScore),
      aiLegsWon:        ref(0),
      aiLastVolley:     ref(null),
      aiTurn:           ref(false),
      aiWonLeg:         ref(false),
      aiWonGame:        ref(false),
      aiTotalDarts:     ref(0),
      aiAvgVolley:      computed(() => '–'),
      aiLegHumanSnapshot: ref(null),
      aiLegs:           ref([]),
      aiLevel:          computed(() => null),
      aiCardData:       computed(() => null),
      handleAILegContinue: () => {},
    }
  }

  const aiRemaining        = ref(settings.startScore)
  const aiLegsWon          = ref(0)
  const aiLastVolley       = ref(null)
  const aiTurn             = ref(false)
  const aiPending          = ref(false)
  const aiWonLeg           = ref(false)
  const aiWonGame          = ref(false)
  const aiTotalDarts       = ref(0)
  const aiVolleysScores    = ref([])
  const aiLegHumanSnapshot = ref(null)
  // Closed legs { volleys, won, checkoutScore } + volleys of the leg in progress
  const aiLegs             = ref([])
  const aiCurrentVolleys   = ref([])
  let _aiTimer             = null

  const aiLevel = computed(() => aiProfile.level ?? null)

  const aiAvgVolley = computed(() => {
    if (!aiVolleysScores.value.length) return '–'
    const sum = aiVolleysScores.value.reduce((a, b) => a + b, 0)
    return (sum / aiVolleysScores.value.length).toFixed(2)
  })

  function triggerAIVolley() {
    aiTurn.value    = true
    aiPending.value = false
    clearTimeout(_aiTimer)
    _aiTimer = setTimeout(() => {
      const result = simulateAIVolley(aiRemaining.value, aiProfile)
      aiLastVolley.value = result

      aiTotalDarts.value += result.dartsUsed
      aiVolleysScores.value.push(result.bust ? 0 : result.score)
      aiCurrentVolleys.value.push({ score: result.score, bust: result.bust, darts: result.dartsUsed })

      if (result.isCheckout) {
        aiRemaining.value = 0
        aiLegsWon.value  += 1
        aiTurn.value      = false
        closeAILeg(true, result.score)

        aiLegHumanSnapshot.value = {
          volleys:   [...volleys.value],
          remaining: legRemaining.value,
        }

        if (aiLegsWon.value >= settings.legsToWin) {
          aiWonGame.value = true
          phase.value     = 'game-over'
        } else {
          aiWonLeg.value  = true
        }
      } else {
        aiRemaining.value = Math.max(0, aiRemaining.value - result.score)
        aiTurn.value      = false
      }
    }, 900)
  }

  function closeAILeg(won, checkoutScore = null) {
    aiLegs.value.push({ volleys: aiCurrentVolleys.value, won, checkoutScore })
    aiCurrentVolleys.value = []
  }

  function handleAILegContinue() {
    aiWonLeg.value           = false
    aiLegHumanSnapshot.value = null
    aiRemaining.value        = settings.startScore
    startNextLeg()
  }

  // Joue après chaque volée humaine
  watch(() => volleys.value.length, (newLen, oldLen) => {
    if (newLen <= oldLen) return
    if (phase.value === 'leg-recap' || phase.value === 'game-over') return

    if (phase.value === 'bust' || pendingDoublesPrompt.value || pendingCheckout.value) {
      aiPending.value = true
      return
    }
    triggerAIVolley()
  })

  // Leg won by the human, or game ended from the menu while the leg was in progress
  watch(phase, (val) => {
    if ((val === 'leg-recap' || val === 'game-over') && !aiWonGame.value) closeAILeg(false)
  })

  // Reprend après fin du bust
  watch(phase, (val, old) => {
    if (val === 'playing' && old === 'bust' && aiPending.value) {
      if (pendingDoublesPrompt.value || pendingCheckout.value) return
      triggerAIVolley()
    }
  })

  // Reprend après fermeture modale doubles
  watch(pendingDoublesPrompt, (val) => {
    if (val) return
    if (aiPending.value && phase.value === 'playing') triggerAIVolley()
  })

  // Reprend après fermeture modale checkout
  watch(pendingCheckout, (val) => {
    if (val) return
    if (aiPending.value && phase.value === 'playing') triggerAIVolley()
  })

  const aiCardData = computed(() => ({
    profileLabel: aiProfile.label ?? '',
    level:        aiLevel.value,
    remaining:    aiRemaining.value,
    legsWon:      aiLegsWon.value,
    legsToWin:    settings.legsToWin,
    lastScore:    aiLastVolley.value?.isCheckout
      ? aiLastVolley.value.score
      : (aiLastVolley.value?.bust ? null : aiLastVolley.value?.score ?? null),
    avgVolley:    aiAvgVolley.value,
    totalDarts:   aiTotalDarts.value,
    isThinking:   aiTurn.value,
  }))

  return {
    aiRemaining,
    aiLegsWon,
    aiLastVolley,
    aiTurn,
    aiWonLeg,
    aiWonGame,
    aiTotalDarts,
    aiAvgVolley,
    aiVolleysScores,
    aiLegHumanSnapshot,
    aiLegs,
    aiLevel,
    aiCardData,
    handleAILegContinue,
  }
}
