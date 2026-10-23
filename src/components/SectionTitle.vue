<script setup>
defineProps({
  title: { type: String, required: true },
  action: { type: String, default: null },
})

defineEmits(['action'])
</script>

<template>
  <div class="section-title">
    <h2 class="section-title__text">
      {{ title }}
      <slot />
    </h2>
    <button v-if="action" class="section-title__action" @click="$emit('action')">{{ action }}</button>
  </div>
</template>

<style lang="scss" scoped>
.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $gap-sm;

  &__text {
    @include title-lg;
    color: $muted;
  }

  &__action {
    @include text-sm;
    font-weight: 600;
    color: $error;
    transition: color 0.15s;

    &:hover { color: $text-color; }
  }
}

@media (min-width: $bp-laptop) {
  .section-title {
    &__text { @include title-xl; }
    &__action { @include text-md; font-weight: 600; }
  }
}
</style>
