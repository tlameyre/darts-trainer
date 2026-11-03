<script setup>
import AppButton from './AppButton.vue'

defineProps({
  title: { type: String, required: true },
  action: { type: String, default: null },
  count:  { type: String, default: null },
  badge:  { type: Number, default: 0 },    // pill next to the action (pending items)
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
    <AppButton v-if="action" variant="link" tone="danger" :block="false" @click="$emit('action')">
      {{ action }}
      <span v-if="badge" class="section-title__badge">{{ badge }}</span>
    </AppButton>
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

  &__badge {
    @include text-xs;
    display: inline-block;
    min-width: 18px;
    margin-left: $gap-xxs;
    padding: 1px 6px;
    border-radius: $radius-pill;
    background: $error;
    color: $white;
    line-height: 1.4;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  .section-title {
    &__text { @include title-xl; }
    &__count  { @include text-sm; }
  }
}
</style>
