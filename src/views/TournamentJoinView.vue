<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTournamentStore } from '../store/tournamentStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
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
    <AppHeader title="Invitation" tone="tournament" @back="router.push({ name: 'tournaments' })" />

    <p v-if="loading" class="join__message">Chargement…</p>

    <template v-else-if="preview">
      <section class="join__hero">
        <span class="join__icon"><AppIcon name="trophy" :width="40" :height="40" /></span>
        <span v-if="preview.host_name" class="join__host">{{ preview.host_name }} t'invite</span>
        <h2 class="join__name">{{ preview.name }}</h2>
        <p v-if="preview.description" class="join__description">{{ preview.description }}</p>
        <span class="join__count">
          {{ preview.participant_count }} inscrit{{ preview.participant_count > 1 ? 's' : '' }} · min. {{ MIN_PARTICIPANTS_TO_START }} pour démarrer
        </span>
      </section>

      <main class="join__main">
        <p v-if="!canJoin" class="join__warning">Ce tournoi a déjà démarré, impossible de le rejoindre.</p>
        <p v-if="error" class="join__warning">{{ error }}</p>

        <div class="join__actions">
          <AppButton variant="secondary" @click="router.push({ name: 'tournaments' })">Plus tard</AppButton>
          <AppButton tone="tournament" :disabled="joining || !canJoin" @click="join">
            {{ joining ? 'Inscription...' : 'Rejoindre' }}
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
    max-width: 720px;

    &__hero { padding: $padding-xl $padding-xxl; }
    &__host { @include text-sm; }
    &__name { @include display-xs; }
    &__description,
    &__count,
    &__message,
    &__warning { @include text-md; }
    &__main { padding: $padding-xl; }
  }
}
</style>
