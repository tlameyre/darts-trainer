<script setup>
const ZONES = ['20', '19', '18', '17', '16', '15', '14', '13', '12', 'D', 'T', 'Bull']
</script>

<template>
  <section class="principle">
    <h2 class="principle__title">Le principe</h2>
    <p class="principle__text">
      Ferme les zones 20 à 12 puis Double, Triple et Bull, le plus vite possible. Façon cricket.
    </p>
    <div class="principle__zones">
      <span v-for="zone in ZONES" :key="zone" class="principle__zone">{{ zone }}</span>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.principle {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  padding: $padding-md;
  border-radius: $radius-sm;
  background: $mode-tactics;
  color: $white;

  &__title {
    @include title-md;
    line-height: 1;
  }

  &__text {
    @include text-sm;
    opacity: 0.92;
  }

  &__zones {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xxs;
  }

  &__zone {
    @include title-sm;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: rgba($white, 0.18);
    line-height: 1.2;
  }
}

@media (min-width: $bp-laptop) {
  .principle {
    padding: $padding-lg;

    &__title { @include title-lg; }
    &__text  { @include text-md; }
    &__zone  { @include title-md; }
  }
}
</style>
