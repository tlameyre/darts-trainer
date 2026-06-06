<script setup>
import AppIcon from '../AppIcon.vue'

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
  if (f.first_name) return f.first_name[0].toUpperCase()
  if (f.username)   return f.username[0].toUpperCase()
  return '?'
}
</script>

<template>
  <div class="friend-card" :class="`friend-card--${variant}`">
    <div class="friend-card__avatar">{{ initials(friend) }}</div>

    <div class="friend-card__info">
      <p class="friend-card__name">{{ displayName(friend) }}</p>
      <p class="friend-card__code">{{ friend.friend_code }}</p>
    </div>

    <div class="friend-card__actions">
      <template v-if="variant === 'received'">
        <button class="friend-card__btn friend-card__btn--accept" @click="emit('accept', friend.friendshipId)" aria-label="Accepter">
          <AppIcon name="check" :width="16" :height="16" />
        </button>
        <button class="friend-card__btn friend-card__btn--decline" @click="emit('remove', friend.friendshipId)" aria-label="Refuser">
          <AppIcon name="close" :width="14" :height="14" />
        </button>
      </template>

      <template v-else-if="variant === 'sent'">
        <span class="friend-card__pending">En attente</span>
        <button class="friend-card__btn friend-card__btn--decline" @click="emit('remove', friend.friendshipId)" aria-label="Annuler">
          <AppIcon name="close" :width="14" :height="14" />
        </button>
      </template>

      <template v-else>
        <button class="friend-card__btn friend-card__btn--decline" @click="emit('remove', friend.friendshipId)" aria-label="Retirer">
          <AppIcon name="close" :width="14" :height="14" />
        </button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.friend-card {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: $padding-sm $padding-md;
  background: rgba(255, 255, 255, 0.05);
  border-radius: $radius-md;
  border: $border-sm solid rgba(255, 255, 255, 0.07);

  &__avatar {
    @include title-md;
    width: 40px;
    height: 40px;
    border-radius: $radius-pill;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: $text-color;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    @include title-sm;
    color: $text-color;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__code {
    @include text-xs;
    color: $muted;
    margin-top: 2px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $gap-md;
    flex-shrink: 0;
  }

  &__btn {
    width: 32px;
    height: 32px;
    border-radius: $radius-pill;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;

    &--accept {
      background: rgba($accent, 0.15);
      color: $accent;
      &:active { background: rgba($accent, 0.25); }
    }

    &--decline {
      background: rgba(255, 255, 255, 0.07);
      color: $muted;
      &:active { background: rgba(255, 255, 255, 0.12); }
    }
  }

  &__pending {
    @include text-xs;
    color: $muted;
    font-style: italic;
  }
}
</style>
