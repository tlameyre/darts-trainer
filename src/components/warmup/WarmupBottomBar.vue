<script setup>
import { ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import AppButton from '../AppButton.vue'

const props = defineProps({
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['undo', 'miss', 'end'])

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
  <div class="warmup__bottom">
    <button class="warmup__bottom-undo" @click="emit('undo')">
      <AppIcon name="undo" :width="24" :height="24" />
    </button>
    <AppButton variant="secondary" size="small" :class="{ 'warmup__miss--pressed': pressedMiss }" @click="tapMiss">
      MANQUÉ</AppButton>
    <button class="warmup__bottom-end" @click="emit('end')">
      <AppIcon name="stop" :width="24" :height="24" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.warmup__bottom {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  align-items: center;
  flex-shrink: 0;
}

.warmup__bottom-undo {
  color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.warmup__miss--pressed {
  background: rgba($error, 0.2) !important;
  color: $error-light !important;
}

.warmup__bottom-end {
  color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;

  &:active {
    color: $error;
  }
}
</style>
