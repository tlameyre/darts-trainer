<script setup>
import { ref, watch } from 'vue'
import GameEntryBar from './GameEntryBar.vue'
import SectorPad from './SectorPad.vue'
import SvgDartboard from '../x01/SvgDartboard.vue'
import NumPad from '../NumPad.vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  darts:      { type: Array,   required: true },
  valueKey:   { type: String,  default: 'label' },
  bust:       { type: Boolean, default: false },
  locked:     { type: Boolean, default: false },
  // Dart-by-dart input only (no volley total), e.g. when each dart must be analysed
  forceDart:  { type: Boolean, default: false },
  // Next tap picks the aimed target, not the hit: miss/bust are disabled
  targeting:  { type: Boolean, default: false },
})

const emit = defineEmits(['dart', 'miss', 'bust', 'validate', 'undo'])

const mode = ref('volley')
const volleyStr = ref('')

// Le tour peut passer à l'adversaire pendant la saisie (match en ligne)
watch(() => props.locked, (locked) => {
  if (locked) volleyStr.value = ''
})

watch(() => props.forceDart, (forced) => {
  if (!forced || mode.value !== 'volley') return
  mode.value = 'dart'
  volleyStr.value = ''
}, { immediate: true })

function selectMode(newMode) {
  if (props.locked || props.bust) return
  mode.value = newMode
  volleyStr.value = ''
}

function appendDigit(d) {
  if (props.locked || props.bust || volleyStr.value.length >= 3) return
  const next = volleyStr.value + d
  if (Number(next) > 180) return
  volleyStr.value = next
}

function submitVolley() {
  if (props.locked || props.bust || !volleyStr.value) return
  emit('validate', Number(volleyStr.value))
  volleyStr.value = ''
}

function erase() {
  if (mode.value === 'volley') volleyStr.value = volleyStr.value.slice(0, -1)
  else emit('undo')
}

// Undo key: back to the previous visit (or dart), dropping any typed total
function undo() {
  volleyStr.value = ''
  emit('undo')
}
</script>

<template>
  <div class="game-input" :class="{ 'game-input--targeting': targeting }">
    <GameEntryBar
      :mode="mode"
      :modes="forceDart ? ['dart', 'board'] : undefined"
      :darts="darts"
      :value-key="valueKey"
      :value="volleyStr"
      :bust="bust"
      :locked="locked"
      @select="selectMode"
      @erase="erase"
    />

    <template v-if="mode === 'volley'">
      <button class="game-input__bust" :disabled="locked || bust" @click="emit('bust')">Bust</button>
      <NumPad :locked="locked || bust" @digit="appendDigit" @undo="undo" @validate="submitVolley" />
    </template>

    <SectorPad
      v-else-if="mode === 'dart'"
      class="game-input__target"
      :locked="locked || bust"
      :miss-locked="targeting"
      @dart="emit('dart', $event)"
      @miss="emit('miss')"
      @undo="emit('undo')"
    />

    <template v-else>
      <div class="game-input__board game-input__target">
        <SvgDartboard fill :locked="locked || bust" @dart="emit('dart', $event)" />
      </div>
      <div class="game-input__board-actions">
        <button class="game-input__key game-input__key--undo" aria-label="Annuler" @click="emit('undo')">
          <AppIcon name="undo" :width="24" :height="24" />
        </button>
        <button class="game-input__key game-input__key--miss" :disabled="locked || bust || targeting" @click="emit('miss')">
          Raté
        </button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.game-input {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &--targeting &__target {
    outline: $border-md dashed var(--game-color, #{$accent});
    outline-offset: $padding-xxs;
    border-radius: $radius-sm;
  }

  &__bust {
    flex-shrink: 0;
    height: 52px;
    border-radius: $radius-sm;
    background: $black;
    color: $white;
    @include title-lg;
    letter-spacing: $tracking-sm;
    transition: opacity 0.15s;

    &:active:not(:disabled) { opacity: 0.8; }
    &:disabled { opacity: 0.4; }
  }

  &__board {
    flex: 1;
    min-height: 0;
    container-type: size;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__board-actions {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__key {
    height: 46px;
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
  .game-input {
    gap: $gap-md;

    &__bust { height: 60px; @include title-xxl; }
    &__key  { height: 64px; @include title-xxxl; }
  }
}
</style>
