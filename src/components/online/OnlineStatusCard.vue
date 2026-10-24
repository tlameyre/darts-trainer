<script setup>
defineProps({
  tone:  { type: String, default: 'wait', validator: v => ['ok', 'wait', 'error'].includes(v) },
  title: { type: String, required: true },
})
</script>

<template>
  <div class="status" :class="`status--${tone}`" role="status">
    <span class="status__dot" />
    <div class="status__body">
      <span class="status__title">{{ title }}</span>
      <span v-if="$slots.default" class="status__text"><slot /></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status {
  display: flex;
  align-items: flex-start;
  gap: $gap-sm;
  padding: $padding-md;
  border: $border-md solid transparent;
  border-radius: $radius-sm;
  background: $surface;

  &__dot {
    position: relative;
    flex-shrink: 0;
    width: 12px;
    height: 12px;
    margin-top: 5px;
    border-radius: $radius-pill;
    background: $mode-online;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__title {
    @include title-lg;
    line-height: 1;
    color: $text-color;
  }

  &__text {
    @include text-sm;
    color: $muted;
  }

  &--ok .status__dot { background: $accent; }

  &--wait .status__dot::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: $radius-pill;
    background: $mode-online;
    opacity: 0.2;
    animation: status-pulse 1.6s ease-in-out infinite;
  }

  &--error {
    border-color: $error;

    .status__dot   { background: $error; }
    .status__title { color: $error; }
  }
}

@keyframes status-pulse {
  50% { opacity: 0.05; }
}

@media (min-width: $bp-laptop) {
  .status {
    padding: $padding-xl;

    &__dot   { margin-top: 9px; }
    &__title { @include title-xxl; }
    &__text  { @include text-md; }
  }
}
</style>
