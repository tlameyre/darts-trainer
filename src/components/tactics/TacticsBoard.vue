<script setup>
import { computed } from 'vue'

const props = defineProps({
  // [{ name, zones: [{id,label,visits,closed}], activeZoneId, isCurrent }]
  players: { type: Array, required: true },
})

// Ordre des colonnes autour de la colonne "Zone" :
// - 2 joueurs : joueur | Zone | joueur (spine centrale)
// - 1, 3 ou 4 joueurs : Zone tout à gauche, puis les joueurs
const columns = computed(() => {
  const n = props.players.length
  const zoneCol = { type: 'zone' }
  if (n === 2) return [{ type: 'player', index: 0 }, zoneCol, { type: 'player', index: 1 }]
  return [zoneCol, ...props.players.map((_, i) => ({ type: 'player', index: i }))]
})

// Colonne "Zone" réduite au minimum, les colonnes joueurs se partagent le reste.
const gridTemplateColumns = computed(() =>
  columns.value.map(c => (c.type === 'zone' ? '64px' : 'minmax(0, 1fr)')).join(' '),
)

const headerCells = computed(() => columns.value.map(col =>
  col.type === 'zone'
    ? { type: 'zone', label: 'Zone' }
    : { type: 'player', label: props.players[col.index].name, isCurrent: props.players[col.index].isCurrent },
))

const tableRows = computed(() => {
  const zones = props.players[0]?.zones ?? []
  return zones.map((zone, rowIndex) => ({
    key: zone.id,
    isSpecial: !/^\d+$/.test(zone.id),
    cells: columns.value.map((col) => {
      if (col.type === 'zone') return { type: 'zone', label: zone.label }
      const player = props.players[col.index]
      return {
        type:    'mark',
        visits:  player.zones[rowIndex].visits,
        closed:  player.zones[rowIndex].closed,
        active:  zone.id === player.activeZoneId,
        current: player.isCurrent,
      }
    }),
  }))
})
</script>

<template>
  <div class="tactics-board">
    <div class="tactics-board__grid" role="table" aria-label="Plateau Tactics" :style="{ gridTemplateColumns }">
      <div
        v-for="(h, i) in headerCells" :key="`h${i}`"
        class="tactics-board__cell tactics-board__cell--head"
        :class="{
          'tactics-board__cell--label': h.type === 'zone',
          'tactics-board__cell--head-current': h.type === 'player' && h.isCurrent,
        }"
      >
        {{ h.label }}
      </div>

      <template v-for="row in tableRows" :key="row.key">
        <div
          v-for="(cell, i) in row.cells" :key="i"
          class="tactics-board__cell"
          :class="cell.type === 'zone'
            ? ['tactics-board__cell--label', 'tactics-board__cell--zone', { 'tactics-board__cell--special': row.isSpecial }]
            : ['tactics-board__cell--mark', {
                'tactics-board__cell--mark-current': cell.current,
                'tactics-board__cell--mark-closed': cell.closed,
                'tactics-board__cell--mark-active': cell.active && !cell.closed,
              }]"
        >
          <template v-if="cell.type === 'zone'">{{ cell.label }}</template>
          <svg v-else class="tactics-board__mark" viewBox="0 0 24 24" aria-hidden="true">
            <line v-if="cell.visits >= 1" x1="5" y1="5" x2="19" y2="19" />
            <line v-if="cell.visits >= 2" x1="19" y1="5" x2="5" y2="19" />
            <circle v-if="cell.visits >= 3" cx="12" cy="12" r="10" fill="none" />
          </svg>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";

.tactics-board {
  flex: 1;
  padding: 0 $padding-sm $padding-sm;

  &__grid {
    display: grid;
    gap: 1px;
    padding: 1px;
    border-radius: $radius-sm;
    background: color.adjust($mode-tactics, $lightness: -10%);
    overflow: hidden;
    height: 100%;
  }

  &__cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    color: $white;
    text-align: center;
  }

  &__cell--label {
    background: color.adjust($mode-tactics, $lightness: -4%);
  }

  &__cell--head {
    @include title-sm;
    padding: 0 $padding-xxs;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__cell--head.tactics-board__cell--label {
    @include text-xxs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.85;
  }

  &__cell--head-current {
    background: $white;
    color: $mode-tactics;
  }

  &__cell--zone {
    @include title-sm;
  }

  &__cell--special {
    @include title-xxs;
  }

  &__cell--mark {
    background: $mode-tactics;
  }

  &__cell--mark-current {
    background: color.adjust($mode-tactics, $lightness: 8%);
  }

  &__cell--mark-active {
    background: $white;
  }
  &__cell--mark-active::before {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 3px;
  }

  &__mark {
    position: relative;
    height: 100%;
    max-height: 18px;
    aspect-ratio: 1;
    stroke: $white;
    stroke-width: 2.5;
    fill: none;
    stroke-linecap: round;

    .tactics-board__cell--mark-closed & {
      stroke: $white;
    }

    .tactics-board__cell--mark-active & {
      stroke: $mode-tactics;
    }
  }
}

@media (min-width: $bp-laptop) {
  .tactics-board {
    padding: 0;

    &__cell--head { @include title-md; }
    &__cell--zone { @include title-md; }
    &__cell--special { @include title-sm; }
    &__mark { max-height: 22px; }
  }
}
</style>
