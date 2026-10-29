<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../AppHeader.vue'
import AppIcon from '../AppIcon.vue'
import AppModal from '../AppModal.vue'
import StartButton from '../StartButton.vue'
import SettingsPrinciple from './SettingsPrinciple.vue'
import SettingsRecap from './SettingsRecap.vue'

defineProps({
  title: { type: String, required: true },
  tone: { type: String, default: 'orange' },
  backTo: { type: String, default: 'play' },
  // Main area scrolls inside a full-height page instead of the page itself
  scroll: Boolean,
  // { text, chips } — shown in the desktop panel and in the mobile info sheet
  principle: { type: Object, default: null },
  // Chips summarizing the current choices, desktop panel only
  recap: { type: Array, default: null },
})

const router = useRouter()
const showPrinciple = ref(false)

function goBack(backTo) {
  router.push({ name: backTo })
}
</script>

<template>
  <div class="settings" :class="[`settings--${tone}`, { 'settings--scroll': scroll }]">
    <AppHeader class="settings__header" :title="title" :tone="tone" @back="goBack(backTo)">
      <template v-if="principle" #right>
        <button class="settings__info" aria-label="Le principe du mode" @click="showPrinciple = true">
          <AppIcon name="info" :width="26" :height="26" />
        </button>
      </template>
    </AppHeader>

    <aside class="settings__panel">
      <div class="settings__panel-head">
        <button class="settings__back" aria-label="Retour" @click="goBack(backTo)">
          <AppIcon name="arrow-left" :width="24" :height="24" />
        </button>
        <h1 class="settings__panel-title">{{ title }}</h1>
        <div class="settings__panel-actions">
          <slot name="panel-actions" />
        </div>
      </div>

      <h2 class="settings__headline">Nouvelle partie</h2>

      <SettingsPrinciple v-if="principle" variant="panel" :text="principle.text" :chips="principle.chips">
        <slot name="principle-extra" />
      </SettingsPrinciple>

      <SettingsRecap v-if="recap" class="settings__recap" :chips="recap" />
    </aside>

    <main class="settings__main">
      <div class="settings__primary">
        <slot />
      </div>

      <div class="settings__side">
        <slot name="side" />
      </div>

      <div class="settings__footer">
        <slot name="start" />
      </div>
    </main>

    <slot name="modals" />

    <AppModal v-if="principle" :show="showPrinciple" title="Le principe" @close="showPrinciple = false">
      <div class="settings__sheet">
        <SettingsPrinciple :text="principle.text" :chips="principle.chips" :tone="tone">
          <slot name="principle-extra" />
        </SettingsPrinciple>
        <StartButton :tone="tone" :arrow="false" @click="showPrinciple = false">Compris</StartButton>
      </div>
    </AppModal>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  @include safe-bottom($padding-md);

  @each $name, $color in $tones {
    &--#{$name} {
      --tone: #{$color};
      --player-accent: #{$color};
    }
  }

  &--scroll {
    height: 100dvh;
    min-height: 0;
  }

  &__info {
    display: flex;
    padding: $padding-xxs;
    color: $white;
  }

  &__panel { display: none; }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-lg $padding-md 0;
  }

  &--scroll &__main {
    min-height: 0;
    overflow-y: auto;
  }

  &__primary,
  &__side {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
  }

  &__side { flex: 1; }

  &__footer {
    display: flex;
    flex-direction: column;
    margin-top: auto;
  }

  &__sheet {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: 0 $padding-md $padding-xl;
  }
}

@media (min-width: $bp-laptop) {
  .settings {
    display: grid;
    grid-template-columns: 480px minmax(0, 1fr);
    @include safe-bottom(0px);

    &--scroll { grid-template-rows: minmax(0, 1fr); }

    &__header { display: none; }

    &__panel {
      display: flex;
      flex-direction: column;
      gap: $gap-xl;
      padding: $padding-xxl ($padding-xxl + $padding-xs) ($padding-xxl + $padding-xs);
      background: var(--tone);
      color: $white;
    }

    &__panel-head {
      display: flex;
      align-items: center;
      gap: $gap-sm;
    }

    &__back {
      display: flex;
      padding: $padding-xxs;
      color: $white;
    }

    &__panel-title {
      @include title-xxl;
      letter-spacing: $tracking-sm;
    }

    &__panel-actions {
      display: flex;
      margin-left: auto;
    }

    &__headline {
      @include title-xxxl;
      font-size: $title-hero;
      line-height: 0.85;
    }

    &__recap { margin-top: auto; }

    &__main {
      gap: $gap-xl;
      padding: ($padding-xxl + $padding-xs) ($padding-xxl + $padding-md);
    }

    &__primary,
    &__side { gap: $gap-xl; }
  }
}
</style>
