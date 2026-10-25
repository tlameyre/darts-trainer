<script setup>
defineProps({
  name:   { type: String, required: true },
  width:  { type: [Number, String], default: 24 },
  height: { type: [Number, String], default: 24 },
  color:  { type: String, default: 'currentColor' },
})
</script>

<template>
  <svg
    class="app-icon"
    :width="width"
    :height="height"
    :style="{ color: color }"
    fill="none"
    aria-hidden="true"
  >
    <use :href="`#icon-${name}`" />
  </svg>
</template>

<style lang="scss" scoped>
// As a flex item the svg would shrink below its width/height props in tight containers
.app-icon {
  flex-shrink: 0;
}
</style>
