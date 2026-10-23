<script setup>
import { computed } from 'vue'
import { formatZoneLabel } from '../../composables/useWarmup.js'

const props = defineProps({
  zoneRecapStats: { type: Array, required: true },
  sessionStats: { type: Object, required: true },
  durationMs: { type: Number, default: 0 },
})

defineEmits(['restart', 'home'])

// Sectors whose singles are dark on a real board (their doubles/triples are red)
const DARK_SECTORS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

const TYPE_NAMES = { A: 'Secteur', S: 'Simple', D: 'Double', T: 'Triple' }
const BULL_NAMES = { B: 'Bull', SB: 'Demi-bull', AB: 'Bull (tout)' }

function formatDuration(ms) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} s`
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`
}

// Chip and gauge follow the colors of the zone on the board
function zoneTone(zones) {
  if (zones.length > 1) return 'multi'
  const [zone] = zones
  if (zone.sector === null) return zone.type === 'SB' ? 'green' : 'red'
  const dark = DARK_SECTORS.has(zone.sector)
  if (zone.type === 'A' || zone.type === 'S') return dark ? 'dark' : 'light'
  return dark ? 'red' : 'green'
}

function zoneChip(zones) {
  if (zones.length > 1) return `×${zones.length}`
  const [zone] = zones
  if (zone.sector === null) return zone.type === 'SB' ? '25' : '50'
  return String(zone.sector)
}

function zoneName(zones) {
  if (zones.length > 1) return zones.map(formatZoneLabel).join(' + ')
  const [zone] = zones
  if (zone.sector === null) return BULL_NAMES[zone.type]
  return `${TYPE_NAMES[zone.type]} ${zone.sector}`
}

const rows = computed(() => props.zoneRecapStats.map(z => ({
  tone: zoneTone(z.zones),
  chip: zoneChip(z.zones),
  name: zoneName(z.zones),
  accuracy: z.accuracy,
  stats: [
    { label: 'Temps', value: formatDuration(z.durationMs) },
    { label: 'Jetées', value: z.total },
    { label: 'Touchées', value: z.hits },
    { label: 'Points', value: z.points ?? 0 },
    { label: 'Série', value: z.bestStreak ?? 0 },
  ],
})))

const totals = computed(() => [
  { label: 'Temps', value: formatDuration(props.durationMs) },
  { label: 'Jetées', value: props.sessionStats.total },
  { label: 'Touchées', value: props.sessionStats.hits },
  { label: 'Précision', value: `${props.sessionStats.accuracy} %` },
  { label: 'Points', value: props.sessionStats.points },
  { label: 'Meilleure série', value: props.sessionStats.bestStreak },
])

const zoneCount = computed(() => props.zoneRecapStats.length)
</script>

