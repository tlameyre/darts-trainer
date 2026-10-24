<script setup>
import AppIcon from '../AppIcon.vue'
import { avatarColor } from '../../utils/avatarColor.js'

const props = defineProps({
  friend: { type: Object, required: true },
  // 'friend' | 'received' | 'sent'
  variant: { type: String, default: 'friend' },
})

const emit = defineEmits(['accept', 'remove'])

function displayName(f) {
  if (f.first_name) return f.first_name
  if (f.username)   return f.username
  return f.friend_code ?? '—'
}

function initials(f) {
  return displayName(f)[0].toUpperCase()
}
</script>

<template>
  <div class="friend-card" :class="`friend-card--${variant}`">
    <div class="friend-card__avatar" :style="{ background: avatarColor(friend.id ?? displayName(friend)) }">{{ initials(friend) }}</div>

    <div class="friend-card__info">
      <p class="friend-card__name">{{ displayName(friend) }}</p>
      <p class="friend-card__code">{{ friend.friend_code }}</p>
    </div>

    <div class="friend-card__actions">
      <template v-if="variant === 'received'">
        <button class="friend-card__btn friend-card__btn--accept" @click="emit('accept', friend.friendshipId)" :aria-label="`Accepter ${displayName(friend)}`">
          <AppIcon name="check" :width="18" :height="18" />
        </button>
        <button class="friend-card__btn" @click="emit('remove', friend.friendshipId)" :aria-label="`Refuser ${displayName(friend)}`">
          <AppIcon name="close" :width="14" :height="14" />
        </button>
      </template>

      <template v-else-if="variant === 'sent'">
        <span class="friend-card__pending">En attente</span>
        <button class="friend-card__btn" @click="emit('remove', friend.friendshipId)" :aria-label="`Annuler la demande à ${displayName(friend)}`">
          <AppIcon name="close" :width="14" :height="14" />
        </button>
      </template>

      <button v-else class="friend-card__btn friend-card__btn--remove" @click="emit('remove', friend.friendshipId)" :aria-label="`Retirer ${displayName(friend)}`">
        <AppIcon name="close" :width="14" :height="14" />
        <span class="friend-card__btn-label">Retirer</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.friend-card {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  min-height: 64px;
  padding: 0 $padding-xs 0 $padding-sm;

  & + & { border-top: $border-sm solid $border-color; }

  &__avatar {
    @include title-sm;
    width: 40px;
    height: 40px;
    border-radius: $radius-pill;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: $white;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    @include title-lg;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__code {
    @include text-xs;
    letter-spacing: $tracking-sm;
    color: $muted;
  }

  &__actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__btn {
    width: 44px;
    height: 44px;
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $muted;
    transition: background 0.15s;

    &:active { background: $border-color; }

    &--accept { color: $accent; }

    &--remove .friend-card__btn-label { display: none; }
  }

  &__pending {
    @include title-xxs;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: $border-color;
    color: $text-color;
    text-transform: uppercase;
  }
}

@media (min-width: $bp-laptop) {
  .friend-card {
    min-height: 72px;
    padding: 0 $padding-sm 0 $padding-md;

    &__code { @include text-sm; }

    &__btn--remove {
      @include text-sm;
      width: auto;
      height: 40px;
      gap: $gap-xs;
      padding: 0 $padding-sm;
      border: $border-md solid $border-color;
      font-weight: 600;

      .friend-card__btn-label { display: inline; }
    }
  }
}
</style>
