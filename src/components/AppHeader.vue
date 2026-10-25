<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  title: { type: String, default: 'DARTS TRAINER' },
  backIcon: { type: String, default: 'arrow-left' },
  tone: { type: String, default: 'orange', validator: v => ['orange', 'blue', 'green', 'cyan', 'red', 'ink', 'online', 'tournament'].includes(v) },
})

defineEmits(['back'])
</script>

<template>
  <header class="app-header" :class="`app-header--${tone}`">
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
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  padding: $padding-md;
  background: $orange;

  &--blue {
    background: $blue;
  }

  &--green {
    background: $accent;
  }

  &--cyan {
    background: $mode-checkout;
  }

  &--red {
    background: $mode-tactics;
  }

  &--ink {
    background: $black;
  }

  &--online {
    background: $mode-online;
  }

  &--tournament {
    background: $mode-tournament;
  }

  &__back {
    color: $white;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    transition: opacity 0.15s;

    &:active {
      opacity: 0.6;
    }
  }

  &__title {
    @include title-lg;
    color: $white;
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
