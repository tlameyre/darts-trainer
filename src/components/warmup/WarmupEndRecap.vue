<script setup>
import { computed } from 'vue'
import { formatZoneLabel } from '../../composables/useWarmup.js'
import { RED_SECTORS } from '../../data/dartboardSectors.js'
import { formatDuration } from '../../utils/formatDuration.js'
import GameRecap from '../game/GameRecap.vue'

const props = defineProps({
  zoneRecapStats: { type: Array, required: true },
  sessionStats: { type: Object, required: true },
  durationMs: { type: Number, default: 0 },
  hideActions: { type: Boolean, default: false },
})

defineEmits(['restart', 'home'])

const TYPE_NAMES = { A: 'Secteur', S: 'Simple', D: 'Double', T: 'Triple' }
const BULL_NAMES = { B: 'Bull', SB: 'Demi-bull', AB: 'Bull (tout)' }

// Chip and gauge follow the colors of the zone on the board
function zoneTone(zones) {
  if (zones.length > 1) return 'multi'
  const [zone] = zones
  if (zone.sector === null) return zone.type === 'SB' ? 'green' : 'red'
  const dark = RED_SECTORS.has(zone.sector)
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
const zonesLabel = computed(() => `zone${zoneCount.value > 1 ? 's' : ''}`)
</script>

<template>
  <GameRecap
    tone="blue"
    :percent="sessionStats.accuracy"
    :badge-value="zoneCount"
    :badge-label="`${zonesLabel} travaillée${zoneCount > 1 ? 's' : ''}`"
    :stats="totals"
    :stats-columns="3"
    list-title="Récap par zones"
    :list-count="`${zoneCount} ${zonesLabel}`"
    primary-label="Recommencer"
    :hide-actions="hideActions"
    @primary="$emit('restart')"
    @home="$emit('home')"
  >
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
  </GameRecap>
</template>

<style lang="scss" scoped>
.warmup-recap {
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
}

@media (min-width: $bp-laptop) {
  .warmup-recap {
    &__row     { padding: $padding-sm $padding-md; }
    &__chip    { width: 48px; height: 48px; }
    &__name    { @include title-xl; }
    &__accuracy { @include title-xxl; }
    &__row-value { @include title-lg; }
    &__row-label { @include text-xs; }
  }
}
</style>
