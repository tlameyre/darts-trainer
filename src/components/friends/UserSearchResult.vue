<script setup>
import AppIcon from '../AppIcon.vue'

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
  if (u.first_name) return u.first_name[0].toUpperCase()
  if (u.username)   return u.username[0].toUpperCase()
  return '?'
}
</script>

<template>
  <div class="user-result">
    <div class="user-result__avatar">{{ initials(user) }}</div>

    <div class="user-result__info">
      <p class="user-result__name">{{ displayName(user) }}</p>
      <p class="user-result__code">{{ user.friend_code }}</p>
    </div>

    <button
      class="user-result__btn"
      :disabled="loading || sent"
      @click="emit('add', user)"
    >
      <span v-if="sent">✓</span>
      <span v-else-if="loading">…</span>
      <AppIcon v-else name="user-plus" :width="16" :height="16" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.user-result {
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

  &__btn {
    width: 36px;
    height: 36px;
    border-radius: $radius-pill;
    background: rgba($orange, 0.15);
    color: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, opacity 0.15s;
    @include text-sm;

    &:disabled { opacity: 0.4; }
    &:not(:disabled):active { background: rgba($orange, 0.25); }
  }
}
</style>
