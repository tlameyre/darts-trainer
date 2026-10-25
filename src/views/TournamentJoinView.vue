<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTournamentStore } from '../store/tournamentStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
import SectionTitle from '../components/SectionTitle.vue'
import { MIN_PARTICIPANTS_TO_START } from '../data/tournamentConstants.js'

const props = defineProps({
  // Preview /dev uniquement
  mockPreview: { type: Object, default: null },
})

const route           = useRoute()
const router          = useRouter()
const tournamentStore = useTournamentStore()

const preview = ref(null)
const loading = ref(true)
const joining = ref(false)
const error   = ref('')

onMounted(async () => {
  if (props.mockPreview) {
    preview.value = props.mockPreview
    loading.value = false
    return
  }
  preview.value = await tournamentStore.fetchTournamentPreviewByCode(route.params.code)
  loading.value = false
})

const STEPS = [
  { title: 'Tu rejoins la liste', desc: "Ton nom apparaît dans les joueurs inscrits, l'organisateur est prévenu." },
  { title: "L'organisateur lance le tournoi", desc: `Dès ${MIN_PARTICIPANTS_TO_START} joueurs. Le tableau est tiré au sort à ce moment-là.` },
  { title: 'Tu joues tes matchs', desc: "Ton prochain match s'affiche en haut du tournoi." },
]

const canJoin = computed(() => preview.value?.status === 'pending')

async function join() {
  if (joining.value) return
  joining.value = true
  const tournamentId = await tournamentStore.joinTournament(route.params.code)
  joining.value = false
  if (tournamentId) {
    router.push({ name: 'tournament-detail', params: { id: tournamentId } })
  } else {
    error.value = "Impossible de rejoindre ce tournoi (code invalide ou tournoi déjà démarré)."
  }
}
</script>

<template>
  <div class="join">
    <AppHeader class="join__header" title="Invitation" tone="tournament" @back="router.push({ name: 'tournaments' })" />

    <p v-if="loading" class="join__message">Chargement…</p>

    <template v-else-if="preview">
      <section class="join__hero">
        <header class="join__bar">
          <button class="join__back" aria-label="Retour" @click="router.push({ name: 'tournaments' })">
            <AppIcon name="arrow-left" :width="24" :height="24" />
          </button>
          <h1 class="join__bar-title">Invitation</h1>
        </header>

        <span class="join__icon"><AppIcon name="trophy" :width="40" :height="40" /></span>
        <span v-if="preview.host_name" class="join__host">{{ preview.host_name }} t'invite</span>
        <h2 class="join__name">{{ preview.name }}</h2>
        <p v-if="preview.description" class="join__description">{{ preview.description }}</p>
        <span class="join__count">
          {{ preview.participant_count }} inscrit{{ preview.participant_count > 1 ? 's' : '' }} · min. {{ MIN_PARTICIPANTS_TO_START }} pour démarrer
        </span>
      </section>

      <main class="join__main">
        <section class="join__steps">
          <SectionTitle ruled title="Comment ça se passe" />
          <ol class="join__list">
            <li v-for="(step, i) in STEPS" :key="step.title" class="join__step">
              <span class="join__step-num">{{ i + 1 }}</span>
              <span class="join__step-text">
                <span class="join__step-title">{{ step.title }}</span>
                <span class="join__step-desc">{{ step.desc }}</span>
              </span>
            </li>
          </ol>
        </section>

        <p v-if="!canJoin" class="join__warning">Ce tournoi a déjà démarré, impossible de le rejoindre.</p>
        <p v-if="error" class="join__warning">{{ error }}</p>

        <div class="join__actions">
          <AppButton variant="secondary" @click="router.push({ name: 'tournaments' })">Plus tard</AppButton>
          <AppButton tone="tournament" :disabled="joining || !canJoin" @click="join">
            {{ joining ? 'Inscription...' : 'Rejoindre le tournoi' }}
          </AppButton>
        </div>
      </main>
    </template>

    <p v-else class="join__message join__message--error">Code de tournoi invalide.</p>
  </div>
</template>

<style lang="scss" scoped>
.join {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  margin: 0 auto;
  @include safe-bottom;

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-lg $padding-md;
    background: $mode-tournament;
    color: $white;
    text-align: center;
  }

  &__icon {
    width: 72px;
    height: 72px;
    border-radius: $radius-sm;
    background: $white;
    color: $mode-tournament;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__host {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.85;
  }

  &__name { @include title-xxl; line-height: 0.9; }
  &__description { @include text-sm; opacity: 0.9; }
  &__count { @include text-sm; }

  &__bar { display: none; }
  &__steps { display: none; }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: $gap-md;
    padding: $padding-md;
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: $gap-xs;
  }

  &__message {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xl;

    &--error { color: $error; }
  }

  &__warning {
    @include text-sm;
    color: $error;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  .join {
    display: grid;
    grid-template-columns: 560px minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    height: 100dvh;
    max-width: none;
    padding-bottom: 0;

    &__header { display: none; }

    &__hero {
      grid-column: 1;
      align-items: flex-start;
      justify-content: center;
      gap: $gap-lg;
      padding: $padding-xxl $padding-xxl * 1.25 $padding-xxl * 1.25;
      text-align: left;
    }

    &__bar {
      display: flex;
      align-items: center;
      gap: $gap-sm;
      align-self: stretch;
      margin-bottom: auto;
    }

    &__back {
      display: flex;
      padding: $padding-xxs;
      color: $white;
    }

    &__bar-title {
      @include title-xl;
      letter-spacing: $tracking-sm;
    }

    &__icon { width: 96px; height: 96px; }
    &__host { @include text-sm; }
    &__name { @include display-sm; line-height: 0.85; }
    &__description { @include text-md; }
    &__count { @include text-md; }

    &__main {
      grid-column: 2;
      justify-content: flex-start;
      gap: $gap-xl;
      padding: $padding-xxl * 2.25 $padding-xxl * 2.25 $padding-xxl * 1.5;
    }

    &__steps {
      display: flex;
      flex-direction: column;
      gap: $gap-xl;
      max-width: 620px;
    }

    &__list {
      display: flex;
      flex-direction: column;
      gap: $gap-xl;
    }

    &__step {
      display: grid;
      grid-template-columns: 48px 1fr;
      gap: $gap-md;
      align-items: start;
    }

    &__step-num {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: $radius-sm;
      background: $surface;
      color: $mode-tournament;
      @include title-xxl;
    }

    &__step-text {
      display: flex;
      flex-direction: column;
      gap: $gap-xxs;
    }

    &__step-title { @include title-xl; line-height: 1; }
    &__step-desc { @include text-md; line-height: 1.45; color: $muted; }

    &__actions {
      grid-template-columns: 1fr 1fr;
      gap: $gap-sm;
      margin-top: auto;

      :deep(.btn) { height: 60px; padding: 0; @include title-xl; }
    }

    &__message { grid-column: 1 / -1; @include text-md; }
    &__warning { @include text-md; }
  }
}
</style>
