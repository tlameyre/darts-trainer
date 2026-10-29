<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import OptionSelector from '../components/OptionSelector.vue'
import OptionTile from '../components/OptionTile.vue'
import StartButton from '../components/StartButton.vue'
import SettingsLayout from '../components/settings/SettingsLayout.vue'
import SettingsSection from '../components/settings/SettingsSection.vue'
import CustomValueInput from '../components/settings/CustomValueInput.vue'
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

const PRINCIPLE = {
  text: 'Trouve la route pour finir chaque score. En révision libre la route est affichée ; en quiz tu la devines et gagnes des points selon la difficulté.',
  chips: ['2–170', 'Route', 'Quiz'],
}

const countLabel = computed(() => {
  if (settings.count === 'all') return 'Tous les checkouts'
  if (settings.count === Infinity) return 'Sans limite'
  const n = settings.count === 'custom' ? customCount.value : settings.count
  return `${n} checkouts`
})

const recap = computed(() => [
  settings.variant === 'quiz' ? 'Quiz noté' : 'Révision libre',
  ...(settings.variant === 'quiz' ? [countLabel.value] : []),
  orderOptions.find(o => o.value === settings.order).label,
  `${settings.brackets.length} tranche${settings.brackets.length > 1 ? 's' : ''}`,
])

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
  <SettingsLayout title="Checkouts" tone="cyan" back-to="home" :principle="PRINCIPLE" :recap="recap">
    <template #panel-actions>
      <button type="button" class="settings__wiki-btn" aria-label="Consulter les checkouts"
        @click="router.push({ name: 'checkout-wiki' })">
        <AppIcon name="book" :width="24" :height="24" />
      </button>
    </template>

    <SettingsSection class="settings__mode" label="Mode">
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
    </SettingsSection>

    <SettingsSection
      class="settings__brackets-section"
      label="Tranches de checkout"
      :hint="`${settings.brackets.length} sélectionnée${settings.brackets.length > 1 ? 's' : ''}`"
    >
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
    </SettingsSection>

    <OptionSelector v-model="settings.order" class="settings__order" label="Ordre" :options="orderOptions" tone="cyan" />

    <SettingsSection class="settings__count">
      <OptionSelector
        v-model="settings.count"
        label="Nombre de checkouts"
        :options="countOptions"
        tone="cyan"
        :class="{ 'settings__count--off': settings.variant !== 'quiz' }"
      />
      <span v-if="settings.variant !== 'quiz'" class="settings__hint">Quiz uniquement</span>
      <CustomValueInput v-model="customCount" :show="isCustomCount" :max="200" unit="checkouts" />
    </SettingsSection>

    <template #principle-extra>
      <p class="settings__source settings__source--panel">Données : {{ CHECKOUT_DATA_SOURCE }}</p>
    </template>

    <template #start>
      <div class="settings__start">
        <StartButton tone="cyan" @click="startGame" />
        <p class="settings__source">Données : {{ CHECKOUT_DATA_SOURCE }}</p>
      </div>
    </template>
  </SettingsLayout>
</template>

<style lang="scss" scoped>
.settings {
  &__wiki-btn {
    display: flex;
    color: $white;
    padding: $padding-xxs;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
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
      background: var(--tone);
      border-color: var(--tone);
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

  &__start {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__source {
    @include text-xs;
    color: $muted;
    text-align: center;

    // Desktop shows the source in the panel, mobile under the start button
    &--panel { display: none; }
  }
}

@media (min-width: $bp-laptop) {
  .settings {
    &__hint         { @include text-sm; }
    &__demo         { min-height: 48px; @include text-sm; }
    &__demo-score   { @include title-xxl; }
    &__demo-route   { @include title-md; }
    &__bracket      { height: 64px; }
    &__bracket-label { @include title-xl; }
    &__bracket-pts  { @include text-xs; }
    &__source       { @include text-sm; }

    &__start .settings__source { display: none; }
    &__source--panel { display: block; color: inherit; opacity: 0.8; text-align: left; }

    &__mode { order: 0; }
    &__count { order: 1; }
    &__order { order: 2; }
    &__brackets-section { order: 3; }
  }
}
</style>
