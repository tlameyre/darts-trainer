<script setup>
defineProps({
  text: { type: String, required: true },
  chips: { type: Array, default: () => [] },
  // 'panel' sits on the colored desktop panel, 'card' is a solid card (mobile sheet)
  variant: { type: String, default: 'card' },
  tone: { type: String, default: 'orange' },
})
</script>

<template>
  <section class="principle" :class="[`principle--${variant}`, `principle--${tone}`]">
    <h2 v-if="variant === 'panel'" class="principle__title">Le principe</h2>
    <p class="principle__text">{{ text }}</p>
    <slot />
    <ul v-if="chips.length" class="principle__chips">
      <li v-for="chip in chips" :key="chip" class="principle__chip">{{ chip }}</li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.principle {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  padding: $padding-sm;
  border-radius: $radius-sm;
  color: $white;

  @each $name, $color in $tones {
    &--card.principle--#{$name} { background: $color; }
  }

  &--panel { background: rgba($white, 0.16); }

  &__title { @include title-lg; }

  &__text {
    @include text-sm;
    line-height: 1.45;
    opacity: 0.92;
  }

  &__chips {
    display: flex;
    list-style: none;
    flex-wrap: wrap;
    gap: $gap-xxs;
  }

  &__chip {
    @include title-md;
    padding: 3px 7px;
    border-radius: $radius-sm;
    background: rgba($white, 0.18);
    line-height: 1.2;
  }
}

@media (min-width: $bp-laptop) {
  .principle {
    padding: $padding-lg;

    &__text { @include text-md; }
    &__chip { @include title-lg; }
  }
}
</style>
