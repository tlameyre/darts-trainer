<script setup>
import { ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import AppButton from '../AppButton.vue'

const props = defineProps({
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['undo', 'miss', 'quit'])

const pressedMiss = ref(false)
let _missTimer = null

function tapMiss() {
  if (props.locked) return
  clearTimeout(_missTimer)
  pressedMiss.value = true
  _missTimer = setTimeout(() => { pressedMiss.value = false }, 160)
  emit('miss')
}
</script>

<template>
  <div class="x01-bar">
    <button class="x01-bar__icon-btn" @click="emit('undo')">
      <AppIcon name="undo" :width="24" :height="24" />
    </button>
    <AppButton
      variant="secondary"
      size="small"
      :class="{ 'x01-bar__miss--pressed': pressedMiss }"
      @click="tapMiss"
    >
      MANQUÉ
    </AppButton>
    <button class="x01-bar__icon-btn" @click="emit('quit')">
      <AppIcon name="exit" :width="24" :height="24" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.x01-bar {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  align-items: center;
  flex-shrink: 0;

  &__icon-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__miss--pressed {
    background: rgba($error, 0.2) !important;
    color: $error-light !important;
  }
}
</style>
