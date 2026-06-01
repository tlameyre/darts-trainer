<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['dart'])


const TABS = [
  { id: 'single', label: 'S', multiplier: 1 },
  { id: 'double', label: 'D', multiplier: 2 },
  { id: 'triple', label: 'T', multiplier: 3 },
]

const GRID_ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
]

const activeTab = ref('single')
const pressedKey = ref(null)
let _pressTimer = null

const currentMultiplier = computed(
  () => TABS.find(t => t.id === activeTab.value)?.multiplier ?? 1
)


function flash(key) {
  clearTimeout(_pressTimer)
  pressedKey.value = key
  _pressTimer = setTimeout(() => { pressedKey.value = null }, 160)
}

function tapSector(sector) {
  if (props.locked) return
  const tab = TABS.find(t => t.id === activeTab.value)
  flash(`s-${sector}`)
  emit('dart', {
    type: tab.id,
    sector,
    pts: sector * tab.multiplier,
    label: tab.id === 'single' ? String(sector) : `${tab.id === 'double' ? 'D' : 'T'}${sector}`,
  })
  activeTab.value = 'single'
}

function tapBull() {
  if (props.locked) return
  flash('bull')
  emit('dart', { type: 'bull', sector: null, pts: 50, label: 'Bull' })
}

function tapOuter() {
  if (props.locked) return
  flash('outer')
  emit('dart', { type: 'bull', sector: null, pts: 25, label: 'Outer' })
}
</script>

<template>
  <div class="sector-grid">
    <button v-for="tab in TABS" :key="tab.id" class="sector-grid__tab"
      :class="{ 'sector-grid__tab--active': activeTab === tab.id }" @click="activeTab = tab.id">{{ tab.label }}</button>
    <button class="sector-grid__tab sector-grid__tab--sb"
      :class="{ 'sector-grid__tab--pressed': pressedKey === 'outer' }" @click="tapOuter">SB</button>
    <button class="sector-grid__tab sector-grid__tab--b" :class="{ 'sector-grid__tab--pressed': pressedKey === 'bull' }"
      @click="tapBull">B</button>
    <template v-for="row in GRID_ROWS" :key="row[0]">
      <button v-for="n in row" :key="n" class="sector-grid__cell"
        :class="{ 'sector-grid__cell--pressed': pressedKey === `s-${n}` }" @click="tapSector(n)">
        <span class="sector-grid__cell-num">{{ n }}</span>
        <span v-if="activeTab !== 'single'" class="sector-grid__cell-pts">{{ n * currentMultiplier }}</span>
      </button>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.sector-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-self: start;
  width: 100%;
  border-top: $border-md solid $white;
  border-left: $border-md solid $white;
}

.sector-grid__tab {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  @include title-xxl;
  color: $white;
  border-right: $border-md solid $white;
  border-bottom: $border-md solid $white;
  transition: background 0.12s, color 0.12s, filter 0.1s;

  &--active {
    color: $white;
    background: rgba($white, 0.12);
  }

  &--sb {
    background: $dart-green;
    color: $white;
  }

  &--b {
    background: $dart-red;
    color: $white;
  }

  &--pressed {
    filter: brightness(1.35);
  }
}

.sector-grid__cell {
  aspect-ratio: 1;
  display: flex;
  gap: $gap-xxs;
  align-items: center;
  justify-content: center;
  border-right: $border-md solid $white;
  border-bottom: $border-md solid $white;
  transition: filter 0.1s, transform 0.1s;

  background: $bg;
  color: $white;

  &--pressed {
    filter: brightness(1.45);
  }

  &-num {
    @include title-xxl;
    font-variant-numeric: tabular-nums;
  }

  &-pts {
    @include title-xs;
  }
}

@media (min-width: $bp-laptop) {
  .sector-grid {
    flex: 1;
  }

  .sector-grid__tab,
  .sector-grid__cell {
    flex: 1;
    aspect-ratio: inherit;
  }

  .sector-grid__tab { @include title-xxxl; }
  .sector-grid__cell-num { @include title-xxxl; }
  .sector-grid__cell-pts { @include title-sm; }
}
</style>
