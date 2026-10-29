<script setup>
import { ref, watch } from 'vue'
import GameEntryBar from './GameEntryBar.vue'
import DartboardEntry from './DartboardEntry.vue'
import NumericKeypad from './NumericKeypad.vue'

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
  <div class="game-input">
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
      <NumericKeypad
        left-key="undo"
        :locked="locked || bust"
        @digit="appendDigit"
        @left="undo"
        @validate="submitVolley"
      />
    </template>

    <DartboardEntry
      v-else
      :mode="mode"
      :locked="locked || bust"
      :miss-locked="targeting"
      :targeting="targeting"
      @dart="emit('dart', $event)"
      @miss="emit('miss')"
      @undo="emit('undo')"
    />
  </div>
</template>

<style lang="scss" scoped>
.game-input {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &__bust {
    flex-shrink: 0;
    border-radius: $radius-sm;
    background: $dart-red;
    color: $white;
    @include title-xxl;
    letter-spacing: $tracking-sm;
    transition: opacity 0.15s;
    min-height: 68px;

    &:active:not(:disabled) { opacity: 0.8; }
    &:disabled { opacity: 0.4; }
  }

}

@media (min-width: $bp-laptop) {
  .game-input {
    gap: $gap-md;

    &__bust { @include title-xxxl; min-height: 88px; }
  }
}
</style>
