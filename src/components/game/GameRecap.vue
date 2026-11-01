<script setup>
// End-of-game layout shared by the training modes: colored hero with the
// success rate and totals, then a scrollable list of rows (default slot).
defineProps({
  tone: { type: String, default: 'orange', validator: v => ['orange', 'blue', 'cyan'].includes(v) },
  title: { type: String, default: 'Récap de la session' },
  percent: { type: Number, required: true },
  unit: { type: String, default: '%' },
  badgeValue: { type: [String, Number], default: null }, // no badge without a value
  badgeLabel: { type: String, default: '' },
  stats: { type: Array, default: () => [] }, // { label, value }
  statsColumns: { type: Number, default: 2 },
  listTitle: { type: String, default: '' }, // the list section is skipped without default slot content
  listCount: { type: String, default: '' },
  primaryLabel: { type: String, default: 'Rejouer' },
  // Read-only view of a saved session: no replay / home buttons
  hideActions: { type: Boolean, default: false },
})

defineEmits(['primary', 'home'])
</script>

<template>
  <div class="game-recap" :class="`game-recap--${tone}`">
    <section class="game-recap__hero">
      <span class="game-recap__title">{{ title }}</span>
      <div class="game-recap__headline">
        <span class="game-recap__percent">{{ percent }}<span class="game-recap__percent-sign">{{ unit }}</span></span>
        <div v-if="badgeValue !== null" class="game-recap__badge">
          <span class="game-recap__badge-value">{{ badgeValue }}</span>
          <span class="game-recap__badge-label">{{ badgeLabel }}</span>
        </div>
      </div>
      <div v-if="stats.length" class="game-recap__stats" :style="{ gridTemplateColumns: `repeat(${statsColumns}, minmax(0, 1fr))` }">
        <div v-for="stat in stats" :key="stat.label" class="game-recap__stat">
          <span class="game-recap__stat-value">{{ stat.value }}</span>
          <span class="game-recap__stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <section v-if="$slots.default || !hideActions" class="game-recap__details">
      <div v-if="$slots.default" class="game-recap__list-head">
        <h2 class="game-recap__list-title">{{ listTitle }}</h2>
        <span class="game-recap__list-count">{{ listCount }}</span>
      </div>
      <slot name="legend" />
      <ul v-if="$slots.default" class="game-recap__list">
        <slot />
      </ul>

      <div v-if="!hideActions" class="game-recap__actions">
        <AppButton size="md" color="var(--recap-color)" @click="$emit('primary')">{{ primaryLabel }}</AppButton>
        <AppButton size="md" variant="secondary" @click="$emit('home')">Accueil</AppButton>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.game-recap {
  --recap-color: #{$orange};

  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  &--blue {
    --recap-color: #{$blue};
  }

  &--cyan {
    --recap-color: #{$mode-checkout};
  }

  &__hero {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: $padding-xs $padding-md $padding-md;
    background: var(--recap-color);
    color: $white;
  }

  &__title { @include title-lg; }

  &__headline {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $gap-md;
  }

  &__percent {
    @include display-lg;
    line-height: 0.9;
  }

  &__percent-sign { @include display-xs; }

  &__badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    background: $white;
    color: var(--recap-color);
  }

  &__badge-value {
    @include title-xxxl;
    line-height: 1;
  }

  &__badge-label {
    @include text-xxs;
    text-transform: uppercase;
    letter-spacing: $tracking-sm;
  }

  &__stats {
    display: grid;
    row-gap: $gap-sm;
    padding-top: $padding-sm;
    border-top: $border-md solid rgba($white, 0.3);
  }

  &__stat {
    display: flex;
    flex-direction: column;
  }

  &__stat-value {
    @include title-xxl;
    line-height: 1;
  }

  &__stat-label {
    @include text-xs;
    opacity: 0.8;
  }

  &__details {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding: $padding-md $padding-md 0;
    @include safe-bottom($padding-md);
  }

  &__list-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: $padding-xs;
    border-bottom: $border-lg solid $black;
  }

  &__list-title { @include title-lg; }

  &__list-count {
    @include text-sm;
    color: $muted;
  }

  &__list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $gap-xs;
    padding-top: $padding-xs;
  }

}

@media (min-width: $bp-laptop) {
  .game-recap {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    // Bounded row: a long list scrolls instead of pushing the actions out of view
    grid-template-rows: minmax(0, 1fr);

    &__hero {
      justify-content: flex-end;
      gap: $gap-xxl;
      padding: $padding-xxl;
    }

    &__title          { @include title-xxl; }
    &__percent        { @include display-xxl; }
    &__percent-sign   { @include display-md; }
    &__badge          { padding: $padding-md $padding-xl; }
    &__badge-value    { @include display-sm; }
    &__badge-label    { @include text-sm; }
    &__stats          { row-gap: $gap-xl; padding-top: $padding-lg; }
    &__stat-value     { @include display-xs; }
    &__stat-label     { @include text-md; }

    &__details {
      gap: $gap-sm;
      padding: $padding-xxl $padding-xxl 0;
      @include safe-bottom($padding-xxl);
    }

    &__list-title { @include title-xl; }
    &__list-count { @include text-md; }
  }
}
</style>
