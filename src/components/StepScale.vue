<script setup>
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  steps: { type: Number, default: 10 },
  // Numbered cells (level picker) or plain gauge cells framed by −/+ buttons
  numbered: { type: Boolean, default: false },
  label: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function set(value) {
  emit('update:modelValue', Math.min(props.steps, Math.max(1, value)))
}
</script>

<template>
  <div class="step-scale" :class="{ 'step-scale--gauge': !numbered }">
    <button
      v-if="!numbered"
      class="step-scale__nudge"
      :aria-label="`Diminuer ${label}`"
      :disabled="modelValue <= 1"
      @click="set(modelValue - 1)"
    ><AppIcon name="minus" :width="20" :height="20" /></button>

    <div class="step-scale__cells" :style="{ '--steps': steps }">
      <button
        v-for="n in steps" :key="n"
        class="step-scale__cell"
        :class="{ 'step-scale__cell--filled': n < modelValue, 'step-scale__cell--current': n === modelValue }"
        :aria-label="`${label} ${n}`"
        :aria-pressed="n === modelValue"
        @click="set(n)"
      >
        <template v-if="numbered">{{ n }}</template>
      </button>
    </div>

    <button
      v-if="!numbered"
      class="step-scale__nudge step-scale__nudge--up"
      :aria-label="`Augmenter ${label}`"
      :disabled="modelValue >= steps"
      @click="set(modelValue + 1)"
    ><AppIcon name="plus" :width="20" :height="20" /></button>
  </div>
</template>

<style lang="scss" scoped>
.step-scale {
  --scale-color: #{$accent};

  &--gauge {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    align-items: center;
    gap: $gap-xs;
  }

  &__cells {
    display: grid;
    grid-template-columns: repeat(var(--steps), minmax(0, 1fr));
    gap: $gap-xxs;
  }

  &__cell {
    @include title-md;
    height: 44px;
    padding: 0;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: transparent;
    color: $text-color;

    &--filled {
      border-color: var(--scale-color);
      background: var(--scale-color);
      color: $white;
    }

    &--current {
      border-color: $black;
      background: $black;
      color: $white;
    }
  }

  &--gauge &__cell { height: 28px; }

  &__nudge {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;

    &--up {
      border-color: var(--scale-color);
      background: var(--scale-color);
      color: $white;
    }

    &:disabled { opacity: 0.4; }
  }
}

@media (min-width: $bp-laptop) {
  .step-scale {
    &__cell { @include title-lg; height: 52px; }
    &--gauge &__cell { height: 32px; }
  }
}
</style>
