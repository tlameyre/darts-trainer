<script setup>
import { computed } from 'vue'
import AppButton from './AppButton.vue'

const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

const SECTOR_ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
]

const TYPES_NUM = [
  { id: 'A', label: 'Tout' },
  { id: 'S', label: 'Simple' },
  { id: 'D', label: 'Double' },
  { id: 'T', label: 'Triple' },
]
const TYPES_BULL = [
  { id: 'AB', label: 'Tout' },
  { id: 'SB', label: 'Outer (25)' },
  { id: 'B', label: 'Bull (50)' },
]

const props = defineProps({
  modelValue: { required: true },
  multiple:   { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const availableTypes = computed(() => {
  const first = props.multiple ? props.modelValue[0] : props.modelValue
  return first?.sector === null ? TYPES_BULL : TYPES_NUM
})

function selectSector(sector) {
  if (!props.multiple) {
    let type = props.modelValue.type
    if (sector === null && !['AB', 'B', 'SB'].includes(type)) type = 'AB'
    if (sector !== null && !['A', 'S', 'D', 'T'].includes(type)) type = 'D'
    emit('update:modelValue', { sector, type })
    return
  }
  const isBullKind = sector === null
  const currentIsBull = props.modelValue[0]?.sector === null
  if (isBullKind !== currentIsBull) {
    emit('update:modelValue', [{ sector, type: isBullKind ? 'AB' : 'A' }])
    return
  }
  const idx = props.modelValue.findIndex(z => z.sector === sector)
  if (idx >= 0) {
    if (props.modelValue.length > 1) emit('update:modelValue', props.modelValue.filter((_, i) => i !== idx))
  } else if (props.modelValue.length < 5) {
    const sharedType = props.modelValue[0]?.type ?? 'A'
    emit('update:modelValue', [...props.modelValue, { sector, type: sharedType }])
  }
}

function selectType(type) {
  if (!props.multiple) {
    emit('update:modelValue', { ...props.modelValue, type })
  } else {
    emit('update:modelValue', props.modelValue.map(z => ({ ...z, type })))
  }
}

function cellSelected(n) {
  if (!props.multiple) return props.modelValue.sector === n
  return props.modelValue.some(z => z.sector === n)
}

function activeType() {
  if (!props.multiple) return props.modelValue.type
  return props.modelValue[0]?.type
}
</script>

<template>
  <div class="zone-picker">
    <div class="zone-picker__types">
      <AppButton v-for="t in availableTypes" :key="t.id" size="small" variant="ghost" :active="activeType() === t.id"
        @click="selectType(t.id)">{{ t.label }}</AppButton>
    </div>

    <div class="zone-picker__grid">
      <template v-for="row in SECTOR_ROWS" :key="row[0]">
        <button v-for="n in row" :key="n" class="zone-picker__cell"
          :class="{ 'zone-picker__cell--selected': cellSelected(n) }" @click="selectSector(n)">{{ n }}</button>
      </template>
      <button class="zone-picker__cell zone-picker__cell--bull"
        :class="{ 'zone-picker__cell--selected': modelValue.sector === null }" @click="selectSector(null)">
        BULL
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.zone-picker {
  display: flex;
  flex-direction: column;
  gap: $gap-xl;

  &__grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border-radius: $radius-sm;
    overflow: hidden;
    border: $border-md solid $white;
  }

  &__cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xl;
    background: $bg;
    color: $white;
    border-right: $border-md solid $white;
    border-bottom: $border-md solid $white;
    transition: filter 0.1s;

    &:nth-child(5n) {
      border-right: none;
    }

    &:active {
      filter: brightness(1.3);
    }

    &--selected {
      background: $blue;
    }

    &--bull {
      grid-column: 1 / -1;
      aspect-ratio: unset;
      padding: $padding-sm;
      @include title-lg;
      border-right: none;
      border-bottom: none;
    }
  }

  &__types {
    display: flex;
    gap: $gap-xs;

    :deep(.btn) {
      flex: 1;
    }
  }
}

@media (min-width: $bp-tablet) {
  .zone-picker {
    flex: 1;

    &__grid {
      flex: 1;
    }

    &__cell {
      @include title-xxl;
      aspect-ratio: inherit
    }

    &__cell--bull {
      padding: 0;
      @include title-xl;
    }
  }
}
</style>
