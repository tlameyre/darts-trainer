<script setup>
import { ref } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  locked:     { type: Boolean, default: false },
  // Next tap picks the aimed target: a miss can't be aimed
  missLocked: { type: Boolean, default: false },
  // Hides the undo / miss keys when the parent provides its own
  actions:    { type: Boolean, default: true },
})

const emit = defineEmits(['dart', 'miss', 'undo'])

const MODIFIERS = [
  { id: 'single', label: 'Simple', multiplier: 1, prefix: '' },
  { id: 'double', label: 'Double', multiplier: 2, prefix: 'D' },
  { id: 'triple', label: 'Triple', multiplier: 3, prefix: 'T' },
]

const SECTORS = Array.from({ length: 20 }, (_, i) => i + 1)

const modifier = ref('single')

function tapSector(sector) {
  if (props.locked) return
  const mod = MODIFIERS.find(m => m.id === modifier.value)
  emit('dart', { type: mod.id, sector, pts: sector * mod.multiplier, label: `${mod.prefix}${sector}` })
  modifier.value = 'single'
}

function tapBull(pts) {
  if (props.locked) return
  emit('dart', { type: 'bull', sector: null, pts, label: pts === 50 ? 'Bull' : 'Outer' })
  modifier.value = 'single'
}
</script>

<template>
  <div class="sector-pad">
    <div class="sector-pad__mods">
      <button
        v-for="mod in MODIFIERS"
        :key="mod.id"
        class="sector-pad__mod"
        :class="{ 'sector-pad__mod--active': modifier === mod.id }"
        :aria-pressed="modifier === mod.id"
        @click="modifier = mod.id"
      >{{ mod.label }}</button>
      <button class="sector-pad__mod sector-pad__mod--outer" :disabled="locked" @click="tapBull(25)">SB</button>
      <button class="sector-pad__mod sector-pad__mod--bull" :disabled="locked" @click="tapBull(50)">B</button>
    </div>

    <div class="sector-pad__grid">
      <button
        v-for="n in SECTORS"
        :key="n"
        class="sector-pad__key"
        :disabled="locked"
        @click="tapSector(n)"
      >{{ n }}</button>
      <template v-if="actions">
        <button class="sector-pad__key sector-pad__key--undo" aria-label="Annuler" @click="emit('undo')">
          <AppIcon name="undo" :width="24" :height="24" />
        </button>
        <button class="sector-pad__key sector-pad__key--miss" :disabled="locked || missLocked" @click="emit('miss')">
          Raté
        </button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sector-pad {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &__mods {
    display: flex;
    gap: $gap-xs;
  }

  &__mod {
    flex: 1;
    height: 44px;
    border-radius: $radius-sm;
    border: $border-md solid $border-color;
    color: $text-color;
    @include title-md;

    &--active {
      background: $text-color;
      border-color: $text-color;
      color: $white;
    }

    &--outer,
    &--bull {
      flex: 0.8;
      color: $white;
    }

    &--outer { background: $dart-green; border-color: $dart-green; }
    &--bull  { background: $dart-red; border-color: $dart-red; }

    &:disabled { opacity: 0.4; }
  }

  &__grid {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    grid-auto-rows: 1fr;
    gap: $gap-xs;
  }

  &__key {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    border: $border-md solid $text-color;
    background: $bg;
    color: $text-color;
    @include title-xl;
    transition: transform 0.08s, opacity 0.15s;

    &:active:not(:disabled) { transform: scale(0.95); }
    &:disabled { opacity: 0.4; }

    &--undo {
      background: $surface;
      border-color: $border-color;
    }

    &--miss { grid-column: span 4; }
  }
}

@media (min-width: $bp-laptop) {
  .sector-pad {
    &__mod { height: 64px; @include title-xxl; }
    &__key { @include title-xxxl; }
    &__key--undo :deep(svg) { width: 36px; height: 36px; }
  }
}
</style>
