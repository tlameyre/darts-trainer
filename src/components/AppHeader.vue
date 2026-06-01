<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  title: { type: String, default: 'DARTS TRAINER' },
  backIcon: { type: String, default: 'arrow-left' },
})

defineEmits(['back'])
</script>

<template>
  <header class="app-header">
    <button class="app-header__back" @click="$emit('back')">
      <AppIcon :name="backIcon" :width="24" :height="24" />
    </button>

    <h1 class="app-header__title">{{ title }}</h1>

    <div class="app-header__right">
      <slot name="right" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  width: 100%;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;

  &__back {
    color: $text-color;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: $padding-xxs;
    transition: opacity 0.15s;

    &:active {
      opacity: 0.6;
    }
  }

  &__title {
    @include title-lg;
    color: $text-color;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}

@media (min-width: $bp-laptop) {
  .app-header__title {
    @include title-xl;
  }
}
</style>
