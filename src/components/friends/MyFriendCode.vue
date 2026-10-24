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
  <section class="my-code" aria-label="Mon code ami">
    <div class="my-code__text">
      <span class="my-code__label">Mon code ami</span>
      <span class="my-code__value">{{ code }}</span>
    </div>
    <button class="my-code__copy" @click="copyCode">
      <AppIcon :name="copied ? 'check' : 'copy'" :width="18" :height="18" />
      {{ copied ? 'Copié' : 'Copier' }}
    </button>
  </section>
</template>

<style lang="scss" scoped>
.my-code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $gap-sm;
  padding: 0 $padding-md $padding-lg;
  background: $black;
  color: $bg;

  &__text {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__label {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.7;
  }

  &__value {
    @include title-xxxl;
    line-height: 0.9;
    letter-spacing: 0.06em;
  }

  &__copy {
    @include title-sm;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    height: 44px;
    padding: 0 $padding-sm;
    border-radius: $radius-sm;
    background: $bg;
    color: $black;
    text-transform: uppercase;
    transition: opacity 0.15s;

    &:active { opacity: 0.8; }
  }
}

@media (min-width: $bp-laptop) {
  .my-code {
    padding: 0 $padding-xxl $padding-xl;

    &__label { @include text-sm; }
    &__copy { @include title-md; height: 48px; padding: 0 $padding-md; }
  }
}
</style>
