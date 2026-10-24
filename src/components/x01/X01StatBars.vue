<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '../../composables/useMediaQuery.js'

// Compares players stat by stat: a tug-of-war bar at 2 players, one bar per player
// beyond, and a player × stat table on desktop.
const props = defineProps({
  title:   { type: String, required: true },
  players: { type: Array,  required: true }, // [{ name }] in turn order (colors follow the index)
  // [{ label, better: 'high' | 'low' | null, cells: [{ text, value }] }]
  rows:    { type: Array,  required: true },
})

// Same value as $bp-laptop
const isLaptop = useMediaQuery('(min-width: 1025px)')
const layout = computed(() => {
  if (isLaptop.value) return 'table'
  return props.players.length === 2 ? 'duel' : 'bars'
})

const statRows = computed(() => props.rows.map((row) => {
  const values = row.cells.map(c => (typeof c.value === 'number' ? c.value : null))
  const known = values.filter(v => v != null)
  let best = null
  if (row.better && known.length > 1 && new Set(known).size > 1) {
    best = row.better === 'high' ? Math.max(...known) : Math.min(...known)
  }
  // Bar length: higher is longer, so a "lower is better" stat is flipped
  const top = Math.max(0, ...known)
  const low = Math.min(...known)
  const weights = values.map((v) => {
    if (v == null) return 0
    return row.better === 'low' ? top + low - v : v
  })
  const total = weights.reduce((s, w) => s + w, 0)
  const maxWeight = Math.max(0, ...weights)
  return {
    label: row.label,
    cells: row.cells.map((c, i) => ({
      text:  c.text,
      // Without a winner on the row every value stays at full strength
      lead:  best == null || values[i] === best,
      width: maxWeight ? Math.round((weights[i] * 100) / maxWeight) : 0,
      share: total ? Math.round((weights[i] * 100) / total) : 50,
    })),
  }
}))
</script>

<template>
  <section class="stat-bars" :class="`stat-bars--${layout}`">
    <h3 class="stat-bars__title">{{ title }}</h3>

    <div v-if="layout === 'table'" class="stat-bars__table-row stat-bars__table-head" :style="{ '--count': players.length }">
      <span />
      <span v-for="(p, i) in players" :key="i" class="stat-bars__player">
        <span class="stat-bars__swatch" :class="`stat-bars__swatch--p${i}`" />
        {{ p.name }}
      </span>
    </div>

    <template v-if="layout === 'duel'">
      <div v-for="row in statRows" :key="row.label" class="stat-bars__row">
        <div class="stat-bars__duel-values">
          <span class="stat-bars__value stat-bars__value--p0" :class="{ 'stat-bars__value--lead': row.cells[0].lead }">{{ row.cells[0].text }}</span>
          <span class="stat-bars__label">{{ row.label }}</span>
          <span class="stat-bars__value stat-bars__value--p1" :class="{ 'stat-bars__value--lead': row.cells[1].lead }">{{ row.cells[1].text }}</span>
        </div>
        <div class="stat-bars__duel-track">
          <span class="stat-bars__fill stat-bars__fill--p0" :class="{ 'stat-bars__fill--lead': row.cells[0].lead }" :style="{ width: `${row.cells[0].share}%` }" />
          <span class="stat-bars__fill stat-bars__fill--p1 stat-bars__fill--rest" :class="{ 'stat-bars__fill--lead': row.cells[1].lead }" />
        </div>
      </div>
    </template>

    <template v-else-if="layout === 'bars'">
      <div v-for="row in statRows" :key="row.label" class="stat-bars__row">
        <span class="stat-bars__label">{{ row.label }}</span>
        <div v-for="(cell, i) in row.cells" :key="i" class="stat-bars__line">
          <span class="stat-bars__name" :class="{ 'stat-bars__name--lead': cell.lead }">{{ players[i].name }}</span>
          <span class="stat-bars__track">
            <span class="stat-bars__fill" :class="[`stat-bars__fill--p${i}`, { 'stat-bars__fill--lead': cell.lead }]" :style="{ width: `${cell.width}%` }" />
          </span>
          <span class="stat-bars__value" :class="{ 'stat-bars__value--lead': cell.lead }">{{ cell.text }}</span>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-for="row in statRows" :key="row.label" class="stat-bars__row stat-bars__table-row" :style="{ '--count': players.length }">
        <span class="stat-bars__label">{{ row.label }}</span>
        <span v-for="(cell, i) in row.cells" :key="i" class="stat-bars__cell">
          <span class="stat-bars__value" :class="{ 'stat-bars__value--lead': cell.lead }">{{ cell.text }}</span>
          <span class="stat-bars__track">
            <span class="stat-bars__fill" :class="[`stat-bars__fill--p${i}`, { 'stat-bars__fill--lead': cell.lead }]" :style="{ width: `${cell.width}%` }" />
          </span>
        </span>
      </div>
    </template>
  </section>
</template>

<style lang="scss" scoped>
.stat-bars {
  display: flex;
  flex-direction: column;

  &__title {
    @include title-lg;
    padding: $padding-xs 0;
    border-bottom: $border-lg solid $text-color;
  }

  &__row {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding: $padding-sm 0;
    border-bottom: $border-sm solid $border-color;
  }

  &__label {
    @include title-md;
    text-transform: uppercase;
    color: $muted;
  }

  &__value {
    @include title-xl;
    color: $muted;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;

    &--lead { color: $text-color; }
    &--p0.stat-bars__value--lead { color: $accent; }
  }

  &__track {
    height: 8px;
    display: flex;
    border-radius: $radius-xs;
    background: $surface;
  }

  &__fill {
    border-radius: $radius-xs;
    opacity: 0.4;

    &--lead { opacity: 1; }
    &--rest { flex: 1; }

    @each $i, $color in $player-colors {
      &--p#{$i} { background: $color; }
    }
  }

  // ── Duel ──────────────────────────────────────────────────────────────────
  &__duel-values {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) 72px;
    align-items: baseline;

    .stat-bars__label  { text-align: center; }
    .stat-bars__value--p1 { text-align: right; }
  }

  &__duel-track {
    height: 8px;
    display: flex;
    gap: 2px;
  }

  // ── One bar per player ────────────────────────────────────────────────────
  &__line {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) 56px;
    align-items: center;
    gap: $gap-xs;

    .stat-bars__value { @include title-lg; text-align: right; }
  }

  &__name {
    @include text-sm;
    font-weight: 600;
    color: $muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--lead { color: $text-color; }
  }

  // ── Desktop table ─────────────────────────────────────────────────────────
  &--table &__title { @include title-xxl; }

  &__table-row {
    display: grid;
    grid-template-columns: 150px repeat(var(--count), minmax(0, 1fr));
    align-items: center;
    gap: $gap-md;
  }

  &__table-head {
    padding: $padding-sm 0 $padding-xs;
    border-bottom: $border-sm solid $border-color;
  }

  &__player {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    min-width: 0;
    @include title-md;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__swatch {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    border-radius: $radius-xs;

    @each $i, $color in $player-colors {
      &--p#{$i} { background: $color; }
    }
  }

  &__cell {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    min-width: 0;
  }

  &--table &__label { @include text-md; }
  &--table &__value { @include title-xxl; }
}
</style>
