<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  mode:       { type: String,  default: 'dart' },   // 'dart' | 'volley'
  darts:      { type: Array,   default: () => [] },
  valueKey:   { type: String,  default: 'value' },
  value:      { type: String,  default: '' },        // saisie en cours (mode volée)
  bust:       { type: Boolean, default: false },
  toggleable: { type: Boolean, default: false },
})

defineEmits(['toggle', 'validate'])
</script>

<template>
  <div class="dart-bar" :class="{ 'dart-bar--bust': bust }">

    <button v-if="toggleable" class="dart-bar__icon" :disabled="bust" @click="$emit('toggle')">
      <AppIcon :name="mode === 'dart' ? 'dartboard' : 'keyboard'" :width="30" :height="30" />
    </button>
    <div v-else class="dart-bar__icon">
      <AppIcon name="dartboard" :width="30" :height="30" />
    </div>

    <template v-if="bust">
      <div class="dart-bar__bust-label">BUST !</div>
    </template>

    <template v-else-if="mode === 'dart'">
      <div v-for="i in 3" :key="i" class="dart-bar__slot">
        <Transition name="slot-pop">
          <span v-if="darts[i - 1]" :key="String(darts[i - 1][valueKey]) + i" class="dart-bar__value">
            {{ darts[i - 1][valueKey] }}
          </span>
        </Transition>
      </div>
    </template>

    <template v-else>
      <div class="dart-bar__volley-value" :class="{ 'dart-bar__volley-value--placeholder': !value }">
        {{ value || 'Score de la volée' }}
      </div>
      <button class="dart-bar__ok" @click="$emit('validate')">OK</button>
    </template>

  </div>
</template>

<style lang="scss" scoped>
.dart-bar {
  display: flex;
  align-items: stretch;
  background: $white;
  border-radius: $radius-pill;
  overflow: hidden;
  padding: $padding-sm;
  flex-shrink: 0;
  transition: background 0.2s;

  &--bust {
    background: $error;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: $padding-md;
    color: $black;
    flex-shrink: 0;
    transition: opacity 0.15s;

    &:is(button) {
      &:active   { opacity: 0.5; }
      &:disabled { opacity: 0.4; }
    }
  }

  &__slot {
    color: $black;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: $border-md solid $black;
    overflow: hidden;
    min-height: 36px;
  }

  &__value {
    @include title-xl;
    font-variant-numeric: tabular-nums;
  }

  &__bust-label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xl;
    font-weight: 700;
    color: $white;
    border-left: $border-md solid rgba($white, 0.4);
    letter-spacing: 0.08em;
  }

  &__volley-value {
    flex: 1;
    display: flex;
    align-items: center;
    padding-left: $padding-md;
    border-left: $border-md solid $black;
    @include title-xl;
    color: $black;
    font-variant-numeric: tabular-nums;

    &--placeholder {
      @include text-sm;
      color: $input-placeholder;
    }
  }

  &__ok {
    background: $accent;
    border-radius: $radius-pill;
    color: $white;
    @include title-md;
    padding: $padding-xs $padding-xl;
    margin-left: $gap-xs;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
    flex-shrink: 0;

    &:active {
      transform: scale(0.95);
      background: $accent-dark;
    }
  }
}

.slot-pop-enter-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.slot-pop-enter-from {
  transform: scale(0.5);
  opacity: 0;
}

@media (min-width: $bp-laptop) {
  .dart-bar {
    padding: $padding-md;

    &__slot      { min-height: 48px; }
    &__value     { @include title-xxl; }
    &__bust-label { @include title-xxl; }
    &__volley-value {
      @include title-xxl;
      &--placeholder { @include text-md; }
    }
    &__ok { @include title-lg; padding: $padding-sm $padding-xxl; }
  }
}
</style>