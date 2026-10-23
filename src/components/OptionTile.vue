<script setup>
defineProps({
  modelValue: Boolean,
  title: { type: String, required: true },
  description: String,
})

defineEmits(['update:modelValue'])
</script>

<template>
  <button
    class="option-tile"
    :class="{ 'option-tile--on': modelValue }"
    :aria-pressed="modelValue"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <div class="option-tile__preview">
      <slot name="preview" />
    </div>
    <span class="option-tile__title">{{ title }}</span>
    <span v-if="description" class="option-tile__desc">{{ description }}</span>
    <span class="option-tile__badge">{{ modelValue ? 'Activé' : 'Désactivé' }}</span>
  </button>
</template>

<style lang="scss" scoped>
.option-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $gap-xs;
  padding: $padding-sm;
  border: $border-md solid $border-color;
  border-radius: $radius-sm;
  background: transparent;
  color: $text-color;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;

  &__preview {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding: $padding-xs;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__title {
    @include title-md;
    line-height: 1;
  }

  &__desc {
    @include text-xs;
    line-height: 1.3;
    color: $muted;
  }

  &__badge {
    @include title-sm;
    margin-top: auto;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: $surface;
    color: $muted;
    letter-spacing: $tracking-sm;
  }

  &--on {
    background: $orange;
    border-color: $orange;
    color: $white;

    .option-tile__preview {
      background: rgba($white, 0.16);
    }

    .option-tile__desc {
      color: rgba($white, 0.85);
    }

    .option-tile__badge {
      background: $white;
      color: $orange;
    }
  }
}

@media (min-width: $bp-laptop) {
  .option-tile {
    gap: $gap-sm;
    padding: $padding-lg;

    &__preview {
      padding: $padding-sm;
    }

    &__title {
      @include title-xxl;
    }

    &__desc {
      @include text-md;
    }
  }
}
</style>
