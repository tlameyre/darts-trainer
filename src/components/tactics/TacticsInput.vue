<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  darts:  { type: Array, required: true }, // darts of the current volley (max 3)
  // { sector: number|null, onlyType: 'double'|'triple'|null }, sector null = bull
  target: { type: Object, required: true },
  locked: Boolean,
})

const emit = defineEmits(['dart', 'miss', 'undo'])

const slots = computed(() => [0, 1, 2].map(i => props.darts[i] ?? null))

const buttons = computed(() => {
  const { sector, onlyType } = props.target
  if (sector === null) {
    return [
      { label: 'Outer', sub: '25', dart: { type: 'bull', sector: null, pts: 25, label: 'Outer' } },
      { label: 'Bull',  sub: '50', dart: { type: 'bull', sector: null, pts: 50, label: 'Bull' } },
    ]
  }
  const all = [
    { key: 'single', label: `S${sector}`, sub: 'Simple', dart: { type: 'single', sector, pts: sector,     label: `S${sector}` } },
    { key: 'double', label: `D${sector}`, sub: 'Double', dart: { type: 'double', sector, pts: sector * 2, label: `D${sector}` } },
    { key: 'triple', label: `T${sector}`, sub: 'Triple', dart: { type: 'triple', sector, pts: sector * 3, label: `T${sector}` } },
  ]
  if (!onlyType) return all
  const only = all.find(b => b.key === onlyType)
  return [{ ...only, label: only.sub, sub: '' }]
})
</script>

<template>
  <div class="input">
    <div class="input__slots">
      <span
        v-for="(dart, i) in slots"
        :key="i"
        class="input__slot"
        :class="dart && (dart.type === 'miss' ? 'input__slot--miss' : 'input__slot--hit')"
      >
        <AppIcon v-if="dart?.type === 'miss'" name="close" :width="22" :height="22" />
        <template v-else-if="dart">{{ dart.label }}</template>
      </span>
    </div>

    <div class="input__hits" :style="{ gridTemplateColumns: `repeat(${buttons.length}, minmax(0, 1fr))` }">
      <button
        v-for="btn in buttons"
        :key="btn.label"
        class="input__hit"
        :disabled="locked"
        @click="emit('dart', btn.dart)"
      >
        <span class="input__hit-label">{{ btn.label }}</span>
        <span v-if="btn.sub" class="input__hit-sub">{{ btn.sub }}</span>
      </button>
    </div>

    <div class="input__actions">
      <button class="input__undo" @click="emit('undo')">
        <AppIcon name="undo" :width="20" :height="20" />
        Annuler
      </button>
      <button class="input__miss" :disabled="locked" @click="emit('miss')">Manqué</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.input {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__slots {
    display: flex;
    gap: $gap-xs;
  }

  &__slot {
    @include title-xl;
    flex: 1;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    line-height: 1;

    &--hit {
      border-color: $mode-tactics;
      background: $mode-tactics;
      color: $white;
    }

    &--miss {
      border-color: $black;
      background: $black;
      color: $bg;
    }
  }

  &__hits {
    flex: 1;
    min-height: 0;
    display: grid;
    gap: $gap-xs;
  }

  &__hit {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $gap-xxs;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    background: $bg;
    color: $black;
    transition: transform 0.08s, background 0.1s;

    &:active:not(:disabled) {
      transform: scale(0.97);
      background: $surface;
    }

    &:disabled { opacity: 0.5; }
  }

  &__hit-label {
    @include display-sm;
    line-height: 1;
  }

  &__hit-sub {
    @include text-xs;
    font-weight: 600;
    opacity: 0.8;
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: $gap-xs;
  }

  &__undo,
  &__miss {
    height: 76px;
    border-radius: $radius-sm;
  }

  &__undo {
    @include title-md;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    background: $surface;
    color: $black;
  }

  &__miss {
    @include title-xl;
    background: $black;
    color: $bg;

    &:disabled { opacity: 0.5; }
  }
}

@media (min-width: $bp-laptop) {
  .input {
    gap: $gap-md;

    &__slot { @include title-xxl; height: 64px; }
    &__hit-label { @include display-md; }
    &__hit-sub { @include text-md; }
    &__undo,
    &__miss { height: 88px; }
    &__undo { @include title-xl; }
    &__miss { @include title-xxxl; }
  }
}
</style>
