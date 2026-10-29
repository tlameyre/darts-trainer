<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  size: {
    type: String,
    default: 'big',
    validator: v => ['big', 'small', 'md', 'cta'].includes(v),
  },
  rounded: {
    type: String,
    default: 'default',
    validator: v => ['default', 'full'].includes(v),
  },
  variant: {
    type: String,
    default: 'primary',
    validator: v => ['primary', 'secondary', 'ghost', 'surface', 'dashed', 'link'].includes(v),
  },
  tone: {
    type: String,
    default: 'orange',
    validator: v => ['orange', 'blue', 'green', 'cyan', 'red', 'online', 'tournament', 'black', 'danger', 'inverse', 'muted'].includes(v),
  },
  color: { type: String, default: null },
  active: { type: Boolean, default: false },
  block: { type: Boolean, default: true },
  align: {
    type: String,
    default: 'center',
    validator: v => ['center', 'start'].includes(v),
  },
  icon: { type: String, default: null },
  iconEnd: { type: String, default: null },
})

const iconSize = computed(() => (props.size === 'small' ? 16 : 20))
</script>

<template>
  <button
    :class="[
      'btn',
      variant === 'link' ? 'btn--link' : `btn--${size}`,
      `btn--${rounded}`,
      `btn--${variant}`,
      `btn--${tone}`,
      `btn--align-${align}`,
      { 'btn--active': active, 'btn--block': block },
    ]"
    :style="color ? { '--btn-color': color } : null"
  >
    <AppIcon v-if="icon" :name="icon" :width="iconSize" :height="iconSize" />
    <slot />
    <AppIcon v-if="iconEnd" :name="iconEnd" :width="iconSize" :height="iconSize" />
  </button>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.btn {
  --btn-text: #{$white};
  --btn-outline: #{$text-color};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $gap-xs;
  flex-shrink: 0;
  text-transform: uppercase;
  transition: background 0.15s, transform 0.1s;

  &:active {
    transform: scale(0.98);
  }

  &--block {
    width: 100%;
  }

  &--align-start {
    justify-content: flex-start;
  }

  // --- Tailles ---
  &--big {
    @include title-md;
    font-weight: 700;
    padding: $padding-md $padding-xl;
  }

  &--small {
    @include title-sm;
    font-weight: 700;
    padding: $padding-xs $padding-md;
  }

  &--md {
    @include title-lg;
    height: 56px;
    padding: 0 $padding-md;
  }

  &--cta {
    @include title-xl;
    height: 56px;
    padding: 0 $padding-md;
  }

  // --- Radius ---
  &--default {
    border-radius: $radius-sm;
  }

  &--full {
    border-radius: $radius-pill;
  }

  // --- Tons ---
  @each $name, $color in $tones {
    &--#{$name} {
      --btn-color: #{$color};
      --btn-dark: #{$black};
    }
  }

  &--orange { --btn-dark: #{$orange-dark}; }
  &--blue { --btn-dark: #{$blue-dark}; }

  &--black {
    --btn-color: #{$black};
    --btn-dark: #{$muted};
  }

  &--danger {
    --btn-color: #{$error};
    --btn-dark: #{$error-dark};
    --btn-outline: #{$error};
  }

  &--inverse {
    --btn-color: #{$bg};
    --btn-dark: #{$surface};
    --btn-text: #{$black};
  }

  &--muted {
    --btn-color: #{$muted};
    --btn-dark: #{$black};
    --btn-outline: #{$muted};
  }

  // --- Variantes ---
  &--primary {
    background: var(--btn-color);
    color: var(--btn-text);

    &:active {
      background: var(--btn-dark);
    }
  }

  &--secondary,
  &--ghost {
    background: transparent;
    color: var(--btn-outline);
    border: $border-md solid var(--btn-outline);
  }

  &--secondary:active {
    background: rgba($white, 0.05);
  }

  &--ghost:active {
    background: rgba($white, 0.08);
  }

  &--surface {
    background: $surface;
    color: $text-color;

    &:active {
      background: $border-color;
    }
  }

  &--dashed {
    background: transparent;
    color: var(--btn-outline);
    border: $border-md dashed $border-color;
  }

  &--link {
    @include text-sm;
    padding: 0;
    background: transparent;
    color: var(--btn-outline);
    text-transform: none;

    &:active {
      opacity: 0.6;
    }
  }

  // État actif (ex: option sélectionnée dans un groupe)
  &--active {
    background: var(--btn-color);
    border-color: var(--btn-color);
    color: var(--btn-text);
  }

  &:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

@media (min-width: $bp-laptop) {
  .btn--big {
    @include title-lg;
    padding: $padding-lg $padding-xxl;
  }

  .btn--small {
    @include title-md;
    padding: $padding-sm $padding-lg;
  }

  .btn--md {
    @include title-xl;
  }

  .btn--cta {
    @include title-xxl;
    height: 64px;
  }

  .btn--link {
    @include text-md;
  }
}
</style>
