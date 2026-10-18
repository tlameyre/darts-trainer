<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../AppIcon.vue'
import X01Result from '../x01/X01Result.vue'
import GameOver from '../GameOver.vue'
import WarmupRecap from '../warmup/WarmupRecap.vue'
import CheckoutRecap from '../checkout/CheckoutRecap.vue'

const props = defineProps({
  show:    { type: Boolean, required: true },
  session: { type: Object,  default: null },
  mode:    { type: String,  required: true },
})

const emit = defineEmits(['close', 'delete'])

const router = useRouter()

function openTournament() {
  const { tournament_id: id, tournaments } = props.session
  const tab = tournaments.format === 'championship' ? 'matchdays' : 'bracket'
  router.push({ name: 'tournament-detail', params: { id }, query: { tab } })
}

// Normalise un item zoneRecap vers le format { zones: [...] } attendu par WarmupRecap
function normalizeZoneItem(item) {
  if (item.zones) return item
  // Ancien format : { zone: { sector, type }, ... }
  return { ...item, zones: item.zone ? [item.zone] : [] }
}

// Mappe les données DB → format WarmupRecap
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
  return { total: s.total_darts, hits: s.hits, accuracy: s.accuracy }
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

// Same title as the end-of-game screen: who won, or a neutral title if nobody reached legsToWin
const x01Result = computed(() => {
  const st = props.session?.settings ?? {}
  const target = st.legsToWin ?? Infinity
  if (st.aiProfile) {
    return st.aiLegsWon >= target
      ? { title: 'L\'IA a gagné la partie !', emoji: '🤖', titleColor: 'orange' }
      // humanLegsWon was under-counted in older sessions, so only DartBot's legs are reliable
      : { title: 'Bien joué !', emoji: '🏆' }
  }
  if (st.opponents?.length) {
    const winner = st.humanLegsWon >= target
      ? (st.humanName ?? 'Toi')
      : st.opponents.find(o => o.legsWon >= target)?.name
    return { title: winner ? `${winner} a gagné la partie !` : 'Partie terminée', emoji: '🏆' }
  }
  return { title: 'Bien joué !', emoji: '🏆' }
})

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
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}
</script>

<template>
  <Transition name="slide-up">
    <div v-if="show && session" class="session-detail">

      <!-- Barre du haut -->
      <div class="session-detail__topbar">
        <button class="session-detail__close" @click="$emit('close')">
          <AppIcon name="arrow-left" :width="20" :height="20" />
        </button>
        <span class="session-detail__date">{{ formatDate(session.played_at) }}</span>
        <button class="session-detail__delete" @click="$emit('delete', session.id)">
          <AppIcon name="trash" :width="18" :height="18" />
        </button>
      </div>

      <!-- tournaments is null once the tournament is gone or no longer readable -->
      <button
        v-if="session.tournaments"
        class="session-detail__badge session-detail__badge--link"
        @click="openTournament"
      >
        <AppIcon name="trophy" :width="12" :height="12" />
        {{ session.tournaments.name }}
        <AppIcon name="arrow-right" :width="12" :height="12" />
      </button>
      <span v-else-if="session.tournament_id" class="session-detail__badge">
        <AppIcon name="trophy" :width="12" :height="12" />
        Tournoi
      </span>

      <!-- Résultat 501 -->
      <template v-if="mode === 'x01'">
        <X01Result
          :match-stats="x01MatchStats"
          :title="x01Result.title"
          :emoji="x01Result.emoji"
          :title-color="x01Result.titleColor ?? null"
          :subtitle="`${session.start_score} pts · ${session.legs_played} manche${session.legs_played > 1 ? 's' : ''}`"
          hide-actions
        />
      </template>

      <!-- Résultat Score Training -->
      <template v-else-if="mode === 'score'">
        <GameOver
          :correct-count="session.correct_count"
          :max-questions="session.total_questions"
          :best="session.best_streak"
          hide-actions
        />
      </template>

      <!-- Résultat Échauffement -->
      <template v-else-if="mode === 'warmup'">
        <WarmupRecap
          :zone-recap-stats="warmupZoneStats"
          :session-stats="warmupSessionStats"
          hide-actions
        />
      </template>

      <!-- Résultat Checkouts -->
      <template v-else-if="mode === 'checkout'">
        <CheckoutRecap variant="quiz" :session-stats="checkoutStats" hide-actions />
      </template>

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
  overflow-y: auto;
  padding: $padding-md $padding-md 0;

  &__topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm;
    margin-bottom: $gap-md;
    flex-shrink: 0;
  }

  &__close,
  &__delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: $radius-sm;
    background: rgba($white, 0.07);
    color: $text-color;
    transition: opacity 0.15s;
    flex-shrink: 0;

    &:active { opacity: 0.6; }
  }

  &__delete { color: $error; background: rgba($error, 0.1); }

  &__badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xxs;
    align-self: center;
    background: rgba($orange, 0.15);
    color: $orange;
    border-radius: $radius-pill;
    padding: $padding-xxs $padding-sm;
    @include text-xxs;
    margin-bottom: $gap-md;
    flex-shrink: 0;

    &--link {
      cursor: pointer;
      transition: opacity 0.15s;

      &:active { opacity: 0.6; }
    }
  }

  &__date {
    @include title-xs;
    color: $muted;
    text-transform: capitalize;
    text-align: center;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }


}

@media (min-width: $bp-laptop) {
  .session-detail {
    padding: $padding-xl;

    &__date { @include title-sm; }
    &__badge { @include text-xs; }
  }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(30px); opacity: 0; }
</style>
