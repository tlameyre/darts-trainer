<script setup>
import AppIcon from '../AppIcon.vue'
import SectionTitle from '../SectionTitle.vue'
import { avatarColor } from '../../utils/avatarColor.js'

defineProps({
  friends: { type: Array, required: true },
  pendingCount: { type: Number, default: 0 },
})

defineEmits(['see-all'])

function displayName(f) {
  return f.first_name || f.username || f.friend_code || '?'
}

function initial(f) {
  return displayName(f)[0].toUpperCase()
}
</script>

<template>
  <section class="pf-section">
    <SectionTitle title="Amis" action="Voir tout" ruled :badge="pendingCount" @action="$emit('see-all')">
      <span class="pf-section__count">{{ friends.length }}</span>
    </SectionTitle>

    <div v-if="friends.length" class="pf-section__list">
      <button
        v-for="f in friends.slice(0, 5)"
        :key="f.friendshipId"
        class="pf-section__friend"
        @click="$emit('see-all')"
      >
        <span class="pf-section__avatar" :style="{ background: avatarColor(f.id ?? displayName(f)) }">{{ initial(f) }}</span>
        <span class="pf-section__name">{{ displayName(f) }}</span>
        <AppIcon name="angle-down" :width="20" :height="20" class="pf-section__chevron" />
      </button>
    </div>

    <button v-else class="pf-section__empty" @click="$emit('see-all')">
      <AppIcon name="user-plus" :width="18" :height="18" />
      Ajouter des amis
    </button>
  </section>
</template>

<style lang="scss" scoped>
.pf-section {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__count {
    margin-left: $gap-xxs;
    color: $error;
  }

  &__list {
    border-radius: $radius-sm;
    background: $surface;
    overflow: hidden;
  }

  &__friend {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    width: 100%;
    min-height: 56px;
    padding: 0 $padding-sm;
    color: $text-color;
    text-align: left;
    transition: background 0.15s;

    & + & { border-top: $border-sm solid $border-color; }
    &:active { background: $border-color; }
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
    color: $white;
  }

  &__name {
    @include text-md;
    flex: 1;
    min-width: 0;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chevron { transform: rotate(-90deg); }

  &__empty {
    @include text-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-sm;
    width: 100%;
    padding: $padding-md;
    border: $border-md dashed $border-color;
    border-radius: $radius-sm;
    color: $muted;
    transition: background 0.15s;

    &:active { background: $surface; }
  }
}

@media (min-width: $bp-laptop) {
  .pf-section {
    &__friend { min-height: 64px; padding: 0 $padding-md; gap: $gap-md; }
    &__avatar { width: 40px; height: 40px; }
    &__name   { @include title-lg; text-transform: uppercase; }
    &__empty  { @include text-md; }
  }
}
</style>
