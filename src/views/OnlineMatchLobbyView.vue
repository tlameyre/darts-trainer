<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useGameStore } from '../store/gameStore.js'
import { useOnlineMatchStore, profileName } from '../store/onlineMatchStore.js'
import AppHeader from '../components/AppHeader.vue'
import OnlineVersusHero from '../components/online/OnlineVersusHero.vue'
import OnlineStepper from '../components/online/OnlineStepper.vue'
import OnlineStatusCard from '../components/online/OnlineStatusCard.vue'
import OnlineStarterTiles from '../components/online/OnlineStarterTiles.vue'

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
const opponent   = computed(() => match.value && profileName(isHost.value ? match.value.guest : match.value.host))
const opponentId = computed(() => match.value && (isHost.value ? match.value.guest_id : match.value.host_id))
const me = computed(() => {
  const profile = isHost.value ? match.value?.host : match.value?.guest
  return { id: myId.value, name: profileName(profile) }
})
const opponentPlayer = computed(() => ({ id: opponentId.value, name: opponent.value }))

const chips = computed(() => {
  if (!match.value) return []
  const { startScore, legsToWin } = match.value.settings
  const list = [String(startScore), `Premier à ${legsToWin} manche${legsToWin > 1 ? 's' : ''}`]
  if (match.value.tournament_match_id) list.push('Match de tournoi')
  return list
})

// L'ordre de players n'est définitif qu'une fois le match démarré
const starterLabel = computed(() => {
  const first = match.value?.status === 'active' && match.value.settings.players?.[0]
  if (!first) return ''
  return first.id === myId.value ? 'Tu commences' : `${first.name} commence`
})

