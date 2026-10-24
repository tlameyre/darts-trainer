<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  // { label, icon, color, ink } — an entry of GAME_MODES (or a custom tile)
  mode:        { type: Object, required: true },
  description: { type: String, required: true },
  statLabel:   { type: String, default: null },
  stat:        { type: String, default: null },
  // Mobile only: a light bordered row instead of the filled list card
  outlined:    { type: Boolean, default: false },
})

defineEmits(['select'])
</script>

<template>
  <button
    class="play-card"
    :class="{ 'play-card--outlined': outlined }"
    :style="{ '--mode-color': mode.color, '--mode-ink': mode.ink ?? mode.color }"
    @click="$emit('select')"
  >
    <span class="play-card__icon">
      <AppIcon :name="mode.icon" :width="26" :height="26" />
    </span>

    <span class="play-card__body">
      <span class="play-card__title">{{ mode.label }}</span>
      <span class="play-card__desc">{{ description }}</span>
      <span v-if="stat || statLabel" class="play-card__stat">
        {{ statLabel }}<span v-if="stat" class="play-card__stat-value">{{ stat }}</span>
      </span>
    </span>

    <AppIcon name="angle-down" :width="20" :height="20" class="play-card__chevron" />
  </button>
</template>

<style lang="scss" scoped>
.play-card {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 20px;
  align-items: center;
  gap: $gap-sm;
  padding: $padding-sm;
  border-radius: $radius-sm;
  background: $surface;
  color: $text-color;
  text-align: left;

  &:active { opacity: 0.7; }

  &--outlined {
    grid-template-columns: 20px minmax(0, 1fr) 20px;
    min-height: 52px;
    padding: 0 $padding-sm;
    border: $border-md solid $border-color;
    background: transparent;

    .play-card__icon {
      width: 20px;
      height: 20px;
      background: transparent;
      color: $text-color;
    }

    .play-card__title { @include title-md; line-height: 1; }
    .play-card__desc { @include text-xs; }
    .play-card__stat { display: none; }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
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
    line-height: 0.95;
    text-transform: uppercase;
  }

  &__desc {
    @include text-sm;
    line-height: 1.3;
    color: $muted;
  }

  &__stat {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding-top: 2px;
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    color: $muted;
  }

  &__stat-value {
    @include title-sm;
    color: var(--mode-ink);
  }

  &__chevron { transform: rotate(-90deg); }
}

@media (min-width: $bp-laptop) {
  .play-card__chevron {
    position: absolute;
    top: $padding-md;
    right: $padding-md;
  }

  .play-card,
  .play-card--outlined {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: $gap-sm;
    min-height: 216px;
    padding: $padding-md;
    border: 0;
    background: $surface;

    // Icon top-left, chevron top-right, then the body fills the card
    .play-card__icon {
      width: 56px;
      height: 56px;
      background: var(--mode-color);
      color: $white;
    }

    .play-card__body { flex: 1; gap: $gap-sm; }
    .play-card__title { @include title-xxl; }
    .play-card__desc { @include text-sm; line-height: 1.4; flex: 1; }

    .play-card__stat {
      display: flex;
      padding-top: 10px;
      border-top: $border-sm solid $border-color;
      @include text-xs;
      gap: $gap-xs;
    }

    .play-card__stat-value { @include title-lg; }
  }
}
</style>
