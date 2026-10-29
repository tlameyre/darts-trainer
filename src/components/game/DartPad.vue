<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  darts: { type: Array, required: true }, // darts of the current volley (max 3)
  // One row per zone: [{ key, buttons: [{ label, sub, dart }] }]
  rows: { type: Array, required: true },
  locked: Boolean,
  // Hits turn green and misses red (training scores) instead of the mode color and black
  scored: Boolean,
  // Keys 1–3 throw the buttons of the first row; 0 or M = miss; Backspace = undo
  shortcuts: Boolean,
})

const emit = defineEmits(['dart', 'miss', 'undo'])

const slots = computed(() => [0, 1, 2].map(i => props.darts[i] ?? null))

function onKeydown(e) {
  if (props.locked || e.target.closest?.('input, textarea')) return
  if (e.key === 'Backspace') { emit('undo'); return }
  if (e.key === '0' || e.key.toLowerCase() === 'm') { emit('miss'); return }
  const btn = props.rows[0]?.buttons[Number(e.key) - 1]
  if (btn) emit('dart', btn.dart)
}

onMounted(() => props.shortcuts && window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="dart-pad" :class="{ 'dart-pad--scored': scored, 'dart-pad--multi': rows.length > 1 }">
    <div class="dart-pad__slots">
      <span
        v-for="(dart, i) in slots"
        :key="i"
        class="dart-pad__slot"
        :class="dart && (dart.type === 'miss' ? 'dart-pad__slot--miss' : 'dart-pad__slot--hit')"
      >
        <AppIcon v-if="dart?.type === 'miss'" name="close" :width="48" :height="48" />
        <template v-else-if="dart">{{ dart.label }}</template>
      </span>
    </div>

    <div class="dart-pad__hits">
      <div v-for="row in rows" :key="row.key" class="dart-pad__row">
        <button
          v-for="(btn, i) in row.buttons"
          :key="btn.label"
          class="dart-pad__hit"
          :disabled="locked"
          @click="emit('dart', btn.dart)"
        >
          <span v-if="shortcuts" class="dart-pad__key">{{ i + 1 }}</span>
          <span class="dart-pad__hit-label">{{ btn.label }}</span>
          <span v-if="btn.sub" class="dart-pad__hit-sub">{{ btn.sub }}</span>
        </button>
      </div>
    </div>

    <div class="dart-pad__actions">
      <button class="dart-pad__undo" @click="emit('undo')">
        <AppIcon name="undo" :width="20" :height="20" />
        Annuler
      </button>
      <button class="dart-pad__miss" :disabled="locked" @click="emit('miss')">Manqué</button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.dart-pad {
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
    @include title-xxxl;
    flex: 1;
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    line-height: 1;

    &--hit {
      border-color: var(--tone);
      background: var(--tone);
      color: $white;
    }

    &--miss {
      border-color: $black;
      background: $black;
      color: $bg;
    }
  }

  &--scored &__slot--hit {
    border-color: $accent;
    background: $accent;
  }

  &--scored &__slot--miss {
    border-color: $error;
    background: $error;
    color: $white;
  }

  &__hits {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__row {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    gap: $gap-xs;
  }

  &__hit {
    position: relative;
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

  // Key hints only show on devices with a keyboard and mouse
  &__key {
    @include text-sm;
    display: none;
    position: absolute;
    top: $padding-xs;
    left: $padding-xs;
    min-width: 26px;
    height: 26px;
    align-items: center;
    justify-content: center;
    padding: 0 $padding-xs;
    border: $border-sm solid $border-color;
    border-radius: $radius-sm;
    color: $muted;
  }

  &__hit-label {
    @include display-xs;
    line-height: 1;
  }

  &--multi &__hit-label { @include title-xxl; }

  &__hit-sub {
    @include text-xs;
    font-weight: 600;
    opacity: 0.8;
  }

  &--multi &__hit-sub { display: none; }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: $gap-xs;
  }

  &__undo,
  &__miss {
    min-height: 76px;
    padding: $padding-lg;
    border-radius: $radius-sm;
  }

  &__undo {
    @include title-md;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    border: $border-md solid $border-color;
    background: $surface;
    color: $black;
  }

  &__miss {
    @include title-xxl;
    background: $black;
    color: $bg;

    &:disabled { opacity: 0.5; }
  }
}

@media (hover: hover) and (pointer: fine) {
  .dart-pad__key { display: flex; }
}

@media (min-width: $bp-laptop) {
  .dart-pad {
    gap: $gap-md;

    &__hits { gap: $gap-md; }

    &__slot {
      @include display-md;
      min-height: 110px;

      :deep(svg) {
        width: 100px;
        height: 100px;
      }
    }

    &__hit-label { @include display-md; }
    &--multi &__hit-label { @include display-xs; }
    &__hit-sub { @include text-md; }

    &__undo { @include title-xxl; }
    &__miss { @include title-xxxl; }
  }
}
</style>
