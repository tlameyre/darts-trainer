<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import OptionSelector from '../components/OptionSelector.vue'
import OptionTile from '../components/OptionTile.vue'
import StartButton from '../components/StartButton.vue'
import AppIcon from '../components/AppIcon.vue'
import { useGameStore } from '../store/gameStore.js'
import { CHECKOUT_BRACKETS, CHECKOUT_DATA_SOURCE } from '../composables/useCheckouts.js'

const router = useRouter()
const gameStore = useGameStore()

const settings = reactive({
  variant: 'review',
  brackets: [CHECKOUT_BRACKETS[2].label], // une tranche cochée au départ
  order: 'asc',
  count: 'all',
})

const customCount = ref(15)

const orderOptions = [
  { value: 'asc', label: 'Croissant' },
  { value: 'random', label: 'Aléatoire' },
]
const countOptions = [
  { value: 'all', label: 'Tout' },
  { value: 20, label: '20' },
  { value: 'custom', label: 'Perso' },
  { value: Infinity, label: 'Infini', icon: 'infinity' },
]

const isCustomCount = computed(() => settings.count === 'custom')

function toggleBracket(label) {
  const i = settings.brackets.indexOf(label)
  if (i >= 0) {
    if (settings.brackets.length > 1) settings.brackets.splice(i, 1)
  } else {
    settings.brackets.push(label)
  }
}

