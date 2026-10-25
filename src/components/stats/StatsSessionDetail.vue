<script setup>
import { ref, computed, watch } from 'vue'
import AppHeader from '../AppHeader.vue'
import AppIcon from '../AppIcon.vue'
import GameRecap from '../game/GameRecap.vue'
import ScoreRecap from '../score/ScoreRecap.vue'
import WarmupEndRecap from '../warmup/WarmupEndRecap.vue'
import X01MatchEnd from '../x01/X01MatchEnd.vue'
import CheckoutRecap from '../checkout/CheckoutRecap.vue'
import { matchTone, matchColorVar } from '../../utils/matchTone.js'

const props = defineProps({
  show:    { type: Boolean, required: true },
  session: { type: Object,  default: null },
  mode:    { type: String,  required: true },
})

const emit = defineEmits(['close', 'delete', 'open-tournament'])

// Normalise un item zoneRecap vers le format { zones: [...] } attendu par WarmupEndRecap
function normalizeZoneItem(item) {
  if (item.zones) return item
  // Ancien format : { zone: { sector, type }, ... }
  return { ...item, zones: item.zone ? [item.zone] : [] }
}

// Mappe les données DB → format WarmupEndRecap
const warmupZoneStats = computed(() => {
  const s = props.session
  if (!s) return []
  if (s.settings?.zoneRecap?.length) return s.settings.zoneRecap.map(normalizeZoneItem)
  // Fallback : zone unique stockée en DB (anciennes sessions sans zoneRecap)
  return [{
    zones:      s.zone ? [s.zone] : [],
    accuracy:   s.accuracy,
    durationMs: (s.duration_s ?? 0) * 1000,
    total:      s.total_darts,
    hits:       s.hits,
  }]
})

const warmupSessionStats = computed(() => {
  const s = props.session
  if (!s) return { total: 0, hits: 0, accuracy: 0 }
  return {
    total:      s.total_darts,
    hits:       s.hits,
    accuracy:   s.accuracy,
    points:     s.settings?.points,
    bestStreak: s.settings?.bestStreak,
  }
})

// Sessions récentes : match_stats complet. Anciennes : onglet Match seul, reconstruit des colonnes.
const x01MatchStats = computed(() => {
  const s = props.session
  if (!s) return null
  if (s.match_stats) return s.match_stats
  const dist = s.volley_distribution ?? {}
  return {
    players: [{ name: s.settings?.humanName ?? 'Toi', isMe: true }],
    match: [{
      legsWon:          s.settings?.humanLegsWon ?? s.legs_played,
      average:          s.avg_volley != null ? Number(s.avg_volley) : null,
      scoringAverage:   null,
      first9Average:    s.avg_9darts != null ? Number(s.avg_9darts) : null,
      checkoutHits:     s.doubles_hit ?? 0,
      checkoutAttempts: s.doubles_attempted,
      highestFinish:    s.highest_finish || null,
      darts:            s.total_darts,
      bestLeg:          s.min_darts,
      buckets: {
        60:  dist['60'] ?? 0,
        80:  dist['80'] ?? 0,
        100: (dist['100'] ?? 0) + (dist['120'] ?? 0),
        140: (dist['140'] ?? 0) + (dist['160'] ?? 0),
        180: dist['180'] ?? 0,
      },
    }],
    legs: [],
  }
})

// Index in matchStats.players of whoever reached legsToWin; null if the game was stopped before.
// Older sessions only carry the human player, so a DartBot win is not representable there.
const x01WinnerIndex = computed(() => {
  const st = props.session?.settings ?? {}
  const target = st.legsToWin ?? Infinity
  const idx = (x01MatchStats.value?.match ?? []).findIndex(p => p.legsWon >= target)
  return idx >= 0 ? idx : null
})

const x01Subtitle = computed(() => {
  const s = props.session
  return `${s.start_score} pts · ${s.legs_played} manche${s.legs_played > 1 ? 's' : ''}`
})

const scoreStats = computed(() => [
  { label: 'Questions', value: props.session?.total_questions ?? 0 },
  { label: 'Meilleure série', value: props.session?.best_streak ?? 0 },
])

const scorePercent = computed(() => {
  const s = props.session
  return s?.total_questions ? Math.round((s.correct_count / s.total_questions) * 100) : 0
})

