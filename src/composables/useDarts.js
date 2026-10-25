import { ref, computed } from 'vue'

export function useDarts({ difficulty, maxQuestions, timeLimit, doubleValidation }) {
  // Meilleure série de la session en cours (non persisté — l'historique est dans Supabase)
  const best = ref(0)

  // --- Game state ---
  const streak        = ref(0)
  const questionIndex = ref(0)
  const correctCount  = ref(0)
  const gameOver      = ref(false)

  // --- Round state ---
  const currentScore  = ref(0)
  const currentVolee  = ref([])
  const inputValue    = ref('')
  const feedbackState = ref(null) // null | 'correct' | 'wrong' | 'timeout'
  const answered      = ref(false)

  // Phase 1 = deviner le total de la volée
  // Phase 2 = deviner le score restant (currentScore - volée)
  const phase         = ref(1)
  const voleeTotal    = ref(0) // mémorisé après phase 1

  // Per-question record for the end-of-game recap
  // { label, total, score, answer, remaining, remainingAnswer, phase2Played }
  const history   = ref([])
  const startedAt = ref(null)

  // --- Timer ---
  const timeLeft = ref(timeLimit ?? 0)
  let _timer       = null
  let _autoAdvance = null

  // --- Computed ---
  const correctAnswer = computed(() => {
    if (phase.value === 1) {
      return currentVolee.value.reduce((sum, d) => sum + d.pts, 0)
    }
    // Phase 2 : score restant après la volée
    return currentScore.value - voleeTotal.value
  })

  const questionLabel = computed(() =>
    maxQuestions
      ? `${questionIndex.value} / ${maxQuestions}`
      : String(questionIndex.value)
  )

  const phaseLabel = computed(() =>
    phase.value === 2 ? 'Score restant ?' : 'Total de la volée ?'
  )

  // --- Dart generation ---

  function rand20() { return Math.floor(Math.random() * 20) + 1 }
  const DIFFICULTY_CONFIG = {
    easy: [
      { type: "miss", label: "Miss", pts: 0, chance: 0.05 },
      { type: "single", chance: 0.95 },
    ],
    medium: [
      { type: "miss", label: "Miss", pts: 0, chance: 0.04 },
      { type: "single", chance: 0.51 },
      { type: "double", chance: 0.45 },
    ],
    hard: [
      { type: "miss", label: "Miss", pts: 0, chance: 0.03 },
      { type: "single", chance: 0.35 },
      { type: "double", chance: 0.24 },
      { type: "triple", chance: 0.26 },
      { type: "bull", label: "DBull", pts: 25, chance: 0.07 },
      { type: "bull", label: "Bull", pts: 50, chance: 0.05 },
    ],
  };

  function generateDart() {
    const outcomes = DIFFICULTY_CONFIG[difficulty];

    if (!outcomes) {
      throw new Error(`Difficulté inconnue : ${difficulty}`);
    }

    const r = Math.random();
    let threshold = 0;

    const outcome = outcomes.find(({ chance }) => {
      threshold += chance;
      return r < threshold;
    });

    const { type, label, pts } = outcome;

    if (label !== undefined) {
      return { type, label, pts };
    }

    const n = rand20();
    const multiplier = { single: 1, double: 2, triple: 3 }[type];

    return {
      type,
      label: `${type === "single" ? "" : type === "double" ? "D" : "T"}${n}`,
      pts: n * multiplier,
    };
  }

  function generateVolee(scoreLimit) {
    for (let i = 0; i < 50; i++) {
      const v = [generateDart(), generateDart(), generateDart()]
      if (v.reduce((s, d) => s + d.pts, 0) <= scoreLimit) return v
    }
    const darts = []; let budget = scoreLimit
    for (let i = 0; i < 3; i++) {
      if (budget <= 0) { darts.push({ type: 'miss', label: 'Miss', pts: 0 }); continue }
      const n = Math.floor(Math.random() * Math.min(budget, 20)) + 1
      darts.push({ type: 'single', label: String(n), pts: n })
      budget -= n
    }
    return darts
  }

  // --- Timers ---
  function stopTimer() { clearInterval(_timer); _timer = null }

  function startTimer() {
    stopTimer()
    if (!timeLimit) return
    timeLeft.value = timeLimit
    _timer = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) { stopTimer(); onTimeout() }
    }, 1000)
  }

  function scheduleNextRound() {
    clearTimeout(_autoAdvance)
    _autoAdvance = setTimeout(() => {
      if (gameOver.value) return
      if (maxQuestions !== null && questionIndex.value >= maxQuestions) {
        gameOver.value = true
      } else {
        nextRound()
      }
    }, 1500)
  }

  // undefined = not answered yet, null = timed out
  function recordAnswer(value) {
    const entry = history.value[history.value.length - 1]
    if (phase.value === 1) entry.answer = value
    else entry.remainingAnswer = value
  }

  function onTimeout() {
    answered.value = true
    recordAnswer(null)
    if (phase.value === 1) streak.value = 0
    feedbackState.value = 'timeout'
    scheduleNextRound()
  }

  // --- Actions ---
  function nextRound() {
    clearTimeout(_autoAdvance)
    phase.value         = 1
    answered.value      = false
    inputValue.value    = ''
    feedbackState.value = null
    questionIndex.value++
    currentScore.value  = Math.floor(Math.random() * 500) + 2
    currentVolee.value  = generateVolee(currentScore.value)
    startedAt.value ??= Date.now()
    const total = currentVolee.value.reduce((sum, d) => sum + d.pts, 0)
    history.value.push({
      label: currentVolee.value.map(d => d.label).join(' + '),
      total,
      score: currentScore.value,
      answer: undefined,
      remaining: currentScore.value - total,
      remainingAnswer: undefined,
      phase2Played: false,
    })
    startTimer()
  }

  function appendDigit(digit) {
    if (answered.value || inputValue.value.length >= 3) return
    inputValue.value += digit
  }

  function deleteDigit() {
    if (answered.value) return
    inputValue.value = inputValue.value.slice(0, -1)
  }

  function validate() {
    if (answered.value) return
    const userAnswer = parseInt(inputValue.value)
    if (isNaN(userAnswer)) return

    stopTimer()
    answered.value = true
    recordAnswer(userAnswer)

    if (userAnswer === correctAnswer.value) {
      if (phase.value === 1) {
        streak.value++
        correctCount.value++
        if (streak.value > best.value) {
          best.value = streak.value
        }

        // Si double validation activé → passer en phase 2
        if (doubleValidation) {
          voleeTotal.value    = correctAnswer.value
          feedbackState.value = 'phase1ok'  // feedback vert rapide
          // Transition vers phase 2 après 1s
          clearTimeout(_autoAdvance)
          _autoAdvance = setTimeout(() => {
            phase.value         = 2
            history.value[history.value.length - 1].phase2Played = true
            answered.value      = false
            inputValue.value    = ''
            feedbackState.value = null
            startTimer()
          }, 1000)
          return
        }
      }

      feedbackState.value = 'correct'
    } else {
      if (phase.value === 1) streak.value = 0
      feedbackState.value = 'wrong'
    }

    scheduleNextRound()
  }

  function cleanup() {
    stopTimer()
    clearTimeout(_autoAdvance)
  }

  return {
    currentScore, currentVolee, inputValue,
    feedbackState, answered, streak, best,
    questionIndex, correctCount, gameOver, timeLeft,
    phase, voleeTotal, history, startedAt,
    correctAnswer, questionLabel, phaseLabel,
    nextRound, appendDigit, deleteDigit, validate, cleanup,
  }
}
