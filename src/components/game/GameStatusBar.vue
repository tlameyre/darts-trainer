<script setup>
defineProps({
  label: { type: String, required: true },
  // { ratio: 0–1, text: '4/20' } — omitted when the game has no fixed length
  progress: { type: Object, default: null },
  // Hidden on mobile, where the panel already carries this information
  desktopOnly: Boolean,
})
</script>

<template>
  <div class="status-bar" :class="{ 'status-bar--desktop-only': desktopOnly }">
    <h2 class="status-bar__label">{{ label }}</h2>

    <div v-if="progress" class="status-bar__progress">
      <span class="status-bar__track">
        <span class="status-bar__fill" :style="{ width: `${Math.min(progress.ratio, 1) * 100}%` }" />
      </span>
      <span class="status-bar__count">{{ progress.text }}</span>
    </div>
    <span v-else class="status-bar__spacer" />

    <slot />
  </div>
</template>

<style lang="scss" scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: $gap-md;
  min-height: 44px;
  padding: $padding-sm $padding-md 0;

  &--desktop-only { display: none; }

  &__label {
    @include title-xl;
    white-space: nowrap;
    line-height: 1;
  }

  &__progress {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__spacer { flex: 1; }

  &__track {
    flex: 1;
    height: 10px;
    border-radius: $radius-xs;
    background: $surface;
    overflow: hidden;
  }

  &__fill {
    display: block;
    height: 100%;
    background: var(--tone);
    transition: width 0.3s;
  }

  &__count {
    @include title-xl;
    color: var(--tone);
    white-space: nowrap;
    line-height: 1;
  }
}

@media (min-width: $bp-laptop) {
  .status-bar {
    gap: $gap-lg;
    padding: 0;

    &--desktop-only { display: flex; }

    &__label { @include title-xxl; }
    &__count { @include title-xl; }
  }
}
</style>
