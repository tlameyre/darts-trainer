<script setup>
import draggable from 'vuedraggable'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  modelValue: { type: Array, required: true },
  removable:  { type: Boolean, default: false },
  bot:        { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'remove', 'edit-bot', 'remove-bot'])

function onModelUpdate(value) {
  emit('update:modelValue', value)
}

function avatarLetter(player) {
  return player.name?.[0]?.toUpperCase() ?? '?'
}
</script>

<template>
  <draggable
    :model-value="modelValue"
    item-key="id"
    handle=".player-order__handle"
    ghost-class="player-order__item--ghost"
    tag="div"
    class="player-order"
    @update:model-value="onModelUpdate"
  >
    <template #item="{ element: player, index: i }">
      <div class="player-order__item" :class="{ 'player-order__item--me': player.isMe }">
        <span class="player-order__handle">
          <AppIcon name="drag-handle" :width="18" :height="18" />
        </span>
        <span class="player-order__position">{{ i + 1 }}</span>
        <div
          class="player-order__avatar"
          :class="{ 'player-order__avatar--me': player.isMe, 'player-order__avatar--guest': player.isGuest }"
        >
          {{ avatarLetter(player) }}
        </div>
        <span class="player-order__name">{{ player.name }}</span>
        <span v-if="player.isMe" class="player-order__tag player-order__tag--me">Toi</span>
        <span v-else-if="player.isFriend" class="player-order__tag">Ami</span>
        <span v-else-if="player.isRegistered" class="player-order__tag">Joueur</span>
        <span v-else-if="player.isGuest" class="player-order__tag">Invité</span>
        <button v-if="removable && !player.isMe" class="player-order__action" aria-label="Retirer" @click="emit('remove', i)">
          <AppIcon name="close" :width="14" :height="14" />
        </button>
      </div>
    </template>
  </draggable>

  <div v-if="bot" class="player-order__item">
    <span class="player-order__position">{{ modelValue.length + 1 }}</span>
    <div class="player-order__avatar player-order__avatar--bot">
      <AppIcon name="robot" :width="16" :height="16" />
    </div>
    <span class="player-order__name">DartBot</span>
    <span class="player-order__tag">{{ bot.label }}</span>
    <button class="player-order__action" aria-label="Régler le DartBot" @click="emit('edit-bot')">
      <AppIcon name="gear" :width="16" :height="16" />
    </button>
    <button class="player-order__action" aria-label="Retirer le DartBot" @click="emit('remove-bot')">
      <AppIcon name="close" :width="14" :height="14" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.player-order {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__item {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xs $padding-sm $padding-xs $padding-xs;
    border: $border-md solid $surface;
    border-radius: $radius-sm;
    background: $surface;
    color: $text-color;

    &--me { border-color: var(--player-accent, #{$accent}); }

    &--ghost { opacity: 0.4; }
  }

  &__handle {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: $muted;
    cursor: grab;
    touch-action: none;

    &:active { cursor: grabbing; }
  }

  &__position {
    @include title-sm;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $black;
    color: $bg;
  }

  &__avatar {
    @include title-sm;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: $blue;
    color: $white;

    &--me { background: $error; }
    &--guest { background: $muted; }
    &--bot { background: $black; }
  }

  &__name {
    @include title-lg;
    flex: 1;
    min-width: 0;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__tag {
    @include title-xxs;
    flex-shrink: 0;
    padding: 2px $padding-xxs;
    border-radius: $radius-sm;
    background: $border-color;
    letter-spacing: $tracking-sm;

    &--me {
      background: var(--player-accent, #{$accent});
      color: $white;
    }
  }

  &__action {
    display: flex;
    align-items: center;
    padding: $padding-xxs;
    color: $muted;

    &:active { color: $text-color; }
  }
}

@media (min-width: $bp-laptop) {
  .player-order {
    gap: $gap-sm;

    &__item { padding-top: $padding-sm; padding-bottom: $padding-sm; }
    &__position { @include title-md; width: 26px; height: 26px; }
    &__avatar { @include title-md; width: 44px; height: 44px; }
    &__name { @include title-xl; line-height: 1; }
    &__tag { @include title-sm; }
  }
}
</style>
