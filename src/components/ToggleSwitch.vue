<script setup>
defineProps({
  modelValue: Boolean,
  title: String,
  description: String,
})

defineEmits(['update:modelValue'])
</script>

<template>
  <button class="toggle" @click="$emit('update:modelValue', !modelValue)">
    <span class="toggle__title">{{ title }}</span>
    <div class="toggle__text">
      <span class="toggle__desc">{{ description }}</span>
      <div class="toggle__switch" :class="{ 'toggle__switch--on': modelValue }">
        <div class="toggle__knob" />
      </div>
    </div>
  </button>
</template>

<style lang="scss" scoped>
.toggle {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  text-align: left;
  width: 100%;

  &__title {
    @include title-lg;
    color: $text-color;
  }

  &__text {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $gap-xl;
  }


  &__desc {
    @include text-sm;
    color: $muted;
    max-width: 75%;
  }

  &__switch {
    width: 44px;
    height: 26px;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-pill;
    position: relative;
    flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s;

    &--on {
      background: $orange;
      border-color: $orange;
    }
  }

  &__knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: $white;
    border-radius: 50%;
    transition: transform 0.2s;

    .toggle__switch--on & {
      transform: translateX(18px);
    }
  }
}
</style>
