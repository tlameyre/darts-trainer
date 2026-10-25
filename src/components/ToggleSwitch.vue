<script setup>
defineProps({
  modelValue: Boolean,
  title: String,
  description: String,
  tone: { type: String, default: 'orange', validator: v => ['orange', 'tournament'].includes(v) },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <button class="toggle" :class="`toggle--${tone}`" @click="$emit('update:modelValue', !modelValue)">
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
    width: 52px;
    height: 32px;
    background: $bg;
    border: 2px solid $white;
    border-radius: $radius-pill;
    position: relative;
    flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s;

    &--on {
      background: $orange;
      border-color: $orange;
    }
  }

  &--tournament &__switch--on {
    background: $mode-tournament;
    border-color: $mode-tournament;
  }

  &__knob {
    position: absolute;
    top: 6px;
    left: 6px;
    width: 16px;
    height: 16px;
    background: $white;
    border-radius: 50%;
    transition: transform 0.2s;

    .toggle__switch--on & {
      transform: translateX(22px);
    }
  }
}
</style>
