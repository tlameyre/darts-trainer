<script setup>
import { computed } from 'vue'
import DartPill from './DartPill.vue'
import { formatRoute } from '../../composables/useCheckouts.js'

const props = defineProps({
  checkout: { type: Object, default: null },
  selectable: { type: Boolean, default: false },
  selected: { type: Array, default: null }, // Dart[] shown on the board when selectable
  played: { type: Array, default: null }, // Dart[] actually thrown (quiz) — tags its row
  tone: { type: String, default: 'cyan', validator: (v) => ['cyan', 'ink'].includes(v) },
})

const emit = defineEmits(['select'])

const rows = computed(() => {
  const c = props.checkout
  if (!c) return []
  const out = [{ key: 'primary', label: 'Recommandé', route: c.primary }]
  if (c.backup) {
    out.push({ key: 'backup', label: 'Plan B', route: c.backup.darts, leaves: c.backup.leaves })
  }
  c.options.forEach((route, i) => out.push({ key: `opt-${i}`, label: 'Autre', route }))
  return out
})

const selectedKey = computed(() => (props.selected ? formatRoute(props.selected) : null))
const playedKey = computed(() => (props.played?.length ? formatRoute(props.played) : null))

const isPlayed = (row) => playedKey.value != null && formatRoute(row.route) === playedKey.value
const isActive = (row) => isPlayed(row) || (props.selectable && formatRoute(row.route) === selectedKey.value)
</script>

<template>
  <div v-if="rows.length" class="route-card" :class="`route-card--${tone}`">
    <component
      :is="selectable ? 'button' : 'div'"
      v-for="row in rows"
      :key="row.key"
      class="route-card__row"
      :class="{ 'route-card__row--active': isActive(row), 'route-card__row--played': isPlayed(row) }"
      @click="selectable && emit('select', row.route)"
    >
      <span class="route-card__tag">
        {{ row.label }}
        <span v-if="isPlayed(row)" class="route-card__played-tag">· jouée</span>
      </span>
      <span class="route-card__darts">
        <DartPill
          v-for="(d, j) in row.route"
          :key="j"
          :dart="d"
          :tone="isActive(row) ? tone : 'neutral'"
          show-points
        />
        <span v-if="row.leaves != null" class="route-card__leaves">→ laisse {{ row.leaves }}</span>
      </span>
    </component>
  </div>
  <p v-else class="route-card__none">Pas de route enregistrée pour ce score.</p>
</template>

<style lang="scss" scoped>
.route-card {
  --route-color: #{$mode-checkout};

  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  width: 100%;

  &__row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    width: 100%;
    padding: $padding-xs $padding-sm;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $bg;
    color: $text-color;
    text-align: left;
    transition: border-color 0.15s;

    &--active { border-color: var(--route-color); }
  }

  button.route-card__row:active { opacity: 0.7; }

  &__tag {
    min-width: 88px;
    flex-shrink: 0;
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    white-space: nowrap;
    text-transform: uppercase;
    color: $muted;
  }

  &__row--active:not(&__row--played) &__tag,
  &__played-tag { color: var(--route-color); }

  &--ink { --route-color: #{$black}; }

  &__darts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $gap-xs;
  }

  &__leaves {
    @include text-sm;
    color: $muted;
  }

  &__none {
    @include text-sm;
    color: $muted;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  .route-card {
    &__row    { gap: $gap-md; padding: $padding-xs $padding-sm; }
    &__tag    { min-width: 110px; @include text-sm; }
    &__leaves { @include text-md; }
    &__none   { @include text-md; }
  }
}
</style>
