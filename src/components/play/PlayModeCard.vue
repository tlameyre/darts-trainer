<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  // { label, icon, color } — an entry of GAME_MODES (or a custom tile)
  mode:        { type: Object, required: true },
  description: { type: String, required: true },
})

defineEmits(['select'])
</script>

<template>
  <button class="play-card" :style="{ '--mode-color': mode.color }" @click="$emit('select')">
    <span class="play-card__icon">
      <AppIcon :name="mode.icon" :width="26" :height="26" />
    </span>

    <span class="play-card__body">
      <span class="play-card__title">{{ mode.label }}</span>
      <span class="play-card__desc">{{ description }}</span>
    </span>
  </button>
</template>

<style lang="scss" scoped>
.play-card {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: $padding-sm;
  border: $border-md solid $border-color;
  border-radius: $radius-sm;
  background: $surface;
  color: $text-color;
  text-align: left;

  &:active { opacity: 0.7; }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    border-radius: $radius-sm;
    background: var(--mode-color);
    color: $white;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    min-width: 0;
  }

  &__title {
    @include title-xl;
    line-height: 1;
  }

  &__desc {
    @include text-xs;
    line-height: 1.3;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .play-card {
    gap: $gap-md;
    padding: $padding-md;

    &__icon {
      width: 64px;
      height: 64px;
    }

    &__title { @include title-xxl; }
    &__desc { @include text-sm; }
  }
}
</style>
