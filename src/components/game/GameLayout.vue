<script setup>
import AppHeader from '../AppHeader.vue'

defineProps({
  title: { type: String, required: true },
  tone: { type: String, default: 'orange' },
  // Colors the header, the panel and the answer zone: null while playing, 'ok' / 'ko' once checked
  feedback: { type: String, default: null },
  exitIcon: { type: String, default: 'exit' },
  // End of the game: the `over` slot replaces the play area and the header reads "Fin de partie"
  over: Boolean,
  // The end screen carries its own header on desktop
  bareOver: Boolean,
  // One full-width area instead of the colored panel + entry split
  plain: Boolean,
  // Mobile only: status, then the panel as a card on the cream background, then the entry
  stack: Boolean,
})

defineEmits(['exit'])
</script>

<template>
  <div
    class="game-layout"
    :class="[`game-layout--${tone}`, feedback && `game-layout--${feedback}`, over && bareOver && 'game-layout--bare', plain && 'game-layout--plain', stack && 'game-layout--stack']"
  >
    <AppHeader class="game-layout__header" :title="over ? 'Fin de partie' : title" :tone="tone" :back-icon="exitIcon" @back="$emit('exit')">
      <template v-if="!over && $slots['header-right']" #right>
        <slot name="header-right" />
      </template>
    </AppHeader>

    <div v-if="over" class="game-layout__over">
      <slot name="over" />
    </div>

    <main v-else class="game-layout__main">
      <section v-if="!plain" class="game-layout__panel">
        <slot name="panel" />
      </section>

      <div v-if="$slots.status" class="game-layout__status">
        <slot name="status" />
      </div>

      <div v-if="$slots.answer" class="game-layout__answer">
        <slot name="answer" />
      </div>

      <div class="game-layout__entry">
        <slot />
      </div>
    </main>

    <slot name="modals" />
  </div>
</template>

<style lang="scss" scoped>
// A view can size its entry area on mobile with --entry-height / --entry-max-height
.game-layout {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: $bg;

  @each $name, $color in $tones {
    &--#{$name} { --tone: #{$color}; }
  }

  &--ok { --game-tone: #{$accent}; }
  &--partial { --game-tone: #{$orange}; }
  &--ko { --game-tone: #{$error}; }

  &__header,
  &__panel,
  &__answer {
    background: var(--game-tone, var(--game-color, var(--tone)));
    transition: background 0.2s;
  }

  &__main,
  &__over {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__panel {
    flex: var(--panel-flex, 1);
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    color: $white;
  }

  &__status { flex-shrink: 0; }

  &__answer {
    flex-shrink: 0;
    padding: $padding-sm $padding-md $padding-md;
  }

  &__entry {
    flex-shrink: 0;
    height: var(--entry-height, auto);
    max-height: var(--entry-max-height, none);
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: $padding-sm $padding-md 0;
    @include safe-bottom($padding-md);
  }
}

.game-layout--plain .game-layout__entry {
  flex: 1;
  min-height: 0;
}

@media (max-width: #{$bp-laptop - 1px}) {
  .game-layout--stack {
    .game-layout__status { order: -1; }

    .game-layout__panel {
      flex: 0 0 auto;
      overflow: visible;
      background: transparent;
    }

    .game-layout__entry {
      flex: 1;
      min-height: 0;
      padding-top: $padding-sm;
    }
  }
}

@media (min-width: $bp-laptop) {
  .game-layout {
    &__header {
      padding: $padding-lg $padding-xxl;
    }

    &--bare &__header { display: none; }

    &--plain &__main { display: flex; }

    &__main {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: auto auto minmax(0, 1fr);
    }

    &__panel {
      grid-row: 1 / 4;
      padding: $padding-xl $padding-xxl $padding-xxl;
    }

    &__status,
    &__answer,
    &__entry {
      grid-column: 2;
    }

    &__status { grid-row: 1; padding: $padding-xl $padding-xxl 0; }

    &__answer {
      grid-row: 2;
      padding: $padding-md $padding-xxl 0;
      background: transparent;
    }

    &__entry {
      grid-row: 3;
      flex-shrink: 1;
      min-height: 0;
      height: auto;
      max-height: none;
      gap: $gap-md;
      padding: $padding-md $padding-xxl $padding-xxl;
    }
  }
}
</style>
