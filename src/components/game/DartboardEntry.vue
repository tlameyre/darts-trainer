<script setup>
import SectorPad from './SectorPad.vue'
import SvgDartboard from '../x01/SvgDartboard.vue'
import AppIcon from '../AppIcon.vue'

defineProps({
  mode: { type: String, default: 'board', validator: v => ['dart', 'board'].includes(v) },
  locked: Boolean,
  // Next tap picks the aimed target: a miss can't be aimed
  missLocked: Boolean,
  // Highlights the area the next tap goes to
  targeting: Boolean,
  // Undo / miss keys; hidden when the screen already has them (e.g. in the entry bar)
  actions: { type: Boolean, default: true },
  zoomable: Boolean,
})

const emit = defineEmits(['dart', 'miss', 'undo'])
</script>

<template>
  <div class="dartboard-entry" :class="{ 'dartboard-entry--targeting': targeting }">
    <SectorPad
      v-if="mode === 'dart'"
      class="dartboard-entry__target"
      :locked="locked"
      :miss-locked="missLocked"
      :actions="actions"
      @dart="emit('dart', $event)"
      @miss="emit('miss')"
      @undo="emit('undo')"
    />

    <template v-else>
      <div class="dartboard-entry__board dartboard-entry__target">
        <SvgDartboard fill :zoomable="zoomable" :locked="locked" @dart="emit('dart', $event)" />
      </div>
      <div v-if="actions" class="dartboard-entry__actions">
        <button class="dartboard-entry__key dartboard-entry__key--undo" aria-label="Annuler" @click="emit('undo')">
          <AppIcon name="undo" :width="24" :height="24" />
        </button>
        <button class="dartboard-entry__key dartboard-entry__key--miss" :disabled="locked || missLocked" @click="emit('miss')">
          Raté
        </button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.dartboard-entry {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &--targeting &__target {
    outline: $border-md dashed var(--game-color, var(--tone, #{$accent}));
    outline-offset: $padding-xxs;
    border-radius: $radius-sm;
  }

  &__board {
    flex: 1;
    min-height: 0;
    container-type: size;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__actions {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
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

    &:disabled { opacity: 0.4; }

    &--undo {
      background: $surface;
      border-color: $border-color;
    }

    &--miss { grid-column: span 4; }
  }
}

@media (min-width: $bp-laptop) {
  .dartboard-entry {
    gap: $gap-md;

    &__key { @include title-xxxl; }
  }
}
</style>
