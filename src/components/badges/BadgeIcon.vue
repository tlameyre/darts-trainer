<script setup>
import { computed } from 'vue'
import { BADGE_CATEGORIES } from '../../data/badges.js'

const props = defineProps({
  badge:  { type: Object,  required: true },
  locked: { type: Boolean, default: false },
})

const color = computed(() => BADGE_CATEGORIES.find(c => c.name === props.badge.category)?.color)

// Longer marks get a smaller size so they stay inside the ring
const textSize = computed(() => {
  const length = props.badge.mark.length
  if (length <= 2) return { size: 92, y: 131 }
  if (length === 3) return { size: 74, y: 125 }
  return { size: 58, y: 120 }
})
</script>

<template>
  <svg
    class="badge-icon"
    :class="{ 'badge-icon--locked': locked }"
    :style="{ '--badge-color': color }"
    viewBox="0 0 200 200"
    aria-hidden="true"
  >
    <circle class="badge-icon__disc" cx="100" cy="100" r="98" />
    <circle class="badge-icon__ring" cx="100" cy="100" r="88" />
    <text class="badge-icon__mark" x="100" :y="textSize.y" :font-size="textSize.size" text-anchor="middle">{{ badge.mark }}</text>
  </svg>
</template>

<style lang="scss" scoped>
.badge-icon {
  // Sized by the parent through --badge-icon-size
  width: var(--badge-icon-size, 40px);
  height: var(--badge-icon-size, 40px);
  flex-shrink: 0;

  &__disc { fill: var(--badge-color); }

  &__ring {
    fill: none;
    stroke: $bg;
    stroke-opacity: 0.35;
    stroke-width: 3;
  }

  &__mark {
    fill: $bg;
    font-family: $font-title;
    font-weight: 800;
  }

  &--locked {
    .badge-icon__disc { fill: $border-color; }
    .badge-icon__ring { stroke: $muted; }
    .badge-icon__mark { fill: $muted; }
  }
}
</style>
