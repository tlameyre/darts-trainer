<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
import OptionSelector from '../components/OptionSelector.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import { useTournamentStore } from '../store/tournamentStore.js'

const router          = useRouter()
const tournamentStore = useTournamentStore()

const SCORE_OPTIONS = [
  { value: 301, label: '301' },
  { value: 501, label: '501' },
  { value: 'custom', label: 'Custom' },
]
const ELIMINATION_OPTIONS = [
  { value: false, label: 'Simple' },
  { value: true,  label: 'Double' },
]
const PLAYOFF_OPTIONS = [
  { value: null, label: 'Aucun' },
  { value: 2,    label: 'Top 2' },
  { value: 4,    label: 'Top 4' },
]
const MIN_LEGS = 1
const MAX_LEGS = 9

const step = ref(1)

const name        = ref(`Tournoi du ${new Date().toLocaleDateString('fr-FR')}`)
const description = ref('')
const settings = reactive({
  format:            'bracket',
  scoreKey:          501,
  legsToWin:         2,
  doubleElimination: false,
  doubleRoundRobin:  false,
  playoffSize:       null,
})
const customScore = ref(401)
const creating    = ref(false)

const isChampionship = computed(() => settings.format === 'championship')
const isCustomScore  = computed(() => settings.scoreKey === 'custom')
const effectiveScore = computed(() =>
  isCustomScore.value ? Math.max(1, Number(customScore.value) || 501) : settings.scoreKey
)
const canSubmitStep1 = computed(() => name.value.trim().length > 0)

function goToStep2() {
  if (!canSubmitStep1.value) return
  step.value = 2
}

function backFromHeader() {
  if (step.value === 2) { step.value = 1; return }
  router.push({ name: 'tournaments' })
}

