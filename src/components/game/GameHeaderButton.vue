<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
})
</script>

<template>
  <button class="header-btn" :aria-label="label">
    <AppIcon :name="icon" :width="24" :height="24" />
  </button>
</template>

<style lang="scss" scoped>
.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $padding-xxs;
  color: $white;
  transition: opacity 0.15s;

  &:active { opacity: 0.6; }
}
</style>
