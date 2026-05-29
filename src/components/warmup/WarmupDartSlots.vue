<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  darts: { type: Array, required: true },
  tourNumber: { type: Number, required: true },
  timeDisplay: { type: String, required: true },
  isUnlimited: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false },
})
</script>

<template>
  <div class="warmup__tour-row">
    <span class="warmup__tour-label">TOUR {{ tourNumber }}</span>
    <div v-if="!isUnlimited" class="warmup__timer" :class="{ 'warmup__timer--urgent': isUrgent }">
      <AppIcon name="clock" :width="24" :height="24" />
      <span class="warmup__timer-text">{{ timeDisplay }}</span>
    </div>
  </div>

  <div class="warmup__slots">
    <div class="warmup__slots-icon">
      <AppIcon name="dartboard" :width="30" :height="30" color="#333" />
    </div>
    <div class="warmup__slot" v-for="i in 3" :key="i">
      <Transition name="slot-pop">
        <span v-if="darts[i - 1]" :key="darts[i - 1].ts">
          {{ darts[i - 1].pts }}
        </span>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.warmup__tour-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.warmup__tour-label {
  @include title-md;
}

.warmup__timer {
  @include title-md;
  display: flex;
  align-items: center;
  gap: $gap-xs;
  transition: color 0.3s;

  &--urgent {
    color: $error;
  }
}

.warmup__timer-text {
  display: inline-block;
  min-width: 4ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.warmup__slots {
  display: flex;
  align-items: stretch;
  background: $white;
  border-radius: $radius-pill;
  overflow: hidden;
  flex-shrink: 0;
  padding: $padding-sm $padding-sm $padding-sm $padding-sm;
}

.warmup__slots-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: $padding-md;
  flex-shrink: 0;
}

.warmup__slot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  @include title-xl;
  color: $black;
  border-left: $border-md solid $black;
  overflow: hidden;
}

.slot-pop-enter-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.slot-pop-enter-from {
  transform: scale(0.5);
  opacity: 0;
}
</style>
