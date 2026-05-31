<script setup>
import { ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import AppButton from '../AppButton.vue'

const props = defineProps({
  locked:    { type: Boolean, default: false },
  bustMode:  { type: Boolean, default: false }, // true → bouton central = BUST
  rightIcon: { type: String,  default: 'exit' }, // icône du bouton de droite
})

const emit = defineEmits(['undo', 'miss', 'bust', 'right'])

const pressedCenter = ref(false)
let _centerTimer = null

function tapCenter() {
  if (props.locked) return
  clearTimeout(_centerTimer)
  pressedCenter.value = true
  _centerTimer = setTimeout(() => { pressedCenter.value = false }, 160)
  emit(props.bustMode ? 'bust' : 'miss')
}
</script>

<template>
  <div class="game-bar">
    <button class="game-bar__icon-btn" @click="emit('undo')">
      <AppIcon name="undo" :width="24" :height="24" />
    </button>
    <AppButton
      variant="secondary"
      size="small"
      :class="{ 'game-bar__center--pressed': pressedCenter }"
      @click="tapCenter"
    >
      {{ bustMode ? 'BUST' : 'MANQUÉ' }}
    </AppButton>
    <button class="game-bar__icon-btn" @click="emit('right')">
      <AppIcon :name="rightIcon" :width="24" :height="24" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.game-bar {
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

  &__center--pressed {
    background: rgba($error, 0.2) !important;
    color: $error-light !important;
  }
}
</style>