function startGame() {
  const brackets = CHECKOUT_BRACKETS
    .filter((b) => settings.brackets.includes(b.label))
    .map((b) => b.range)

  let count = settings.count
  if (count === 'custom') count = Number(customCount.value) > 0 ? Number(customCount.value) : 20

  gameStore.gameSettings = {
    mode: 'checkout',
    variant: settings.variant,
    brackets,
    order: settings.order,
    count,
  }
  router.push({ name: 'checkout-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="Checkouts" tone="cyan" @back="router.push({ name: 'home' })">
      <template #right>
        <button type="button" class="settings__wiki-btn" aria-label="Consulter les checkouts"
          @click="router.push({ name: 'checkout-wiki' })">
          <AppIcon name="book" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <main class="settings__main">
      <section class="settings__mode">
        <span class="settings__label">Mode</span>
        <div class="settings__tiles">
          <OptionTile
            tone="cyan"
            title="Révision libre"
            description="Parcours les checkouts à ton rythme, la route est affichée"
            :show-badge="false"
            :model-value="settings.variant === 'review'"
            @update:model-value="settings.variant = 'review'"
          >
            <template #preview>
              <span class="settings__demo">
                <span class="settings__demo-score">81</span>→<span class="settings__demo-route">T15 · D18</span>
              </span>
            </template>
          </OptionTile>
          <OptionTile
            tone="cyan"
            title="Quiz noté"
            description="Trouve la route de chaque score, points selon la difficulté"
            :show-badge="false"
            :model-value="settings.variant === 'quiz'"
            @update:model-value="settings.variant = 'quiz'"
          >
            <template #preview>
              <span class="settings__demo">
                <span class="settings__demo-score">81</span>→<span class="settings__demo-blank" /><span class="settings__demo-pts">+4 pts</span>
              </span>
            </template>
          </OptionTile>
        </div>
      </section>

      <section class="settings__brackets-block">
        <div class="settings__head">
          <span class="settings__label">Tranches de checkout</span>
          <span class="settings__hint">{{ settings.brackets.length }} sélectionnée{{ settings.brackets.length > 1 ? 's' : '' }}</span>
        </div>
        <div class="settings__brackets">
          <button
            v-for="b in CHECKOUT_BRACKETS"
            :key="b.label"
            class="settings__bracket"
            :class="{ 'settings__bracket--on': settings.brackets.includes(b.label) }"
            :aria-pressed="settings.brackets.includes(b.label)"
            @click="toggleBracket(b.label)"
          >
            <AppIcon v-if="settings.brackets.includes(b.label)" class="settings__bracket-check" name="check" :width="14" :height="14" />
            <span class="settings__bracket-label">{{ b.label }}</span>
            <span class="settings__bracket-pts">{{ b.points }} pt{{ b.points > 1 ? 's' : '' }}</span>
          </button>
        </div>
      </section>

      <OptionSelector v-model="settings.order" class="settings__order" label="Ordre" :options="orderOptions" tone="cyan" />

      <section class="settings__count">
        <OptionSelector
          v-model="settings.count"
          label="Nombre de checkouts"
          :options="countOptions"
          tone="cyan"
          :class="{ 'settings__count--off': settings.variant !== 'quiz' }"
        />
        <span v-if="settings.variant !== 'quiz'" class="settings__hint">Quiz uniquement</span>
        <div v-if="isCustomCount" class="settings__custom">
          <input v-model="customCount" type="number" min="1" max="200" class="settings__custom-input" />
          <span class="settings__custom-label">checkouts</span>
        </div>
      </section>

      <div class="settings__start">
        <StartButton tone="cyan" @click="startGame" />
        <p class="settings__source">Données : {{ CHECKOUT_DATA_SOURCE }}</p>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-lg $padding-md 0;
    @include safe-bottom($padding-xl);
  }

  &__wiki-btn {
    display: flex;
    color: $white;
    padding: $padding-xxs;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__mode,
  &__brackets-block,
  &__count {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__label {
    @include title-sm;
    color: $muted;
  }

  &__hint {
    @include text-xs;
    color: $muted;
  }

  &__tiles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__demo {
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xxs;
    padding: 0 $padding-xs;
    @include text-xs;
  }

  &__demo-score { @include title-xl; }
  &__demo-route { @include title-sm; }

  &__demo-blank {
    width: 32px;
    height: 20px;
    flex-shrink: 0;
    border: $border-md dashed currentColor;
    border-radius: $radius-sm;
    opacity: 0.6;
  }

  &__demo-pts {
    @include title-xxs;
    white-space: nowrap;
    padding: 2px $padding-xxs;
    border-radius: $radius-sm;
    background: rgba($white, 0.2);
  }

  &__brackets {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__bracket {
    position: relative;
    height: 56px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;

    // Last bracket alone on its row takes the full width
    &:last-child { grid-column: 1 / -1; }

    &--on {
      background: $mode-checkout;
      border-color: $mode-checkout;
      color: $white;
    }
  }

  &__bracket-check {
    position: absolute;
    top: $padding-xxs;
    right: $padding-xxs;
  }

  &__bracket-label {
    @include title-md;
    line-height: 1;
  }

  &__bracket-pts {
    @include text-xxs;
    opacity: 0.75;
  }

  &__count--off { opacity: 0.4; }

  &__custom {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__custom-input {
    flex: 1;
    min-width: 0;
    height: 44px;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $white;
    color: $text-color;
    @include title-md;
    text-align: center;

    &:focus { outline: none; border-color: $mode-checkout; }
  }

  &__custom-label { @include title-md; }

  &__start {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__source {
    @include text-xs;
    color: $muted;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  // Number, order and brackets on the left; mode and start on the right
  .settings {
    &__main {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: auto auto minmax(0, 1fr);
      grid-template-areas:
        'count    mode'
        'order    start'
        'brackets start';
      align-content: start;
      gap: $gap-xxl $gap-xxl * 2;
      padding: $padding-xxl;
    }

    &__mode           { grid-area: mode; }
    &__brackets-block { grid-area: brackets; }
    &__order          { grid-area: order; }
    &__count          { grid-area: count; }
    &__start          { grid-area: start; align-self: end; }

    &__label        { @include title-md; }
    &__hint         { @include text-sm; }
    &__demo         { min-height: 48px; @include text-sm; }
    &__demo-score   { @include title-xxl; }
    &__demo-route   { @include title-md; }
    &__bracket      { height: 64px; }
    &__bracket-label { @include title-xl; }
    &__bracket-pts  { @include text-xs; }
    &__custom-input { height: 56px; @include title-lg; }
    &__custom-label { @include title-lg; }
    &__source       { @include text-sm; }
  }
}
</style>
