<script setup>
import AppIcon from '../AppIcon.vue'
import { avatarColor } from '../../utils/avatarColor.js'

const props = defineProps({
  user:    { type: Object,  required: true },
  loading: { type: Boolean, default: false },
  sent:    { type: Boolean, default: false },
})

const emit = defineEmits(['add'])

function displayName(u) {
  if (u.first_name) return u.first_name
  if (u.username)   return u.username
  return u.friend_code ?? '—'
}

function initials(u) {
  return displayName(u)[0].toUpperCase()
}
</script>

<template>
  <div class="user-result">
    <div class="user-result__avatar" :style="{ background: avatarColor(user.id ?? displayName(user)) }">{{ initials(user) }}</div>

    <div class="user-result__info">
      <p class="user-result__name">{{ displayName(user) }}</p>
      <p class="user-result__code">{{ user.friend_code }}</p>
    </div>

    <button
      class="user-result__btn"
      :disabled="loading || sent"
      :aria-label="`Envoyer une demande à ${displayName(user)}`"
      @click="emit('add', user)"
    >
      <template v-if="sent"><AppIcon name="check" :width="16" :height="16" />Envoyée</template>
      <template v-else-if="loading">…</template>
      <template v-else><AppIcon name="user-plus" :width="18" :height="18" />Ajouter</template>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.user-result {
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

  &__btn {
    @include title-sm;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    height: 40px;
    margin-right: $padding-xs;
    padding: 0 $padding-sm;
    flex-shrink: 0;
    border-radius: $radius-sm;
    background: $black;
    color: $bg;
    text-transform: uppercase;
    transition: opacity 0.15s;

    &:disabled { opacity: 0.4; }
    &:not(:disabled):active { opacity: 0.85; }
  }
}

@media (min-width: $bp-laptop) {
  .user-result {
    min-height: 72px;
    padding: 0 $padding-sm 0 $padding-md;

    &__code { @include text-sm; }
    &__btn { @include title-md; height: 44px; padding: 0 $padding-md; }
  }
}
</style>