<template>
  <div class="warmup-recap">
    <section class="warmup-recap__hero">
      <span class="warmup-recap__title">Récap de la session</span>
      <div class="warmup-recap__headline">
        <span class="warmup-recap__percent">{{ sessionStats.accuracy }}<span class="warmup-recap__percent-sign">%</span></span>
        <div class="warmup-recap__badge">
          <span class="warmup-recap__badge-value">{{ zoneCount }}</span>
          <span class="warmup-recap__badge-label">zone{{ zoneCount > 1 ? 's' : '' }} travaillée{{ zoneCount > 1 ? 's' : '' }}</span>
        </div>
      </div>
      <div class="warmup-recap__totals">
        <div v-for="t in totals" :key="t.label" class="warmup-recap__total">
          <span class="warmup-recap__total-value">{{ t.value }}</span>
          <span class="warmup-recap__total-label">{{ t.label }}</span>
        </div>
      </div>
    </section>

    <section class="warmup-recap__details">
      <div class="warmup-recap__list-head">
        <h2 class="warmup-recap__list-title">Récap par zones</h2>
        <span class="warmup-recap__list-count">{{ zoneCount }} zone{{ zoneCount > 1 ? 's' : '' }}</span>
      </div>

      <ul class="warmup-recap__list">
        <li v-for="(row, i) in rows" :key="i" class="warmup-recap__row" :class="`warmup-recap__row--${row.tone}`">
          <div class="warmup-recap__row-main">
            <span class="warmup-recap__chip">{{ row.chip }}</span>
            <div class="warmup-recap__gauge">
              <div class="warmup-recap__gauge-head">
                <span class="warmup-recap__name"><span class="warmup-recap__muted">{{ i + 1 }}.</span> {{ row.name }}</span>
                <span class="warmup-recap__accuracy">{{ row.accuracy }} %</span>
              </div>
              <div class="warmup-recap__bar">
                <div class="warmup-recap__bar-fill" :style="{ width: `${row.accuracy}%` }" />
              </div>
            </div>
          </div>
          <div class="warmup-recap__row-stats">
            <div v-for="s in row.stats" :key="s.label" class="warmup-recap__row-stat">
              <span class="warmup-recap__row-value">{{ s.value }}</span>
              <span class="warmup-recap__row-label">{{ s.label }}</span>
            </div>
          </div>
        </li>
      </ul>

      <div class="warmup-recap__actions">
        <button class="warmup-recap__action warmup-recap__action--primary" @click="$emit('restart')">Recommencer</button>
        <button class="warmup-recap__action warmup-recap__action--outline" @click="$emit('home')">Accueil</button>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.warmup-recap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  &__hero {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: $padding-xs $padding-md $padding-md;
    background: $blue;
    color: $white;
  }

  &__title { @include title-lg; }

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

  &__percent-sign { @include display-xs; }

  &__badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    background: $white;
    color: $blue;
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

  &__totals {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: $gap-sm;
    padding-top: $padding-sm;
    border-top: $border-md solid rgba($white, 0.3);
  }

  &__total {
    display: flex;
    flex-direction: column;
  }

  &__total-value {
    @include title-xxl;
    line-height: 1;
  }

  &__total-label {
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

  &__list-title { @include title-lg; }

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

  // Zone colors, as on the board: chip background + gauge accent
  &__row {
    --zone-bg: #{$dart-black};
    --zone-fg: #{$white};
    --zone-border: #{$dart-black};
    --zone-accent: #{$dart-black};

    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    background: $surface;

    &--light {
      --zone-bg: #{$dart-cream-chip};
      --zone-fg: #{$dart-cream-text};
      --zone-border: #{$border-color};
      --zone-accent: #{$dart-cream-accent};
    }

    &--red {
      --zone-bg: #{$dart-red};
      --zone-border: #{$dart-red};
      --zone-accent: #{$dart-red};
    }

    &--green {
      --zone-bg: #{$dart-green};
      --zone-border: #{$dart-green};
      --zone-accent: #{$dart-green};
    }

    &--multi {
      --zone-bg: #{$blue};
      --zone-border: #{$blue};
      --zone-accent: #{$blue};
    }
  }

  &__row-main {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__chip {
    @include title-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border: $border-md solid var(--zone-border);
    border-radius: $radius-sm;
    background: var(--zone-bg);
    color: var(--zone-fg);
  }

  &__gauge {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__gauge-head {
    display: flex;
    justify-content: space-between;
    gap: $gap-xs;
  }

  &__name { @include title-md; }

  &__muted { color: $muted; }

  &__accuracy {
    @include title-lg;
    color: var(--zone-accent);
  }

  &__bar {
    height: 8px;
    background: $border-color;
  }

  &__bar-fill {
    height: 100%;
    background: var(--zone-accent);
  }

  &__row-stats {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    text-align: center;
  }

  &__row-value {
    @include title-md;
    display: block;
    line-height: 1.1;
  }

  &__row-label {
    @include text-xxs;
    color: $muted;
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
      background: $blue;
      color: $white;
    }

    &--outline {
      border: $border-md solid $black;
      color: $black;
    }
  }
}

@media (min-width: $bp-laptop) {
  .warmup-recap {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    &__hero {
      justify-content: flex-end;
      gap: $gap-xxl;
      padding: $padding-xxl;
    }

    &__title          { @include title-xxl; }
    &__percent        { @include display-xxl; }
    &__percent-sign   { @include display-md; }
    &__badge          { padding: $padding-md $padding-xl; }
    &__badge-value    { @include display-sm; }
    &__badge-label    { @include text-sm; }
    &__totals         { row-gap: $gap-xl; padding-top: $padding-lg; }
    &__total-value    { @include display-xs; }
    &__total-label    { @include text-md; }

    &__details {
      gap: $gap-sm;
      padding: $padding-xxl;
    }

    &__list-title { @include title-xl; }
    &__list-count { @include text-md; }

    &__row     { padding: $padding-sm $padding-md; }
    &__chip    { width: 48px; height: 48px; }
    &__name    { @include title-xl; }
    &__accuracy { @include title-xxl; }
    &__row-value { @include title-lg; }
    &__row-label { @include text-xs; }

    &__action {
      @include title-xl;
      height: 64px;
    }
  }
}
</style>
