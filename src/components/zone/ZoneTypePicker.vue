<script setup>
import { useZoneSelection } from '../../composables/useZoneSelection.js'

const props = defineProps({
  modelValue: { required: true },
  multiple: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const { activeType, isBullSelected, selectType } = useZoneSelection(props, emit)

// Rings of the mini target, outside in: double, outer single, triple, inner single
const RINGS = [
  { id: 'd', r: 28, width: 3 },
  { id: 's', r: 21.5, width: 8 },
  { id: 't', r: 15.5, width: 2 },
  { id: 's', r: 9.5, width: 8 },
]

const TYPES = [
  { id: 'A', label: 'Tout', rings: ['d', 's', 't'] },
  { id: 'S', label: 'Simple', rings: ['s'] },
  { id: 'D', label: 'Double', rings: ['d'] },
  { id: 'T', label: 'Triple', rings: ['t'] },
]
</script>

<template>
  <div class="zone-types">
    <button
      v-for="t in TYPES"
      :key="t.id"
      class="zone-types__tile"
      :class="{ 'zone-types__tile--active': activeType === t.id }"
      :aria-pressed="activeType === t.id"
      :disabled="t.id === 'T' && isBullSelected"
      @click="selectType(t.id)"
    >
      <svg class="zone-types__icon" viewBox="0 0 64 64" aria-hidden="true">
        <circle
          v-for="(ring, i) in RINGS"
          :key="i"
          cx="32" cy="32" :r="ring.r" fill="none" :stroke-width="ring.width"
          :class="t.rings.includes(ring.id) ? 'zone-types__ring--on' : 'zone-types__ring--off'"
        />
        <circle cx="32" cy="32" r="4" class="zone-types__bull" />
      </svg>
      <span class="zone-types__label">{{ t.label }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.zone-types {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: $gap-xs;

  &__tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-xs $padding-xxs;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: transparent;
    color: $text-color;
    transition: background 0.15s, border-color 0.15s;

    &:disabled {
      opacity: 0.4;
      pointer-events: none;
    }
  }

  &__icon {
    width: 56px;
    height: 56px;
  }

  &__ring--on  { stroke: $blue; }
  &__ring--off { stroke: $border-color; }
  &__bull      { fill: $border-color; }

  &__label {
    @include title-md;
  }

  &__tile--active {
    background: $blue;
    border-color: $blue;
    color: $white;

    .zone-types__ring--on  { stroke: $white; }
    .zone-types__ring--off { stroke: rgba($white, 0.3); }
    .zone-types__bull      { fill: rgba($white, 0.3); }
  }
}

@media (min-width: $bp-laptop) {
  .zone-types {
    &__tile  { padding: $padding-md $padding-xxs; }
    &__icon  { width: 80px; height: 80px; }
    &__label { @include title-xl; }
  }
}
</style>
