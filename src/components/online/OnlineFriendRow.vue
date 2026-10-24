<script setup>
import AppIcon from '../AppIcon.vue'
import { avatarColor } from '../../utils/avatarColor.js'

defineProps({
  id:       { type: String, required: true },
  name:     { type: String, required: true },
  code:     { type: String, default: '' },
  // Label shown instead of the radio when a challenge is already open with this friend
  status:   { type: String, default: '' },
  selected: { type: Boolean, default: false },
})
</script>

<template>
  <button
    class="friend-row"
    :class="{ 'friend-row--selected': selected }"
    role="radio"
    :aria-checked="selected"
  >
    <span class="friend-row__avatar" :style="{ background: avatarColor(id) }">{{ name.charAt(0).toUpperCase() }}</span>
    <span class="friend-row__text">
      <span class="friend-row__name">{{ name }}</span>
      <span v-if="code" class="friend-row__code">{{ code }}</span>
    </span>
    <span v-if="status" class="friend-row__status">{{ status }}</span>
    <span v-else class="friend-row__radio">
      <AppIcon v-if="selected" name="check" :width="14" :height="14" />
    </span>
  </button>
</template>

<style lang="scss" scoped>
.friend-row {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: $padding-xs $padding-sm $padding-xs $padding-xs;
  border: $border-md solid $surface;
  border-radius: $radius-sm;
  background: $surface;
  color: $text-color;
  text-align: left;
  transition: border-color 0.15s;

  &--selected { border-color: $mode-online; }

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

  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__name {
    @include title-lg;
    line-height: 1;
  }

  &__code {
    @include text-xs;
    color: $muted;
  }

  &__status {
    @include text-xs;
    color: $mode-online;
  }

  &__radio {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $muted;
    border-radius: $radius-pill;
    color: $white;
  }

  &--selected &__radio {
    border-color: $mode-online;
    background: $mode-online;
  }
}

@media (min-width: $bp-laptop) {
  .friend-row {
    padding: $padding-xs $padding-md $padding-xs $padding-xs;

    &__avatar { @include title-md; width: 44px; height: 44px; }
    &__name   { @include title-xl; }
    &__code,
    &__status { @include text-sm; }
  }
}
</style>
