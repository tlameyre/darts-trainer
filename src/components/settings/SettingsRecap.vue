<script setup>
defineProps({
  chips: { type: Array, required: true },
})
</script>

<template>
  <section class="recap">
    <h2 class="recap__label">Ta partie</h2>
    <ul class="recap__chips">
      <li v-for="chip in chips" :key="chip" class="recap__chip">{{ chip }}</li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.recap {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  padding: $padding-md;
  border-radius: $radius-sm;
  background: $white;
  color: $text-color;

  &__label {
    @include text-xs;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    color: $muted;
  }

  &__chips {
    display: flex;
    list-style: none;
    flex-wrap: wrap;
    gap: $gap-xs;
  }

  &__chip {
    @include title-md;
    padding: $padding-xxs $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
  }
}
</style>
