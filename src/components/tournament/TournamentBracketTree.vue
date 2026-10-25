<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import TournamentMatchCard from './TournamentMatchCard.vue'

const props = defineProps({
  matches:      { type: Array, required: true },
  participants: { type: Array, required: true },
  // Matchs que l'utilisateur courant a le droit de lancer ou rejoindre
  playableMatchIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['play', 'details'])

const participantsById = computed(() => Object.fromEntries(props.participants.map(p => [p.id, p])))

function groupRounds(type) {
  const byRound = {}
  for (const m of props.matches) {
    if (m.bracket_type !== type) continue
    byRound[m.round] = byRound[m.round] || []
    byRound[m.round].push(m)
  }
  return Object.keys(byRound)
    .sort((a, b) => a - b)
    .map(r => byRound[r].sort((a, b) => a.slot_in_round - b.slot_in_round))
}

const winnerRounds = computed(() => groupRounds('winner'))
const loserRounds  = computed(() => groupRounds('loser'))
const grandFinal   = computed(() => props.matches.find(m => m.bracket_type === 'grand_final') ?? null)

// Connectors are measured from the rendered cards rather than derived from the
// round structure: loser-bracket rounds don't halve, so only real positions line up.
const winnerRowEl = ref(null)
const loserRowEl  = ref(null)
const winnerLinks = ref([])
const loserLinks  = ref([])

function measureLinks(rowEl, type) {
  if (!rowEl) return []
  const origin = rowEl.getBoundingClientRect()
  const rects  = Object.fromEntries(
    [...rowEl.querySelectorAll('[data-match-id]')].map(el => [el.dataset.matchId, el.getBoundingClientRect()]),
  )
  return props.matches
    .filter(m => m.bracket_type === type && rects[m.id] && rects[m.next_match_id])
    .map(m => {
      const from = rects[m.id]
      const to   = rects[m.next_match_id]
      const x1 = from.right - origin.left
      const y1 = from.top + from.height / 2 - origin.top
      const x2 = to.left - origin.left
      const y2 = to.top + to.height / 2 - origin.top
      const xm = (x1 + x2) / 2
      return { id: m.id, d: `M${x1} ${y1}H${xm}V${y2}H${x2}`, done: m.status === 'completed' }
    })
    // Winner paths drawn last so they sit on top of the grey ones at shared elbows
    .sort((a, b) => a.done - b.done)
}

function updateLinks() {
  winnerLinks.value = measureLinks(winnerRowEl.value, 'winner')
  loserLinks.value  = measureLinks(loserRowEl.value, 'loser')
}

let resizeObserver = null
onMounted(() => {
  resizeObserver = new ResizeObserver(updateLinks)
  for (const el of [winnerRowEl.value, loserRowEl.value]) if (el) resizeObserver.observe(el)
  updateLinks()
})
onUnmounted(() => resizeObserver?.disconnect())
watch(() => props.matches, () => nextTick(updateLinks), { deep: true })

function roundLabel(rounds, idx) {
  const fromEnd = rounds.length - 1 - idx
  if (fromEnd === 0) return 'Finale'
  if (fromEnd === 1) return 'Demi-finale'
  if (fromEnd === 2) return 'Quart de finale'
  return `Tour ${idx + 1}`
}
</script>

<template>
  <div class="bracket">
    <section class="bracket__section">
      <div v-if="loserRounds.length" class="bracket__section-title">Tableau principal</div>
      <div ref="winnerRowEl" class="bracket__row">
        <svg class="bracket__lines">
          <path v-for="l in winnerLinks" :key="l.id" :d="l.d" class="bracket__line" :class="{ 'bracket__line--done': l.done }" />
        </svg>
        <div v-for="(round, ri) in winnerRounds" :key="`w-${ri}`" class="bracket__col">
          <div class="bracket__col-title">{{ roundLabel(winnerRounds, ri) }}</div>
          <div class="bracket__col-matches">
            <div v-for="match in round" :key="match.id" class="bracket__node">
              <TournamentMatchCard :match="match" :participants-by-id="participantsById" :playable="playableMatchIds.includes(match.id)" @play="emit('play', match.id)" @details="emit('details', match.id)" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="loserRounds.length" class="bracket__section">
      <div class="bracket__section-title">Tableau des perdants</div>
      <div ref="loserRowEl" class="bracket__row">
        <svg class="bracket__lines">
          <path v-for="l in loserLinks" :key="l.id" :d="l.d" class="bracket__line" :class="{ 'bracket__line--done': l.done }" />
        </svg>
        <div v-for="(round, ri) in loserRounds" :key="`l-${ri}`" class="bracket__col">
          <div class="bracket__col-title">Tour {{ ri + 1 }}</div>
          <div class="bracket__col-matches">
            <div v-for="match in round" :key="match.id" class="bracket__node">
              <TournamentMatchCard :match="match" :participants-by-id="participantsById" :playable="playableMatchIds.includes(match.id)" @play="emit('play', match.id)" @details="emit('details', match.id)" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="grandFinal" class="bracket__section">
      <div class="bracket__section-title">Grande finale</div>
      <TournamentMatchCard :match="grandFinal" :participants-by-id="participantsById" :playable="playableMatchIds.includes(grandFinal.id)" @play="emit('play', grandFinal.id)" @details="emit('details', grandFinal.id)" />
    </section>
  </div>
</template>

<style lang="scss" scoped>
.bracket {
  display: flex;
  flex-direction: column;
  gap: $gap-xl;
  overflow-x: auto;
  padding-bottom: $padding-sm;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-title {
    @include title-md;
    padding-bottom: $padding-xxs;
    border-bottom: $border-lg solid $black;
  }

  &__row {
    position: relative;
    display: flex;
    align-items: stretch;
    gap: $gap-xl;
    min-width: max-content;
  }

  &__lines {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  &__line {
    fill: none;
    stroke: $border-color;
    stroke-width: 1.5;

    &--done { stroke: $mode-tournament; }
  }

  &__col {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    min-width: 168px;
  }

  &__col-title {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    color: $muted;
    text-align: center;
  }

  &__col-matches {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: $gap-sm;
  }
}
</style>
