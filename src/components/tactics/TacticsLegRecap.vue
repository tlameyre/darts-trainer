<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  show:       { type: Boolean, required: true },
  winnerName: { type: String,  required: true },
  totalDarts: { type: Number,  required: true },
  volleys:    { type: Array,   required: true },
})

defineEmits(['next'])
</script>

<template>
  <Transition name="slide-up">
    <div v-if="show" class="leg-recap">
      <section class="leg-recap__hero">
        <span class="leg-recap__trophy"><AppIcon name="trophy" :width="30" :height="30" /></span>
        <div class="leg-recap__text">
          <span class="leg-recap__kicker">Plateau fermé</span>
          <span class="leg-recap__name">{{ winnerName }}</span>
        </div>
      </section>

      <div class="leg-recap__stats">
        <div class="leg-recap__stat">
          <span class="leg-recap__stat-val">{{ totalDarts }}</span>
          <span class="leg-recap__stat-lbl">fléchettes</span>
        </div>
        <div class="leg-recap__stat">
          <span class="leg-recap__stat-val">{{ volleys.length }}</span>
          <span class="leg-recap__stat-lbl">tours</span>
        </div>
      </div>

      <button class="leg-recap__next" @click="$emit('next')">
        Manche suivante
        <AppIcon name="arrow-right" :width="20" :height="20" />
      </button>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.leg-recap {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  flex-direction: column;
  gap: $gap-lg;
  background: $bg;
  @include safe-bottom($padding-md);

  &__hero {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-lg $padding-md;
    background: $mode-tactics;
    color: $white;
  }

  &__trophy {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $white;
    color: $mode-tactics;
  }

  &__text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__kicker {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.85;
  }

  &__name {
    @include display-sm;
    line-height: 0.9;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-xs;
    padding: 0 $padding-md;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
    padding: $padding-md;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__stat-val {
    @include display-md;
    line-height: 1;
  }

  &__stat-lbl {
    @include text-sm;
    color: $muted;
  }

  &__next {
    @include title-xl;
    margin: auto $padding-md 0;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    border-radius: $radius-sm;
    background: $mode-tactics;
    color: $white;
    transition: background 0.15s;

    &:active { background: $black; }
  }
}

@media (min-width: $bp-laptop) {
  .leg-recap {
    align-items: center;

    &__hero,
    &__stats,
    &__next {
      width: 100%;
      max-width: 560px;
    }

    &__hero { padding: $padding-xl; margin-top: $padding-xxl; border-radius: $radius-sm; }
    &__trophy { width: 72px; height: 72px; }
    &__kicker { @include text-sm; }
    &__name { @include display-md; }
    &__stat-val { @include display-lg; }
    &__stat-lbl { @include text-md; }
    &__next { @include title-xxl; height: 64px; margin: auto 0 $padding-xxl; }
  }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
