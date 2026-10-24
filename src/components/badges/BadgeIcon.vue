<script setup>
import { computed } from 'vue'
import { BADGE_CATEGORIES } from '../../data/badges.js'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  badge:  { type: Object,  required: true },
  locked: { type: Boolean, default: false },
})

const color = computed(() => BADGE_CATEGORIES.find(c => c.name === props.badge.category)?.color)
</script>

<template>
  <span
    class="badge-icon"
    :class="{ 'badge-icon--locked': locked }"
    :style="{ '--badge-color': color }"
  >
    <AppIcon :name="badge.icon" :width="'50%'" :height="'50%'" />
  </span>
</template>

<style lang="scss" scoped>
.badge-icon {
  // Sized by the parent through --badge-icon-size
  width: var(--badge-icon-size, 40px);
  height: var(--badge-icon-size, 40px);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  background: var(--badge-color);
  color: $white;

  &--locked {
    background: $border-color;
    color: $muted;
  }
}
</style>
