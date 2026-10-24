<script setup>
import AppIcon from '../AppIcon.vue'
import { avatarColor } from '../../utils/avatarColor.js'

defineProps({
  me:       { type: Object, required: true },
  opponent: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})

defineEmits(['choose'])
</script>

<template>
  <div class="tiles">
    <button class="tiles__tile" :disabled="disabled" @click="$emit('choose', me.id)">
      <span class="tiles__avatar" :style="{ background: avatarColor(me.id) }">{{ me.name.charAt(0).toUpperCase() }}</span>
      <span class="tiles__name">Moi</span>
      <span class="tiles__caption">a gagné le bull</span>
    </button>

    <button class="tiles__tile" :disabled="disabled" @click="$emit('choose', opponent.id)">
      <span class="tiles__avatar" :style="{ background: avatarColor(opponent.id) }">{{ opponent.name.charAt(0).toUpperCase() }}</span>
      <span class="tiles__name">{{ opponent.name }}</span>
      <span class="tiles__caption">a gagné le bull</span>
    </button>

    <button class="tiles__tile" :disabled="disabled" @click="$emit('choose', 'random')">
      <span class="tiles__avatar tiles__avatar--random"><AppIcon name="dice" :width="24" :height="24" /></span>
      <span class="tiles__name">Au hasard</span>
      <span class="tiles__caption">tirage au sort</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $gap-xs;

  &__tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    min-height: 132px;
    padding: $padding-sm 6px;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $surface;
    color: $text-color;
    text-align: center;
    transition: border-color 0.15s;

    &:active:not(:disabled) { border-color: $mode-online; }
    &:disabled { opacity: 0.5; }
  }

  &__avatar {
    @include title-lg;
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    color: $white;

    &--random {
      background: $black;
      color: $bg;
    }
  }

  &__name {
    @include title-lg;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1;
  }

  &__caption {
    @include text-xxs;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .tiles {
    gap: $gap-sm;

    &__tile  { min-height: 220px; padding: $padding-lg; gap: $gap-sm; }
    &__avatar { @include title-xxl; width: 72px; height: 72px; }
    &__name  { @include title-xxl; }
    &__caption { @include text-sm; }
  }
}
</style>
