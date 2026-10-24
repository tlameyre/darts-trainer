<script setup>
import AppIcon from '../AppIcon.vue'
import { avatarColor } from '../../utils/avatarColor.js'

defineProps({
  kicker:          { type: String, required: true },
  me:              { type: Object, required: true },
  opponent:        { type: Object, required: true },
  chips:           { type: Array, default: () => [] },
  opponentDimmed:  { type: Boolean, default: false },
})
</script>

<template>
  <section class="versus">
    <span class="versus__kicker">
      <AppIcon name="globe" :width="18" :height="18" />{{ kicker }}
    </span>

    <div class="versus__duel">
      <div class="versus__player">
        <span class="versus__avatar" :style="{ background: avatarColor(me.id) }">{{ me.name.charAt(0).toUpperCase() }}</span>
        <span class="versus__text">
          <span class="versus__name">{{ me.name }}</span>
          <span class="versus__tag">Toi</span>
        </span>
      </div>

      <span class="versus__vs">VS</span>

      <div class="versus__player versus__player--opponent" :class="{ 'versus__player--dimmed': opponentDimmed }">
        <span class="versus__avatar" :style="{ background: avatarColor(opponent.id) }">{{ opponent.name.charAt(0).toUpperCase() }}</span>
        <span class="versus__text">
          <span class="versus__name">{{ opponent.name }}</span>
          <span class="versus__tag">Ami</span>
        </span>
      </div>
    </div>

    <ul v-if="chips.length" class="versus__chips">
      <li v-for="chip in chips" :key="chip" class="versus__chip">{{ chip }}</li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.versus {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  padding: $padding-xxs $padding-md $padding-lg;
  color: $white;

  &__kicker {
    @include text-xs;
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.9;
  }

  &__duel {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: $gap-xs;
  }

  &__player {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $gap-xs;

    &--opponent { align-items: flex-end; }
    &--dimmed   { opacity: 0.45; }
  }

  &__avatar {
    @include title-xxl;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    box-shadow: 0 0 0 3px rgba($white, 0.9);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    align-items: inherit;
  }

  &__name {
    @include title-xxl;
    line-height: 0.9;
  }

  &__tag {
    @include title-xxs;
    padding: $padding-xxs 6px;
    border-radius: $radius-xs;
    background: rgba($white, 0.2);
    letter-spacing: $tracking-sm;
  }

  &__vs {
    @include title-xxxl;
    opacity: 0.6;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xxs;
    padding-top: $padding-sm;
    border-top: $border-md solid rgba($white, 0.3);
    list-style: none;
  }

  &__chip {
    @include title-sm;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-xs;
    background: rgba($white, 0.18);
  }
}

@media (min-width: $bp-laptop) {
  .versus {
    flex: 1;
    gap: $gap-xl;
    padding: $padding-lg 0 0;

    &__kicker { @include text-sm; gap: $gap-xs; }

    &__duel {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: $gap-md;
    }

    &__player,
    &__player--opponent {
      flex-direction: row;
      align-items: center;
      gap: $gap-md;
    }

    &__text { align-items: flex-start; gap: $gap-xxs; }

    &__avatar { @include title-xxxl; width: 88px; height: 88px; box-shadow: 0 0 0 4px rgba($white, 0.9); }
    &__name   { @include title-xxxl; }
    &__tag    { @include title-sm; }
    &__vs     { @include display-xs; line-height: 0.8; padding-left: $padding-lg; }

    &__chips  { margin-top: auto; padding-top: $padding-md; gap: $gap-xs; }
    &__chip   { @include title-md; padding: 6px $padding-sm; }
  }
}
</style>
