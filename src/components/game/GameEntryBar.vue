<script setup>
import { ref, computed } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  mode:     { type: String,  default: 'volley' }, // 'volley' | 'dart' | 'board'
  modes:    { type: Array,   default: () => ['volley', 'dart', 'board'] },
  darts:    { type: Array,   default: () => [] },
  valueKey: { type: String,  default: 'label' },
  value:    { type: String,  default: '' },       // typed visit total (volley mode)
  bust:     { type: Boolean, default: false },
  locked:   { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'erase'])

const MODE_OPTIONS = [
  { id: 'volley', icon: 'dialpad',   label: 'Volée' },
  { id: 'dart',   icon: 'numpad',    label: 'Fléchette par fléchette' },
  { id: 'board',  icon: 'dartboard', label: 'Cible' },
]

const options     = computed(() => MODE_OPTIONS.filter(o => props.modes.includes(o.id)))
const currentIcon = computed(() => MODE_OPTIONS.find(o => o.id === props.mode)?.icon ?? 'dialpad')

const canErase = computed(() => !props.locked && !props.bust
  && (props.mode === 'volley' ? props.value.length > 0 : props.darts.length > 0))

const isOpen = ref(false)

function toggleOpen() {
  if (props.bust || props.locked) return
  isOpen.value = !isOpen.value
}

function selectMode(id) {
  isOpen.value = false
  emit('select', id)
}
</script>

<template>
  <div class="entry-bar">
    <button
      class="entry-bar__btn"
      :aria-label="`Mode de saisie : ${options.find(o => o.id === mode)?.label}`"
      :disabled="bust || locked"
      @click="toggleOpen"
    >
      <AppIcon :name="currentIcon" :width="22" :height="22" />
    </button>

    <div v-if="bust" class="entry-bar__bust">Bust !</div>

    <div v-else-if="mode === 'volley'" class="entry-bar__volley">
      <span v-if="value" class="entry-bar__value">{{ value }}</span>
      <span v-else class="entry-bar__placeholder">Score de la volée</span>
      <span class="entry-bar__caret" />
    </div>

    <div v-else class="entry-bar__slots">
      <span
        v-for="i in 3"
        :key="i"
        class="entry-bar__slot"
        :class="{
          'entry-bar__slot--filled': darts[i - 1],
          'entry-bar__slot--next':   !darts[i - 1] && i === darts.length + 1,
        }"
      >
        <template v-if="darts[i - 1]">
          <span class="entry-bar__slot-label">{{ darts[i - 1][valueKey] }}</span>
          <span class="entry-bar__slot-pts">{{ darts[i - 1].pts ?? 0 }}</span>
        </template>
        <span v-else-if="i === darts.length + 1" class="entry-bar__slot-pts">Fléchette {{ i }}</span>
      </span>
    </div>

    <button
      class="entry-bar__btn"
      :aria-label="mode === 'volley' ? 'Effacer le dernier chiffre' : 'Effacer la dernière fléchette'"
      :disabled="!canErase"
      @click="emit('erase')"
    >
      <AppIcon name="delete" :width="22" :height="22" />
    </button>

    <div v-if="isOpen" class="entry-bar__backdrop" @click="isOpen = false" />
    <div v-if="isOpen" class="entry-bar__popover">
      <button
        v-for="option in options"
        :key="option.id"
        class="entry-bar__option"
        :class="{ 'entry-bar__option--active': option.id === mode }"
        @click="selectMode(option.id)"
      >
        <AppIcon :name="option.icon" :width="20" :height="20" />
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.entry-bar {
  // Slot / caret color, overridable by the mode using the bar
  --entry-color: #{$accent};

  position: relative;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 52px;
  align-items: center;
  gap: $gap-sm;
  padding: $padding-sm;
  border-radius: $radius-sm;
  background: $surface;

  &__btn {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $bg;
    color: $text-color;
    transition: opacity 0.15s;

    &:active:not(:disabled) { opacity: 0.6; }
    &:disabled { opacity: 0.4; }
  }

  &__volley {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xxs;
    min-width: 0;
  }

  &__value {
    @include display-xs;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__placeholder {
    @include text-sm;
    color: $input-placeholder;
  }

  &__caret {
    width: $border-lg;
    height: 44px;
    background: var(--entry-color);
    animation: caret-blink 1s steps(1) infinite;
  }

  &__bust {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $error;
    color: $white;
    @include title-xxl;
    letter-spacing: $tracking-sm;
  }

  &__slots {
    display: flex;
    gap: $gap-xs;
    min-width: 0;
  }

  &__slot {
    flex: 1;
    min-width: 0;
    height: 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    border: $border-md dashed $border-color;
    color: var(--entry-color);

    &--next { border-color: var(--entry-color); }

    &--filled {
      border: none;
      background: var(--entry-color);
      color: $white;
    }
  }

  &__slot-label {
    @include title-xxl;
    line-height: 1;
  }

  &__slot-pts {
    @include text-xxs;
    opacity: 0.75;
  }

  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
  }

  &__popover {
    position: absolute;
    left: $padding-sm;
    bottom: calc(100% + #{$gap-xs});
    z-index: 41;
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    min-width: 220px;
    padding: $padding-xs;
    border-radius: $radius-sm;
    background: $bg;
    border: $border-md solid $text-color;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    color: $text-color;
    @include text-sm;
    font-weight: 600;
    text-align: left;

    &--active {
      background: var(--entry-color);
      color: $white;
    }
  }
}

@keyframes caret-blink {
  50% { opacity: 0; }
}

@media (min-width: $bp-laptop) {
  .entry-bar {
    grid-template-columns: 64px minmax(0, 1fr) 64px;
    gap: $gap-md;
    padding: $padding-md;

    &__btn         { width: 64px; height: 64px; }
    &__value       { @include display-sm; }
    &__placeholder { @include text-lg; }
    &__bust        { height: 64px; @include title-xxxl; }
    &__slot        { height: 64px; }
    &__slot-label  { @include title-xxxl; }
    &__slot-pts    { @include text-sm; }
    &__option      { @include text-md; }
  }
}
</style>
