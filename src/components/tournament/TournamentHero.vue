<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  name:     { type: String, required: true },
  status:   { type: String, default: '' },
  tags:     { type: Array,  default: () => [] },
  progress: { type: Object, default: null }, // { percent, label, hint? }
})
</script>

<template>
  <section class="hero">
    <div class="hero__head">
      <span class="hero__icon"><AppIcon name="trophy" :width="28" :height="28" /></span>
      <div class="hero__info">
        <h2 class="hero__name">{{ name }}</h2>
        <span v-if="status" class="hero__status">{{ status }}</span>
      </div>
    </div>

    <div v-if="tags.length" class="hero__tags">
      <span v-for="tag in tags" :key="tag" class="hero__tag">{{ tag }}</span>
    </div>

    <div v-if="progress" class="hero__progress">
      <div class="hero__progress-row">
        <span>{{ progress.label }}</span>
        <span>{{ progress.percent }}%</span>
      </div>
      <div class="hero__bar"><div class="hero__fill" :style="{ width: `${progress.percent}%` }" /></div>
    </div>

    <slot />
  </section>
</template>

<style lang="scss" scoped>
.hero {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  padding: $padding-xxs $padding-md $padding-md;
  background: $mode-tournament;
  color: $white;

  &__head {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__icon {
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    border-radius: $radius-sm;
    background: $white;
    color: $mode-tournament;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    min-width: 0;
  }

  &__name {
    @include title-xl;
    line-height: 0.9;
  }

  &__status {
    align-self: flex-start;
    padding: 3px $padding-xs;
    border-radius: $radius-sm;
    background: rgba($white, 0.2);
    @include title-xxs;
    letter-spacing: 0.04em;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xxs;
  }

  &__tag {
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: rgba($white, 0.18);
    @include title-sm;
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__progress-row {
    display: flex;
    justify-content: space-between;
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    opacity: 0.9;
  }

  &__bar {
    height: 8px;
    border-radius: 2px;
    background: rgba($white, 0.25);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: $white;
  }
}

@media (min-width: $bp-laptop) {
  .hero {
    padding: $padding-xs $padding-xxl $padding-lg;

    &__icon { width: 64px; height: 64px; }
    &__name { @include title-xxl; }
    &__status { @include title-sm; }
    &__tag { @include title-md; }
    &__progress-row { @include text-sm; }
  }
}
</style>
