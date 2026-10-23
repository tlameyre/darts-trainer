<script setup>
import AppIcon from '../AppIcon.vue'
import SectionTitle from '../SectionTitle.vue'

defineProps({
  title: { type: String, required: true },
  modes: { type: Array, required: true },
})

defineEmits(['select'])
</script>

<template>
  <section class="mode-section">
    <SectionTitle :title="title" />
    <div class="mode-section__grid">
      <button
        v-for="mode in modes" :key="mode.id"
        class="mode-section__tile"
        :style="{ '--mode-color': mode.color }"
        @click="$emit('select', mode)"
      >
        <AppIcon :name="mode.icon" :width="24" :height="24" class="mode-section__icon" />
        <span class="mode-section__label">{{ mode.label }}</span>
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.mode-section {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__tile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    min-height: 104px;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: var(--mode-color);
    color: $white;
    text-align: left;
    transition: opacity 0.15s;

    &:active { opacity: 0.8; }
  }

  &__icon { color: rgba($white, 0.85); }

  &__label {
    @include title-xl;
    line-height: 0.95;
    overflow-wrap: anywhere;
  }
}

@media (min-width: $bp-laptop) {
  .mode-section {
    &__grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: $gap-sm;
    }

    &__tile {
      min-height: 140px;
      padding: $padding-md;
    }

    &__icon {
      width: 32px;
      height: 32px;
    }

    &__label { @include title-xxl; line-height: 0.95; }
  }
}
</style>