// The match recap has its own header inside a leg detail
const inLegDetail = ref(false)
watch(() => [props.show, props.session?.id], () => { inLegDetail.value = false })

const HEADER_TONES = { score: 'orange', warmup: 'blue', checkout: 'cyan' }

// A saved online match carries its context in the session settings
const headerTone = computed(() => props.mode === 'x01'
  ? matchTone({ online: !!props.session?.settings?.online, tournament: !!props.session?.tournament_id })
  : HEADER_TONES[props.mode])

const gameColor = computed(() => props.mode === 'x01' ? matchColorVar(headerTone.value) : null)

const checkoutStats = computed(() => {
  const s = props.session
  if (!s) return null
  return {
    questions: s.questions,
    correct: s.correct_count,
    optimal: s.optimal_count,
    bestStreak: s.best_streak,
    points: s.points,
  }
})

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <Transition name="slide-up">
    <div v-if="show && session" class="session-detail" :style="gameColor ? { '--game-color': gameColor } : undefined">
      <AppHeader v-if="!inLegDetail" :title="formatDate(session.played_at)" :tone="headerTone" @back="$emit('close')">
        <template #right>
          <button class="session-detail__delete" aria-label="Supprimer la session" @click="$emit('delete', session.id)">
            <AppIcon name="trash" :width="22" :height="22" />
          </button>
        </template>
      </AppHeader>

      <X01MatchEnd
        v-if="mode === 'x01'"
        class="session-detail__recap"
        :match-stats="x01MatchStats"
        :winner-index="x01WinnerIndex"
        :subtitle="x01Subtitle"
        hide-actions
        @leg-detail="inLegDetail = $event"
      >
        <template v-if="session.tournament_id" #winner-aside>
          <!-- tournaments is null once the tournament is gone or no longer readable -->
          <button
            v-if="session.tournaments"
            class="session-detail__tournament session-detail__tournament--link"
            :title="session.tournaments.name"
            @click="$emit('open-tournament', session)"
          >
            <AppIcon name="trophy" :width="14" :height="14" />
            Tournoi
            <AppIcon name="arrow-right" :width="14" :height="14" />
          </button>
          <span v-else class="session-detail__tournament">
            <AppIcon name="trophy" :width="14" :height="14" />
            Tournoi
          </span>
        </template>
      </X01MatchEnd>

      <ScoreRecap
        v-else-if="mode === 'score' && session.settings?.history?.length"
        class="session-detail__recap"
        :history="session.settings.history"
        :double-validation="!!session.settings.doubleValidation"
        :best="session.best_streak ?? 0"
        :duration-ms="session.settings.durationMs ?? 0"
        hide-actions
      />

      <!-- Sessions saved before the question history was stored: totals only -->
      <GameRecap
        v-else-if="mode === 'score'"
        class="session-detail__recap"
        :percent="scorePercent"
        :badge-value="`${session.correct_count}/${session.total_questions}`"
        badge-label="bonnes réponses"
        :stats="scoreStats"
        hide-actions
      />

      <WarmupEndRecap
        v-else-if="mode === 'warmup'"
        class="session-detail__recap"
        :zone-recap-stats="warmupZoneStats"
        :session-stats="warmupSessionStats"
        :duration-ms="(session.duration_s ?? 0) * 1000"
        hide-actions
      />

      <CheckoutRecap
        v-else-if="mode === 'checkout'"
        class="session-detail__recap"
        variant="quiz" :session-stats="checkoutStats" :results="session.settings?.results ?? []" hide-actions
      />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.session-detail {
  position: fixed;
  inset: 0;
  background: $bg;
  z-index: 100;
  display: flex;
  flex-direction: column;

  &__delete {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__recap {
    flex: 1;
    min-height: 0;
  }

  &__tournament {
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    margin-left: auto;
    padding: $padding-xs $padding-sm;
    border: $border-md solid rgba($white, 0.6);
    border-radius: $radius-sm;
    color: $white;
    @include title-sm;
    flex-shrink: 0;

    &--link {
      transition: background 0.15s;

      &:active { background: rgba($white, 0.2); }
    }
  }
}

@media (min-width: $bp-laptop) {
  .session-detail {
    &__tournament { @include title-md; }
  }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(30px); opacity: 0; }
</style>
