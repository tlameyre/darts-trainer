<script setup>
import { useRouter } from 'vue-router'
import AppHeader from '../AppHeader.vue'

defineProps({
  title: { type: String, required: true },
  tone: { type: String, default: 'orange' },
  backTo: { type: String, default: 'play' },
  // Main area scrolls inside a full-height page instead of the page itself
  scroll: Boolean,
})

const router = useRouter()
</script>

<template>
  <div class="settings" :class="[`settings--${tone}`, { 'settings--scroll': scroll }]">
    <AppHeader :title="title" :tone="tone" @back="router.push({ name: backTo })">
      <template v-if="$slots['header-right']" #right>
        <slot name="header-right" />
      </template>
    </AppHeader>

    <main class="settings__main">
      <div class="settings__primary">
        <slot />
      </div>

      <div class="settings__side">
        <slot name="side" />
        <div class="settings__footer">
          <slot name="start" />
        </div>
      </div>
    </main>

    <slot name="modals" />
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  @include safe-bottom($padding-md);

  @each $name, $color in $tones {
    &--#{$name} {
      --tone: #{$color};
      --player-accent: #{$color};
    }
  }

  &--scroll {
    height: 100dvh;
    min-height: 0;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-lg $padding-md 0;
  }

  &--scroll &__main {
    min-height: 0;
    overflow-y: auto;
  }

  &__primary,
  &__side {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
  }

  &__side {
    flex: 1;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    margin-top: auto;
  }
}

@media (min-width: $bp-laptop) {
  .settings {
    @include safe-bottom(0px);

    &__main {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0;
      padding: 0;
    }

    &__primary,
    &__side {
      gap: $gap-xxl;
      padding: $padding-xxl;
    }

    &__side {
      border-left: $border-sm solid $border-color;
    }
  }
}
</style>
