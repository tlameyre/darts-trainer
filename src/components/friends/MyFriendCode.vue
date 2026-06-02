<script setup>
import { ref } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  code: { type: String, required: true },
})

const copied = ref(false)

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback silencieux si clipboard non disponible
  }
}
</script>

<template>
  <div class="my-code">
    <p class="my-code__label">Mon code ami</p>
    <button class="my-code__pill" @click="copyCode" :class="{ 'my-code__pill--copied': copied }">
      <span class="my-code__value">{{ code }}</span>
      <AppIcon :name="copied ? 'check' : 'copy'" :width="16" :height="16" class="my-code__icon" />
    </button>
    <p class="my-code__hint">{{ copied ? 'Copié !' : 'Appuie pour copier' }}</p>
  </div>
</template>

<style lang="scss" scoped>
.my-code {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $gap-xs;

  &__label {
    @include text-xs;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__pill {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-lg;
    background: rgba(255, 255, 255, 0.07);
    border: $border-sm solid rgba(255, 255, 255, 0.15);
    border-radius: $radius-pill;
    transition: background 0.15s, border-color 0.15s;
    color: $white;

    &:active { background: rgba(255, 255, 255, 0.12); }

    &--copied {
      border-color: $accent;
      background: rgba($accent, 0.08);
    }
  }

  &__value {
    @include title-xl;
    color: $text-color;
    letter-spacing: 0.12em;
  }

  &__icon {
    color: $muted;

    .my-code__pill--copied & { color: $accent; }
  }

  &__hint {
    @include text-xs;
    color: $muted;
    height: 16px;
    transition: color 0.2s;

    .my-code__pill--copied + & { color: $accent; }
  }
}
</style>
