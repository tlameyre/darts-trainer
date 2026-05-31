<script setup>
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  show:    { type: Boolean, required: true },
  session: { type: Object,  default: null  },
  mode:    { type: String,  required: true }, // 'score' | 'warmup' | 'x01'
})

defineEmits(['close'])

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDuration(s) {
  if (!s) return 'Infini'
  const m = Math.floor(s / 60)
  return `${m} min`
}

function formatZone(zone) {
  if (!zone) return '–'
  const type = zone.type === 'A' ? 'Simple' : zone.type === 'D' ? 'Double' : 'Triple'
  return `${type} ${zone.sector}`
}

function accuracy(hits, total) {
  return total > 0 ? Math.round((hits / total) * 100) : 0
}
</script>

<template>
  <Transition name="sheet">
    <div v-if="show && session" class="session-modal">
      <div class="session-modal__backdrop" @click="$emit('close')" />
      <div class="session-modal__sheet">

        <!-- Header -->
        <div class="session-modal__header">
          <div>
            <p class="session-modal__date">{{ formatDate(session.played_at) }}</p>
            <p class="session-modal__mode-label">
              {{ mode === 'score' ? 'Score Training' : mode === 'warmup' ? 'Échauffement' : '501' }}
            </p>
          </div>
          <button class="session-modal__close" @click="$emit('close')">
            <AppIcon name="close" :width="16" :height="16" />
          </button>
        </div>

        <!-- ── Score Training ──────────────────────────────────────────── -->
        <template v-if="mode === 'score'">
          <div class="session-modal__grid">
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">
                {{ session.correct_count }}/{{ session.total_questions }}
              </span>
              <span class="session-modal__stat-label">Score</span>
            </div>
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">
                {{ accuracy(session.correct_count, session.total_questions) }}%
              </span>
              <span class="session-modal__stat-label">Précision</span>
            </div>
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">{{ session.best_streak }}</span>
              <span class="session-modal__stat-label">Meilleure série</span>
            </div>
          </div>
        </template>

        <!-- ── Échauffement ────────────────────────────────────────────── -->
        <template v-else-if="mode === 'warmup'">
          <div class="session-modal__row">
            <span class="session-modal__row-label">Zone</span>
            <span class="session-modal__row-value">{{ formatZone(session.zone) }}</span>
          </div>
          <div class="session-modal__grid">
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">{{ session.hits }}/{{ session.total_darts }}</span>
              <span class="session-modal__stat-label">Touches</span>
            </div>
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">{{ session.accuracy }}%</span>
              <span class="session-modal__stat-label">Précision</span>
            </div>
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">{{ formatDuration(session.duration_s) }}</span>
              <span class="session-modal__stat-label">Durée</span>
            </div>
          </div>
        </template>

        <!-- ── 501 ────────────────────────────────────────────────────── -->
        <template v-else-if="mode === 'x01'">
          <div class="session-modal__row">
            <span class="session-modal__row-label">Score de départ</span>
            <span class="session-modal__row-value">{{ session.start_score }}</span>
          </div>
          <div class="session-modal__row">
            <span class="session-modal__row-label">Manches jouées</span>
            <span class="session-modal__row-value">{{ session.legs_played }}</span>
          </div>

          <div class="session-modal__grid session-modal__grid--2">
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">{{ Math.round(session.avg_volley) }}</span>
              <span class="session-modal__stat-label">Moy. volée</span>
            </div>
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">{{ Math.round(session.avg_9darts) }}</span>
              <span class="session-modal__stat-label">Moy. 9 darts</span>
            </div>
          </div>

          <div class="session-modal__grid session-modal__grid--3">
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">{{ Math.round(session.avg_darts_to_finish) }}</span>
              <span class="session-modal__stat-label">Moy. fléch. / manche</span>
            </div>
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">{{ session.min_darts }}</span>
              <span class="session-modal__stat-label">Min fléchettes</span>
            </div>
            <div class="session-modal__stat">
              <span class="session-modal__stat-value">{{ session.max_darts }}</span>
              <span class="session-modal__stat-label">Max fléchettes</span>
            </div>
          </div>

          <div class="session-modal__highlight">
            <span class="session-modal__highlight-label">Plus haut finish</span>
            <span class="session-modal__highlight-value">{{ session.highest_finish }}</span>
          </div>
          <div class="session-modal__highlight">
            <span class="session-modal__highlight-label">Meilleure volée</span>
            <span class="session-modal__highlight-value">{{ session.highest_volley }}</span>
          </div>
        </template>

      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.session-modal {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: flex-end;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba($black, 0.6);
  }

  &__sheet {
    position: relative;
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    background: #1e2b28;
    border-radius: $radius-lg $radius-lg 0 0;
    padding: $padding-lg $padding-md calc($padding-lg + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__date {
    @include title-sm;
    color: $white;
    text-transform: capitalize;
  }

  &__mode-label {
    font-size: 12px;
    color: $muted;
    margin-top: 2px;
  }

  &__close {
    color: $muted;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $padding-xxs;
    flex-shrink: 0;
    transition: color 0.15s;
    &:active { color: $white; }
  }

  // ── Grilles ───────────────────────────────────────────────────────────
  &__grid {
    display: grid;
    gap: $gap-sm;
    grid-template-columns: repeat(3, 1fr);

    &--2 { grid-template-columns: repeat(2, 1fr); }
    &--3 { grid-template-columns: repeat(3, 1fr); }
  }

  &__stat {
    background: rgba($white, 0.05);
    border-radius: $radius-md;
    padding: $padding-sm $padding-xs;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__stat-value {
    @include title-xl;
    color: $white;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  &__stat-label {
    font-size: 11px;
    color: $muted;
    text-align: center;
    line-height: 1.3;
  }

  // ── Ligne simple ──────────────────────────────────────────────────────
  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $padding-xs 0;
    border-bottom: 1px solid rgba($white, 0.06);
  }

  &__row-label {
    font-size: 13px;
    color: $muted;
  }

  &__row-value {
    @include title-sm;
    color: $white;
  }

  // ── Highlight ────────────────────────────────────────────────────────
  &__highlight {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba($white, 0.04);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
  }

  &__highlight-label {
    font-size: 13px;
    color: $muted;
  }

  &__highlight-value {
    @include title-lg;
    color: $white;
    font-variant-numeric: tabular-nums;
  }
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s;
  .session-modal__sheet { transition: transform 0.25s ease; }
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  .session-modal__sheet { transform: translateY(100%); }
}
</style>