const CLOSED_MESSAGES = {
  declined:  'Invitation refusée.',
  cancelled: 'Match annulé.',
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

function randomStarter() {
  return Math.random() < 0.5 ? myId.value : opponentId.value
}

async function run(action, ...args) {
  busy.value = true
  const updated = await action(match.value.id, ...args)
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

// What the status card, stepper and hero kicker say for each state of the match
const stage = computed(() => {
  const status = match.value?.status
  const name   = opponent.value
  const closed = CLOSED_MESSAGES[status]

  if (status === 'invited' && isHost.value) return {
    kicker: 'Défi envoyé', step: 1, tone: 'wait', title: `En attente de ${name}…`,
    text: 'Le défi est arrivé sur son appareil. La partie se lance dès qu\'il accepte.',
  }
  if (status === 'invited') return {
    kicker: `${name} te défie !`, step: 1, tone: 'ok', title: 'Nouveau défi',
    text: `Accepte pour lancer la partie. ${name} choisira ensuite qui commence.`,
  }
  if (status === 'accepted') return {
    kicker: 'Défi accepté', step: 2, tone: 'wait', title: `${name} choisit qui commence…`,
    text: 'Au bull ou au hasard. La partie démarre automatiquement après son choix.',
  }
  if (status === 'active') return {
    kicker: 'Match en cours', step: 3, tone: 'ok', title: 'Match en cours', text: starterLabel.value,
  }
  if (status === 'declined') return {
    kicker: 'Défi refusé', step: 1, tone: 'error',
    title: isHost.value ? `${name} a refusé l'invitation` : 'Invitation refusée',
    text: isHost.value ? 'Tu peux lui renvoyer un défi plus tard ou défier un autre ami.' : '',
  }
  return {
    kicker: status === 'completed' ? 'Match terminé' : 'Match fermé',
    step: status === 'completed' ? 4 : 1,
    tone: status === 'completed' ? 'ok' : 'error',
    title: closed ?? '', text: '',
  }
})
</script>

<template>
  <div class="lobby">
    <div class="lobby__aside">
      <AppHeader title="Match en ligne" tone="online" @back="router.push({ name: 'online-settings' })" />
      <OnlineVersusHero
        v-if="match"
        :kicker="stage.kicker"
        :me="me"
        :opponent="opponentPlayer"
        :chips="chips"
        :opponent-dimmed="match.status === 'declined'"
      />
    </div>

    <main class="lobby__main">
      <p v-if="loading" class="lobby__message">Chargement…</p>

      <template v-else-if="match">
        <OnlineStepper :step="stage.step" :error="stage.tone === 'error'" />

        <section v-if="match.status === 'accepted' && isHost" class="lobby__starter">
          <div class="lobby__starter-head">
            <h2 class="lobby__starter-title">Qui commence ?</h2>
            <span class="lobby__starter-hint">{{ opponent }} a accepté</span>
          </div>
          <p class="lobby__starter-text">
            Faites le bull chacun de votre côté, puis indique qui l'a gagné. Ou laisse le hasard décider.
          </p>
          <OnlineStarterTiles
            :me="me"
            :opponent="opponentPlayer"
            :disabled="busy"
            @choose="run(onlineMatchStore.chooseStarter, $event === 'random' ? randomStarter() : $event)"
          />
        </section>
        <OnlineStatusCard v-else :tone="stage.tone" :title="stage.title">{{ stage.text }}</OnlineStatusCard>

        <div class="lobby__actions">
          <template v-if="match.status === 'invited' && !isHost">
            <button class="lobby__btn" :disabled="busy" @click="run(onlineMatchStore.decline)">Refuser</button>
            <button class="lobby__btn lobby__btn--primary" :disabled="busy" @click="run(onlineMatchStore.accept)">Accepter</button>
          </template>
          <button
            v-else-if="match.status === 'invited'"
            class="lobby__btn" :disabled="busy" @click="run(onlineMatchStore.cancel)"
          >Annuler l'invitation</button>
          <button
            v-else-if="match.status === 'accepted'"
            class="lobby__btn" :disabled="busy" @click="run(onlineMatchStore.cancel, 'accepted')"
          >Annuler le match</button>
          <button v-else-if="match.status === 'active'" class="lobby__btn lobby__btn--primary" @click="startGame">
            Reprendre le match
          </button>
          <template v-else>
            <button class="lobby__btn" @click="router.push({ name: 'play' })">Retour</button>
            <button class="lobby__btn lobby__btn--primary" @click="router.push({ name: 'online-settings' })">Nouveau défi</button>
          </template>
        </div>
      </template>

      <p v-else class="lobby__message lobby__message--error">Match introuvable.</p>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.lobby {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__aside {
    display: flex;
    flex-direction: column;
    background: $mode-online;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding: $padding-md;
    @include safe-bottom($padding-xl);
  }

  &__message {
    @include text-sm;
    color: $muted;
    text-align: center;

    &--error { color: $error; }
  }

  &__starter {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__starter-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-bottom: 6px;
    border-bottom: $border-lg solid $black;
  }

  &__starter-title {
    @include title-lg;
    color: $text-color;
  }

  &__starter-hint {
    @include text-xs;
    color: $accent;
  }

  &__starter-text {
    @include text-sm;
    color: $muted;
  }

  &__actions {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: $gap-xs;
    margin-top: auto;
  }

  &__btn {
    @include title-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 56px;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    color: $text-color;

    &--primary {
      border-color: $mode-online;
      background: $mode-online;
      color: $white;
    }

    &:active:not(:disabled) { opacity: 0.8; }
    &:disabled { opacity: 0.4; }
  }
}

@media (min-width: $bp-laptop) {
  .lobby {
    display: grid;
    grid-template-columns: 520px minmax(0, 1fr);

    &__aside {
      padding: $padding-xxl $padding-xxl $padding-xxl;
      gap: $gap-xl;

      :deep(.app-header) { padding: 0; grid-template-columns: 48px 1fr; }
      :deep(.app-header__title) { text-align: left; }
    }

    &__main {
      gap: $gap-xl;
      padding: 48px;
      @include safe-bottom($padding-xxl);
    }

    &__message,
    &__starter-text { @include text-md; }
    &__starter-title { @include title-xxl; }
    &__starter-hint  { @include text-sm; }

    &__actions {
      grid-auto-flow: row;
      grid-template-columns: repeat(auto-fit, 280px);
      justify-content: end;
    }

    &__btn { @include title-xl; height: 64px; }
  }
}
</style>
