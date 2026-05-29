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
  modelValue: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

const availableTypes = computed(() =>
  props.modelValue.sector === null ? TYPES_BULL : TYPES_NUM
)

function selectSector(sector) {
  let type = props.modelValue.type
  if (sector === null && !['AB', 'B', 'SB'].includes(type)) type = 'AB'
  if (sector !== null && !['A', 'S', 'D', 'T'].includes(type)) type = 'D'
  emit('update:modelValue', { sector, type })
}

function selectType(type) {
  emit('update:modelValue', { ...props.modelValue, type })
}

function cellSelected(n) {
  return props.modelValue.sector === n
}
</script>

<template>
  <div class="zone-picker">
    <div class="zone-picker__types">
      <AppButton v-for="t in availableTypes" :key="t.id" size="small" variant="ghost" :active="modelValue.type === t.id"
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
    font-family: $font-title;
    font-size: $title-xl;
    background: $bg;
    color: $white;
    border-right: $border-md solid $white;
    border-bottom: $border-md solid $white;
    transition: filter 0.1s;
    font-weight: 700;

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
      font-size: $title-lg;
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
</style>
