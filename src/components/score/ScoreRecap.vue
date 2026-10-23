<script setup>
import { computed } from 'vue'
import ScoreRecapRow from './ScoreRecapRow.vue'

const props = defineProps({
  history: { type: Array, required: true },
  doubleValidation: Boolean,
  best: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
})

defineEmits(['replay', 'home'])

// A question finished mid-way (via "Terminer la partie") was never answered
const entries = computed(() => props.history.filter(e => e.answer !== undefined))

const score = computed(() => {
  const voleeOk = entries.value.filter(e => e.answer === e.total).length
  if (!props.doubleValidation) return { correct: voleeOk, total: entries.value.length }
  const played = entries.value.filter(e => e.phase2Played && e.remainingAnswer !== undefined)
  const remainingOk = played.filter(e => e.remainingAnswer === e.remaining).length
  return { correct: voleeOk + remainingOk, total: entries.value.length + played.length }
})

const percent = computed(() =>
  score.value.total ? Math.round((score.value.correct / score.value.total) * 100) : 0
)

const duration = computed(() => {
  const s = Math.round(props.durationMs / 1000)
  if (s < 60) return `${s} s`
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`
})

const countLabel = computed(() => {
  const n = entries.value.length
  const label = `${n} question${n > 1 ? 's' : ''}`
  return props.doubleValidation ? `${label} · 2 étapes` : label
})
</script>

<template>
  <div class="recap">
    <section class="recap__hero">
      <span class="recap__title">Récap de la session</span>
      <div class="recap__headline">
        <span class="recap__percent">{{ percent }}<span class="recap__percent-sign">%</span></span>
        <div class="recap__badge">
          <span class="recap__badge-value">{{ score.correct }}/{{ score.total }}</span>
          <span class="recap__badge-label">bonnes réponses</span>
        </div>
      </div>
      <div class="recap__stats">
        <div class="recap__stat">
          <span class="recap__stat-value">{{ duration }}</span>
          <span class="recap__stat-label">Temps total</span>
        </div>
        <div class="recap__stat">
          <span class="recap__stat-value">{{ best }}</span>
          <span class="recap__stat-label">Meilleure série</span>
        </div>
      </div>
    </section>

    <section class="recap__details">
      <div class="recap__list-head">
        <h2 class="recap__list-title">Récap par question</h2>
        <span class="recap__list-count">{{ countLabel }}</span>
      </div>
      <ul class="recap__list">
        <ScoreRecapRow
          v-for="(entry, i) in entries"
          :key="i"
          :index="i + 1"
          :entry="entry"
          :double-validation="doubleValidation"
        />
      </ul>

      <div class="recap__actions">
        <button class="recap__action recap__action--primary" @click="$emit('replay')">Rejouer</button>
        <button class="recap__action recap__action--outline" @click="$emit('home')">Accueil</button>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.recap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  &__hero {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: $padding-xs $padding-md $padding-md;
    background: $orange;
    color: $white;
  }

  &__title {
    @include title-lg;
  }

  &__headline {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $gap-md;
  }

  &__percent {
    @include display-lg;
    line-height: 0.9;
  }

  &__percent-sign {
    @include display-xs;
  }

  &__badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    background: $white;
    color: $orange;
  }

  &__badge-value {
    @include title-xxxl;
    line-height: 1;
  }

  &__badge-label {
    @include text-xxs;
    text-transform: uppercase;
    letter-spacing: $tracking-sm;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-top: $padding-sm;
    border-top: $border-md solid rgba($white, 0.3);
  }

  &__stat {
    display: flex;
    flex-direction: column;
  }

  &__stat-value {
    @include title-xxl;
    line-height: 1;
  }

  &__stat-label {
    @include text-xs;
    opacity: 0.8;
  }

  &__details {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding: $padding-md;
  }

  &__list-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: $padding-xs;
    border-bottom: $border-lg solid $black;
  }

  &__list-title {
    @include title-lg;
  }

  &__list-count {
    @include text-sm;
    color: $muted;
  }

  &__list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $gap-xs;
    padding-top: $padding-xs;
  }

  &__action {
    @include title-lg;
    height: 56px;
    border-radius: $radius-sm;

    &--primary {
      background: $orange;
      color: $white;
    }

    &--outline {
      border: $border-md solid $black;
      color: $black;
    }
  }
}

@media (min-width: $bp-laptop) {
  .recap {
    display: grid;
    grid-template-columns: 1fr 1fr;

    &__hero {
      justify-content: flex-end;
      gap: $gap-xxl;
      padding: $padding-xxl;
    }

    &__title          { @include title-xxl; }
    &__percent        { @include display-xl; }
    &__percent-sign   { @include display-md; }
    &__badge          { padding: $padding-md $padding-xl; }
    &__badge-value    { @include display-sm; }
    &__badge-label    { @include text-sm; }
    &__stats          { row-gap: $gap-xl; padding-top: $padding-lg; }
    &__stat-value     { @include display-xs; }
    &__stat-label     { @include text-md; }

    &__details {
      gap: $gap-sm;
      padding: $padding-xxl;
    }

    &__list-title { @include title-xl; }
    &__list-count { @include text-md; }

    &__action {
      @include title-xl;
      height: 64px;
    }
  }
}
</style>
