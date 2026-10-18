<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useGameStore } from '../store/gameStore.js'
import { useOnlineMatchStore, profileName } from '../store/onlineMatchStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'

const props = defineProps({
  // Preview /dev uniquement : { match, myId }
  mock: { type: Object, default: null },
})

const route            = useRoute()
const router           = useRouter()
const authStore        = useAuthStore()
const dbStore          = useDbStore()
const gameStore        = useGameStore()
const onlineMatchStore = useOnlineMatchStore()

const match   = ref(null)
const loading = ref(true)
const busy    = ref(false)

const myId     = computed(() => props.mock?.myId ?? authStore.user?.id)
const isHost   = computed(() => match.value?.host_id === myId.value)
const opponent = computed(() => match.value && profileName(isHost.value ? match.value.guest : match.value.host))
const summary  = computed(() => {
  if (!match.value) return ''
  const { startScore, legsToWin } = match.value.settings
  return `${startScore} · ${legsToWin} manche${legsToWin > 1 ? 's' : ''} gagnante${legsToWin > 1 ? 's' : ''}`
})

const CLOSED_MESSAGES = {
  declined:  'Invitation refusée.',
  cancelled: 'Invitation annulée.',
  completed: 'Ce match est terminé.',
  abandoned: 'Ce match a été abandonné.',
}

async function load() {
  match.value   = await dbStore.fetchOnlineMatch(route.params.id)
  loading.value = false
}

function startGame() {
  gameStore.gameSettings = onlineMatchStore.buildGameSettings(match.value)
  router.replace({ name: 'x01-game', query: { online: match.value.id } })
}

async function run(action) {
  busy.value = true
  const updated = await action(match.value.id)
  busy.value = false
  if (updated) match.value = updated
  else await load()
}

onMounted(() => {
  if (props.mock) {
    match.value   = props.mock.match
    loading.value = false
    return
  }
  load()
})

// Le store reçoit les changements de online_matches en temps réel
if (!props.mock) {
  watch(() => onlineMatchStore.openMatches, load)
  watch(() => match.value?.status, (status) => {
    if (status === 'active') startGame()
  })
}
</script>

<template>
  <div class="lobby">
    <AppHeader title="Match en ligne" @back="router.push({ name: 'online-settings' })" />

    <main class="lobby__main">
      <p v-if="loading" class="lobby__muted">Chargement…</p>

      <template v-else-if="match">
        <div class="lobby__card">
          <AppIcon name="globe" :width="40" :height="40" class="lobby__icon" />
          <h2 class="lobby__opponent">{{ isHost ? `Défi lancé à ${opponent}` : `${opponent} te défie !` }}</h2>
          <p class="lobby__muted">{{ summary }}</p>
          <p v-if="match.tournament_match_id" class="lobby__muted">Match de tournoi</p>

          <p v-if="CLOSED_MESSAGES[match.status]" class="lobby__status">{{ CLOSED_MESSAGES[match.status] }}</p>
          <p v-else-if="match.status === 'invited' && isHost" class="lobby__waiting">
            En attente de {{ opponent }}…
          </p>
        </div>

        <template v-if="match.status === 'invited'">
          <template v-if="isHost">
            <AppButton variant="secondary" :disabled="busy" @click="run(onlineMatchStore.cancel)">
              Annuler l'invitation
            </AppButton>
          </template>
          <template v-else>
            <AppButton :disabled="busy" @click="run(onlineMatchStore.accept)">Accepter</AppButton>
            <AppButton variant="secondary" :disabled="busy" @click="run(onlineMatchStore.decline)">Refuser</AppButton>
          </template>
        </template>
        <AppButton v-else-if="match.status === 'active'" @click="startGame">Reprendre le match</AppButton>
        <AppButton v-else variant="secondary" @click="router.push({ name: 'online-settings' })">Nouveau défi</AppButton>
      </template>

      <p v-else class="lobby__status">Match introuvable.</p>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.lobby {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  margin: 0 auto;
  padding: $padding-lg $padding-md 0;
  gap: $gap-md;
  @include nav-safe-bottom;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: $gap-md;
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xl;
    background: rgba($white, 0.05);
    border-radius: $radius-md;
    text-align: center;
  }

  &__icon     { color: $orange; }
  &__opponent { @include title-lg; color: $text-color; }
  &__muted    { @include text-sm; color: $muted; text-align: center; }
  &__status   { @include text-sm; color: $error; text-align: center; }

  &__waiting {
    @include text-sm;
    color: $accent;
    animation: lobby-pulse 1.6s ease-in-out infinite;
  }
}

@keyframes lobby-pulse {
  50% { opacity: 0.4; }
}

@media (min-width: $bp-laptop) {
  .lobby {
    padding: $padding-xxl $padding-xxl 0;
    @include nav-safe-bottom($padding-xl);

    &__opponent { @include title-xl; }
    &__muted,
    &__status,
    &__waiting  { @include text-md; }
  }
}
</style>
