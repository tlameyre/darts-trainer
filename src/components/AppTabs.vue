<script setup>
defineProps({
  // [{ id, label, color? }]
  tabs:       { type: Array,   required: true },
  modelValue: { type: String,  required: true },
  variant:    { type: String,  default: 'pill' }, // 'pill' | 'chip' | 'bar' | 'underline'
  scrollable: { type: Boolean, default: false },  // défile horizontalement + snap
})

const emit = defineEmits(['update:modelValue'])

function select(tab, e) {
  emit('update:modelValue', tab.id)
  e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
}
</script>

<template>
  <div class="app-tabs" :class="[`app-tabs--${variant}`, { 'app-tabs--scrollable': scrollable }]">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="app-tabs__tab"
      :class="{ 'app-tabs__tab--active': modelValue === tab.id }"
      :style="modelValue === tab.id && tab.color ? { '--tab-color': tab.color } : {}"
      @click="select(tab, $event)"
    >
      <slot :name="tab.id">{{ tab.label }}</slot>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.app-tabs {
  display: flex;

  // ── Pill (StatsView) ──────────────────────────────────────────────────────
  &--pill {
    gap: $gap-xs;
    background: rgba($white, 0.05);
    border-radius: $radius-sm;
    padding: 4px;

    .app-tabs__tab {
      flex: 1;
      padding: $padding-xs $padding-sm;
      border-radius: calc($radius-sm - 4px);
      @include title-sm;
      font-weight: 700;
      text-transform: uppercase;
      color: $muted;
      transition: background 0.2s, color 0.2s;
      letter-spacing: 0.03em;

      &--active {
        background: var(--tab-color, $orange);
        color: $white;
      }
    }
  }

  // ── Chip (StatsView) — outlined, filled with the tab color when active ────
  &--chip {
    gap: $gap-xs;

    .app-tabs__tab {
      flex: 1;
      height: 40px;
      padding: 0 $padding-sm;
      border: $border-md solid $border-color;
      border-radius: $radius-sm;
      @include title-sm;
      text-transform: uppercase;
      color: $text-color;
      transition: background 0.15s, border-color 0.15s, color 0.15s;

      &--active {
        background: var(--tab-color, $orange);
        border-color: var(--tab-color, $orange);
        color: $white;
      }
    }
  }

  // ── Bar — white underline, for colored backgrounds (warmup detail) ───────
  &--bar {
    padding: 0 $padding-sm;
    border-bottom: $border-sm solid rgba($white, 0.25);

    .app-tabs__tab {
      flex: 1;
      height: 44px;
      @include title-sm;
      text-transform: uppercase;
      color: $white;
      opacity: 0.7;
      border-bottom: 3px solid transparent;
      transition: opacity 0.15s, border-color 0.15s;

      &--active {
        opacity: 1;
        border-bottom-color: $white;
      }
    }
  }

  // ── Scrollable + snap (combine avec --pill / --chip) ──────────────────────
  &--scrollable {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    border-radius: $radius-sm;

    &::-webkit-scrollbar { display: none; }

    .app-tabs__tab {
      flex: 1 0 auto;
      min-width: max-content;
      white-space: nowrap;
      scroll-snap-align: center;
    }
  }

  // ── Leg — left-aligned tabs, underline in the tab color (match leg detail) ─
  &--leg {
    padding: 0 $padding-xxs;
    border-bottom: $border-sm solid $border-color;

    .app-tabs__tab {
      @include title-sm;
      height: 48px;
      padding: 0 10px;
      color: $muted;
      text-transform: uppercase;
      border-bottom: 3px solid transparent;
      transition: color 0.15s, border-color 0.15s;

      &--active {
        color: $text-color;
        border-bottom-color: var(--tab-color, $accent);
      }

      &:active { opacity: 0.7; }
    }

    &.app-tabs--scrollable .app-tabs__tab { flex: none; }
  }

  // ── Underline — heavy ink underline on the active tab (FriendsView) ───────
  &--underline {
    padding: 0 $padding-xs;
    border-bottom: $border-sm solid $border-color;

    .app-tabs__tab {
      @include title-md;
      flex: 1;
      height: 48px;
      color: $muted;
      text-transform: uppercase;
      border-bottom: 3px solid transparent;
      transition: color 0.15s, border-color 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $gap-xs;

      &--active {
        color: $text-color;
        border-bottom-color: $black;
      }

      &:active { opacity: 0.7; }
    }
  }
}

@media (min-width: $bp-laptop) {
  .app-tabs--pill .app-tabs__tab {
    @include title-md;
    padding: $padding-sm $padding-md;
  }

  .app-tabs--chip .app-tabs__tab {
    @include title-md;
    height: 48px;
  }

  .app-tabs--bar {
    padding: 0;

    .app-tabs__tab {
      @include title-md;
      flex: none;
      height: 48px;
      padding: 0 $padding-lg;
    }
  }

  .app-tabs--leg {
    padding: 0 $padding-xl;

    .app-tabs__tab {
      @include title-lg;
      height: 64px;
      padding: 0 $padding-md;
      border-bottom-width: 4px;
    }
  }

  .app-tabs--underline .app-tabs__tab {
    @include title-lg;
  }
}
</style>
