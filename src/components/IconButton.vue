<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg', 'xl'].includes(v),
  },
  variant: {
    type: String,
    default: 'surface',
    validator: v => ['bare', 'surface', 'outline', 'translucent', 'filled'].includes(v),
  },
  color: { type: String, default: null },
  iconSize: { type: Number, default: null },
})

const resolvedIconSize = computed(() => props.iconSize ?? (props.variant === 'bare' ? 24 : 16))
</script>

<template>
  <button
    :class="['icon-btn', `icon-btn--${variant}`, variant !== 'bare' && `icon-btn--${size}`]"
    :style="color ? { '--icon-btn-color': color } : null"
    :aria-label="label"
  >
    <AppIcon :name="icon" :width="resolvedIconSize" :height="resolvedIconSize" />
  </button>
</template>

<style lang="scss" scoped>
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, opacity 0.15s;

  &--sm { width: 36px; height: 36px; }
  &--md { width: 40px; height: 40px; }
  &--lg { width: 44px; height: 44px; }
  &--xl { width: 48px; height: 48px; }

  &--bare {
    padding: $padding-xxs;
    color: inherit;

    &:active { opacity: 0.6; }
  }

  &--surface {
    border-radius: $radius-sm;
    background: $surface;
    color: $text-color;

    &:active { background: $border-color; }
  }

  &--outline {
    border-radius: $radius-sm;
    border: $border-md solid $text-color;
    color: $text-color;

    &:active { background: rgba($black, 0.06); }
  }

  &--translucent {
    border-radius: $radius-sm;
    background: rgba($white, 0.18);
    color: $white;

    &:active { background: rgba($white, 0.3); }
  }

  &--filled {
    border-radius: $radius-sm;
    background: var(--icon-btn-color, #{$black});
    color: $bg;

    &:active { opacity: 0.8; }
  }

  &:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}
</style>
