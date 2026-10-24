<script setup>
defineProps({
  title: { type: String, required: true },
  action: { type: String, default: null },
  count:  { type: String, default: null },
  ruled:  { type: Boolean, default: false }, // heavy rule under the title (stats)
})

defineEmits(['action'])
</script>

<template>
  <div class="section-title" :class="{ 'section-title--ruled': ruled }">
    <h2 class="section-title__text">
      {{ title }}
      <slot />
    </h2>
    <span v-if="count" class="section-title__count">{{ count }}</span>
    <button v-if="action" class="section-title__action" @click="$emit('action')">{{ action }}</button>
  </div>
</template>

<style lang="scss" scoped>
.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $gap-sm;

  &--ruled {
    padding-bottom: $padding-xs;
    border-bottom: $border-lg solid $black;

    .section-title__text { color: $text-color; }
  }

  &__count {
    @include text-xs;
    color: $muted;
  }

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
    &__count  { @include text-sm; }
  }
}
</style>
