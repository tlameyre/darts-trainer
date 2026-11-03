<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  icon:        { type: String, required: true },
  color:       { type: String, required: true },
})

defineEmits(['select'])
</script>

<template>
  <button class="home-cta" :style="{ '--cta-color': color }" @click="$emit('select')">
    <span class="home-cta__icon">
      <AppIcon :name="icon" :width="26" :height="26" />
    </span>
    <span class="home-cta__body">
      <span class="home-cta__title">{{ title }}</span>
      <span class="home-cta__desc">{{ description }}</span>
    </span>
  </button>
</template>

<style lang="scss" scoped>
.home-cta {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  aspect-ratio: 1;
  min-width: 0;
  padding: $padding-sm;
  border-radius: $radius-sm;
  background: var(--cta-color);
  color: $white;
  text-align: left;
  transition: opacity 0.15s;

  &:active { opacity: 0.8; }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: $radius-sm;
    background: $tint-20;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__title {
    @include title-xl;
    line-height: 0.9;
    white-space: nowrap;
  }

  &__desc {
    @include text-xs;
    line-height: 1.3;
  }
}

@media (min-width: $bp-laptop) {
  .home-cta {
    padding: $padding-lg;

    &__icon {
      width: 64px;
      height: 64px;
    }

    &__title { @include title-xxxl; line-height: 0.9; }
    &__desc { @include text-md; }
  }
}
</style>
