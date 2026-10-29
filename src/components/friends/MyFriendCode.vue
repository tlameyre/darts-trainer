<script setup>
import { ref } from 'vue'
import AppButton from '../AppButton.vue'

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
    <AppButton size="small" tone="inverse" :block="false" :icon="copied ? 'check' : 'copy'" @click="copyCode">
      {{ copied ? 'Copié' : 'Copier' }}
    </AppButton>
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
}

@media (min-width: $bp-laptop) {
  .my-code {
    padding: 0 $padding-xxl $padding-xl;

    &__label { @include text-sm; }
  }
}
</style>