async function createTournament() {
  if (creating.value) return
  creating.value = true
  const id = await tournamentStore.createTournamentShell({
    name:        name.value.trim(),
    description: description.value.trim(),
    format:      settings.format,
    startScore:  effectiveScore.value,
    legsToWin:   settings.legsToWin,
    ...(isChampionship.value
      ? { doubleRoundRobin: settings.doubleRoundRobin, playoffSize: settings.playoffSize }
      : { doubleElimination: settings.doubleElimination }),
  })
  creating.value = false
  if (id) router.push({ name: 'tournament-detail', params: { id } })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="Nouveau tournoi" tone="tournament" @back="backFromHeader" />

    <div class="settings__body">
      <div class="settings__steps">
        <div v-for="(label, i) in ['1. Nom', '2. Format']" :key="label" class="settings__step" :class="{ 'settings__step--done': step > i, 'settings__step--current': step === i + 1 }">
          <span class="settings__step-bar" />
          <span class="settings__step-label">{{ label }}</span>
        </div>
      </div>

      <main class="settings__main">
        <template v-if="step === 1">
          <label class="settings__field">
            <span class="settings__label">Nom du tournoi</span>
            <input v-model="name" class="settings__input" maxlength="60" />
          </label>

          <label class="settings__field">
            <span class="settings__label">Description <span class="settings__optional">Optionnel</span></span>
            <textarea v-model="description" class="settings__input settings__input--area" rows="4" maxlength="240"
              placeholder="Règles maison, lieu, lot à gagner…" />
          </label>

          <div class="settings__note">
            <AppIcon name="user-plus" :width="20" :height="20" />
            <span>Tu inviteras les joueurs après la création, avec un code ou un lien à partager.</span>
          </div>
        </template>

        <template v-else>
          <section class="settings__field">
            <span class="settings__label">Format</span>
            <div class="settings__formats">
              <button class="settings__format" :class="{ 'settings__format--on': !isChampionship }" :aria-pressed="!isChampionship" @click="settings.format = 'bracket'">
                <span v-if="!isChampionship" class="settings__format-check"><AppIcon name="check" :width="14" :height="14" /></span>
                <svg class="settings__format-art" viewBox="0 0 96 56" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M4 6h22v12H4M4 38h22v12H4M26 12h10v32H26M36 28h22M58 20h20v16H58M84 28h8" /></g></svg>
                <span class="settings__format-name">Bracket</span>
                <span class="settings__format-hint">Élimination jusqu'au vainqueur</span>
              </button>
              <button class="settings__format" :class="{ 'settings__format--on': isChampionship }" :aria-pressed="isChampionship" @click="settings.format = 'championship'">
                <span v-if="isChampionship" class="settings__format-check"><AppIcon name="check" :width="14" :height="14" /></span>
                <svg class="settings__format-art" viewBox="0 0 96 56" aria-hidden="true"><g fill="currentColor"><rect x="4" y="4" width="88" height="8" rx="2" opacity="0.9" /><rect x="4" y="17" width="88" height="8" rx="2" opacity="0.65" /><rect x="4" y="30" width="88" height="8" rx="2" opacity="0.45" /><rect x="4" y="43" width="88" height="8" rx="2" opacity="0.3" /></g></svg>
                <span class="settings__format-name">Championnat</span>
                <span class="settings__format-hint">Tous contre tous, par journées</span>
              </button>
            </div>
          </section>

          <template v-if="isChampionship">
            <section class="settings__field">
              <span class="settings__label">Options du championnat</span>
              <div class="settings__card">
                <ToggleSwitch v-model="settings.doubleRoundRobin" tone="tournament" title="Aller-retour" description="Chaque duel se joue deux fois" />
              </div>
              <div class="settings__card">
                <OptionSelector v-model="settings.playoffSize" label="Playoffs" :options="PLAYOFF_OPTIONS" tone="tournament" />
              </div>
            </section>
          </template>
          <template v-else>
            <OptionSelector v-model="settings.doubleElimination" label="Élimination" :options="ELIMINATION_OPTIONS" tone="tournament" />
            <p class="settings__hint">Double : un 2e tableau pour les perdants, jusqu'à la grande finale. Nécessite 4, 8, 16… joueurs au démarrage.</p>
          </template>

          <div class="settings__field">
            <OptionSelector v-model="settings.scoreKey" label="Score de départ" :options="SCORE_OPTIONS" tone="tournament" />
            <Transition name="slide-fade">
              <div v-if="isCustomScore" class="settings__custom">
                <input v-model.number="customScore" type="number" min="1" max="9999" class="settings__input settings__input--custom" placeholder="ex: 701" />
                <span class="settings__hint">pts</span>
              </div>
            </Transition>
          </div>

          <section class="settings__field">
            <span class="settings__label">Manches à gagner <span class="settings__optional">par match</span></span>
            <div class="settings__stepper">
              <button class="settings__stepper-btn" aria-label="Moins" :disabled="settings.legsToWin <= MIN_LEGS" @click="settings.legsToWin--">
                <AppIcon name="minus" :width="24" :height="24" />
              </button>
              <span class="settings__stepper-value">{{ settings.legsToWin }}</span>
              <button class="settings__stepper-btn settings__stepper-btn--plus" aria-label="Plus" :disabled="settings.legsToWin >= MAX_LEGS" @click="settings.legsToWin++">
                <AppIcon name="plus" :width="24" :height="24" />
              </button>
            </div>
          </section>
        </template>
      </main>

      <AppButton v-if="step === 1" tone="tournament" :disabled="!canSubmitStep1" @click="goToStep2">Suivant</AppButton>
      <AppButton v-else tone="tournament" :disabled="creating" @click="createTournament">
        {{ creating ? 'Création...' : 'Créer le tournoi' }}
      </AppButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  @include safe-bottom($padding-lg);

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 auto;
    padding: $padding-md $padding-md 0;
    gap: $gap-md;
  }

  &__steps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $gap-xs;
  }

  &__step {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    color: $muted;

    &--done { color: $text-color; }
    &--current { color: $mode-tournament; }
  }

  &__step-bar {
    height: 6px;
    border-radius: 2px;
    background: $border-color;

    .settings__step--done &,
    .settings__step--current & { background: $mode-tournament; }
  }

  &__step-label {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__label {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    @include title-sm;
    color: $muted;
  }

  &__optional {
    @include text-xs;
    text-transform: none;
    color: $muted;
  }

  &__input {
    height: 52px;
    padding: 0 $padding-sm;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    background: $white;
    color: $text-color;
    @include text-md;

    &:focus { outline: none; border-color: $mode-tournament; }

    &--area {
      height: auto;
      padding: $padding-sm;
      border-color: $border-color;
      resize: none;
    }

    &--custom { flex: 1; border-color: $border-color; }
  }

  &__custom {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__note {
    display: flex;
    gap: $gap-sm;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
    color: $mode-tournament;
    @include text-sm;

    span { color: $muted; }
  }

  &__card {
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__hint {
    @include text-xs;
    color: $muted;
  }

  &__formats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $gap-xs;
  }

  &__format {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $gap-xs;
    padding: $padding-sm;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $surface;
    color: $text-color;
    text-align: left;
    transition: background 0.15s, border-color 0.15s;

    &--on {
      background: $mode-tournament;
      border-color: $mode-tournament;
      color: $white;
    }
  }

  &__format-check {
    position: absolute;
    top: $padding-xs;
    right: $padding-xs;
    width: 22px;
    height: 22px;
    border-radius: $radius-pill;
    background: $white;
    color: $mode-tournament;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__format-art { width: 96px; height: 56px; }
  &__format-name { @include title-lg; line-height: 1; }
  &__format-hint { @include text-xs; opacity: 0.85; }

  &__stepper {
    display: grid;
    grid-template-columns: 56px 1fr 56px;
    gap: $gap-xs;
    align-items: center;
  }

  &__stepper-btn {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;

    &--plus {
      border-color: $mode-tournament;
      background: $mode-tournament;
      color: $white;
    }

    &:disabled { opacity: 0.4; }
  }

  &__stepper-value {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $surface;
    @include display-xs;
  }
}

@media (min-width: $bp-laptop) {
  .settings {
    &__body {
      max-width: 640px;
      padding: $padding-xl $padding-xl 0;
      gap: $gap-lg;
    }

    &__step-label { @include text-sm; }
    &__label { @include title-md; }
    &__optional,
    &__hint { @include text-sm; }
    &__input { @include text-lg; }
    &__note { @include text-md; }
    &__format-name { @include title-xl; }
    &__format-hint { @include text-sm; }
  }
}

.slide-fade-enter-active, .slide-fade-leave-active { transition: opacity 0.15s; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; }
</style>
