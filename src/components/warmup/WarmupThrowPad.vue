<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  darts: { type: Array, required: true }, // darts of the current volley (max 3)
  zones: { type: Array, required: true },
  locked: Boolean,
})

const emit = defineEmits(['dart', 'miss', 'undo'])

const slots = computed(() => [0, 1, 2].map(i => props.darts[i] ?? null))

// One row of buttons per zone; keyboard shortcuts 1-3 only make sense with a single zone
const rows = computed(() => props.zones.map(zone => {
  if (zone.sector === null) {
    return {
      key: 'bull',
      buttons: [
        { label: '25', sub: 'Outer', dart: { type: 'bull', sector: null, pts: 25, label: 'Outer' } },
        { label: '50', sub: 'Bull', dart: { type: 'bull', sector: null, pts: 50, label: 'Bull' } },
      ],
    }
  }
  const s = zone.sector
  return {
    key: s,
    buttons: [
      { label: `S${s}`, sub: 'Simple', dart: { type: 'single', sector: s, pts: s, label: `S${s}` } },
      { label: `D${s}`, sub: 'Double', dart: { type: 'double', sector: s, pts: s * 2, label: `D${s}` } },
      { label: `T${s}`, sub: 'Triple', dart: { type: 'triple', sector: s, pts: s * 3, label: `T${s}` } },
    ],
  }
}))

const showShortcuts = computed(() => rows.value.length === 1)

// Keyboard: 1-3 = S/D/T (single zone only), 0 or M = miss, Backspace = undo
function onKeydown(e) {
  if (props.locked || e.target.closest?.('input, textarea')) return
  if (e.key === 'Backspace') { emit('undo'); return }
  if (e.key === '0' || e.key.toLowerCase() === 'm') { emit('miss'); return }
  const btn = showShortcuts.value && rows.value[0].buttons[Number(e.key) - 1]
  if (btn) emit('dart', btn.dart)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="throw-pad" :class="{ 'throw-pad--multi': rows.length > 1 }">
    <div class="throw-pad__head">
      <span class="throw-pad__title">Volée en cours</span>
      <span class="throw-pad__count">Fléchette {{ Math.min(darts.length + 1, 3) }} sur 3</span>
    </div>

    <div class="throw-pad__slots">
      <span
        v-for="(dart, i) in slots"
        :key="i"
        class="throw-pad__slot"
        :class="dart && (dart.type === 'miss' ? 'throw-pad__slot--miss' : 'throw-pad__slot--hit')"
      >
        <AppIcon v-if="dart?.type === 'miss'" name="close" :width="22" :height="22" />
        <template v-else-if="dart">{{ dart.label }}</template>
      </span>
    </div>

    <div class="throw-pad__rows">
      <div v-for="row in rows" :key="row.key" class="throw-pad__row">
        <button
          v-for="(btn, i) in row.buttons"
          :key="btn.label"
          class="throw-pad__hit"
          :disabled="locked"
          @click="emit('dart', btn.dart)"
        >
          <span v-if="showShortcuts" class="throw-pad__key">{{ i + 1 }}</span>
          <span class="throw-pad__hit-label">{{ btn.label }}</span>
          <span class="throw-pad__hit-sub">{{ btn.sub }}</span>
        </button>
      </div>
    </div>

    <div class="throw-pad__actions">
      <button class="throw-pad__undo" @click="emit('undo')">
        <AppIcon name="undo" :width="20" :height="20" />
        Annuler
      </button>
      <button class="throw-pad__miss" :disabled="locked" @click="emit('miss')">Manqué</button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.throw-pad {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  min-height: 0;

  // Desktop-only header; key hints only show on devices with a keyboard and mouse
  &__head,
  &__key {
    display: none;
  }

  &__head {
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: $padding-xs;
    border-bottom: $border-lg solid $black;
  }

  &__title { @include title-xl; }

  &__count {
    @include text-sm;
    color: $muted;
  }

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

    &--hit {
      border-color: $accent;
      background: $accent;
      color: $white;
    }

    &--miss {
      border-color: $error;
      background: $error;
      color: $white;
    }
  }

  &__rows {
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

    &:active {
      transform: scale(0.97);
      background: $surface;
    }

    &:disabled {
      opacity: 0.5;
    }
  }

  &__key {
    @include text-sm;
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

  &__hit-sub {
    @include text-xs;
    opacity: 0.8;
  }

  &--multi &__hit-label {
    @include title-xxl;
  }

  &--multi &__hit-sub {
    display: none;
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
  }
}

@media (hover: hover) and (pointer: fine) {
  .throw-pad__key {
    display: flex;
  }
}

@media (min-width: $bp-laptop) {
  .throw-pad {
    gap: $gap-md;

    &__head { display: flex; }

    &__slot {
      @include title-xxl;
      height: 64px;
    }

    &__hit-label { @include display-sm; }
    &__hit-sub   { @include text-md; }

    &--multi &__hit-label { @include display-xs; }

    &__undo,
    &__miss {
      height: 88px;
    }

    &__undo { @include title-xl; }
    &__miss { @include title-xxxl; }
  }
}
</style>
