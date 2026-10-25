<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTournamentStore } from '../store/tournamentStore.js'
import { useFriendStore } from '../store/friendStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useGameStore } from '../store/gameStore.js'
import { useOnlineMatchStore } from '../store/onlineMatchStore.js'
import { MIN_PARTICIPANTS_TO_START } from '../data/tournamentConstants.js'
import { isLeagueComplete, leagueMatches } from '../composables/useChampionship.js'
import AppHeader from '../components/AppHeader.vue'
import AppTabs from '../components/AppTabs.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
import AppModal from '../components/AppModal.vue'
import TournamentHero from '../components/tournament/TournamentHero.vue'
import TournamentRoster from '../components/tournament/TournamentRoster.vue'
import TournamentInfos from '../components/tournament/TournamentInfos.vue'
import TournamentBracketTree from '../components/tournament/TournamentBracketTree.vue'
import TournamentStandingsTable from '../components/tournament/TournamentStandingsTable.vue'
import TournamentMatchdayList from '../components/tournament/TournamentMatchdayList.vue'
import TournamentMatchStatsSheet from '../components/tournament/TournamentMatchStatsSheet.vue'
import TournamentPlayerStatsTable from '../components/tournament/TournamentPlayerStatsTable.vue'
import TournamentStartModal from '../components/tournament/TournamentStartModal.vue'
import TournamentHostPickerModal from '../components/tournament/TournamentHostPickerModal.vue'
import X01PlayerPicker from '../components/x01/X01PlayerPicker.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const props = defineProps({
  // Preview /dev uniquement : { tournament, hosts, participants, matches }
  mockTournament: { type: Object, default: null },
})

const route           = useRoute()
const router           = useRouter()
const tournamentStore  = useTournamentStore()
const friendStore      = useFriendStore()
const authStore        = useAuthStore()
const gameStore        = useGameStore()
const onlineMatchStore = useOnlineMatchStore()

const isMock = computed(() => props.mockTournament !== null)
const data   = computed(() => isMock.value ? props.mockTournament : tournamentStore.activeTournament)
const isHost = computed(() => isMock.value ? true : tournamentStore.isHost)

const isChampionship = computed(() => data.value?.tournament.format === 'championship')

const isPending = computed(() => data.value?.tournament.status === 'pending')

const tabs = computed(() => {
  const tail = [
    { id: 'stats',        label: 'Stats' },
    { id: 'participants', label: 'Joueurs' },
    { id: 'infos',        label: 'Infos' },
  ]
  if (!isChampionship.value) return [{ id: 'bracket', label: 'Bracket' }, ...tail]
  return [
    { id: 'standings', label: 'Classement' },
    { id: 'matchdays', label: 'Journées' },
    ...(data.value.tournament.playoff_size ? [{ id: 'bracket', label: 'Playoffs' }] : []),
    ...tail,
  ]
})
// ?tab=bracket / ?tab=matchdays au retour d'un match
const activeTab = ref(route.query.tab ?? null)
// Also watch the data: before it loads (or while pending) `tabs` can keep the same value
// across the start of the tournament, which would leave no tab selected
watch([tabs, data], ([list]) => {
  if (data.value && !list.some(t => t.id === activeTab.value)) activeTab.value = list[0].id
}, { immediate: true })

const formatLabel = computed(() => {
  const t = data.value?.tournament
  if (!t) return ''
  if (!isChampionship.value) return t.double_elimination ? 'Bracket · double élimination' : 'Bracket'
  const parts = ['Championnat']
  if (t.double_round_robin) parts.push('aller-retour')
  if (t.playoff_size) parts.push(t.playoff_size === 2 ? 'finale' : `playoffs top ${t.playoff_size}`)
  return parts.join(' · ')
})

const STATUS_LABELS = { pending: 'Inscriptions ouvertes', in_progress: 'En cours', completed: 'Terminé' }

const heroTags = computed(() => {
  const t = data.value?.tournament
  if (!t) return []
  if (!isChampionship.value) {
    return [t.double_elimination ? 'Double élimination' : 'Bracket', String(t.start_score), `${t.legs_to_win} manche${t.legs_to_win > 1 ? 's' : ''}`]
  }
  return [
    'Championnat',
    ...(t.double_round_robin ? ['Aller-retour'] : []),
    ...(t.playoff_size ? [t.playoff_size === 2 ? 'Finale' : `Playoffs top ${t.playoff_size}`] : []),
    String(t.start_score),
  ]
})

const heroProgress = computed(() => {
  const d = data.value
  if (!d) return null
  const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0)
  if (isPending.value) {
    const n = d.participants.length
    return { percent: Math.min(100, pct(n, MIN_PARTICIPANTS_TO_START)), label: `Joueurs inscrits · ${n} / ${MIN_PARTICIPANTS_TO_START} minimum` }
  }
  if (isChampionship.value) {
    const league = leagueMatches(d.matches)
    const rounds = Math.max(0, ...league.map(m => m.round))
    const openRound = Math.min(...league.filter(m => m.status !== 'completed').map(m => m.round))
    return {
      percent: pct(league.filter(m => m.status === 'completed').length, league.length),
      label:   `Journée ${Number.isFinite(openRound) ? openRound : rounds} / ${rounds}`,
    }
  }
  const real = d.matches.filter(m => m.status !== 'bye')
  const done = real.filter(m => m.status === 'completed').length
  return { percent: pct(done, real.length), label: `${done} / ${real.length} matchs` }
})

const hasPlayoffMatches = computed(() => data.value?.matches.some(m => m.bracket_type === 'winner') ?? false)
const canStartPlayoffs  = computed(() =>
  isHost.value && isChampionship.value && data.value.tournament.status === 'in_progress'
  && !!data.value.tournament.playoff_size && !hasPlayoffMatches.value && isLeagueComplete(data.value.matches)
)
const startingPlayoffs = ref(false)

async function onStartPlayoffs() {
  if (isMock.value || startingPlayoffs.value) return
  startingPlayoffs.value = true
  await tournamentStore.startPlayoffs(data.value.tournament.id)
  startingPlayoffs.value = false
  activeTab.value = 'bracket'
}

const showStartModal      = ref(false)
const showHostPicker      = ref(false)
const showAddPlayerPicker = ref(false)
const showDeleteConfirm   = ref(false)
const participantToRemove = ref(null)
const deleting            = ref(false)

onMounted(() => {
  if (!isMock.value) {
    tournamentStore.fetchTournamentDetail(route.params.id)
    tournamentStore.markTournamentSeen(route.params.id)
    tournamentStore.subscribeToTournamentDetail(route.params.id, {
      onDeleted: () => router.push({ name: 'tournaments' }),
    })
  }
})

onUnmounted(() => {
  if (!isMock.value) tournamentStore.unsubscribeFromTournamentDetail()
})

function openHostPicker() {
  if (!friendStore.friends.length) friendStore.fetchFriends()
  showHostPicker.value = true
}
function openAddPlayerPicker() {
  if (!friendStore.friends.length) friendStore.fetchFriends()
  showAddPlayerPicker.value = true
}

// Résout un nom affichable pour chaque hôte via le profil connecté ou, à défaut,
// via une ligne participant correspondante (le créateur est toujours les deux).
const resolvedHosts = computed(() => {
  const t = data.value
  if (!t) return []
  return t.hosts.map(h => {
    const asParticipant = t.participants.find(p => p.user_id === h.user_id)
    const isMe = h.user_id === authStore.user?.id
    return {
      user_id: h.user_id,
      role:    h.role,
      name:    isMe ? (authStore.profile?.username ?? 'Toi') : (asParticipant?.player_data?.name ?? 'Hôte'),
    }
  })
})

// Édition du nom (hôte uniquement) : sauvegarde au blur, resynchronisé
// depuis les données serveur tant que l'utilisateur n'a pas de saisie en cours.
const nameDraft = ref('')
watch(() => data.value?.tournament?.name, (name) => {
  if (name != null) nameDraft.value = name
}, { immediate: true })

async function saveNameIfChanged() {
  const trimmed = nameDraft.value.trim()
  const current = data.value?.tournament?.name ?? ''
  if (!trimmed || trimmed === current) {
    nameDraft.value = current
    return
  }
  if (isMock.value) return
  await tournamentStore.updateTournamentName(data.value.tournament.id, trimmed)
}

const hostUserIds = computed(() => resolvedHosts.value.map(h => h.user_id))
const canStart     = computed(() => (data.value?.participants.length ?? 0) >= MIN_PARTICIPANTS_TO_START)

const inviteLink = computed(() => {
  const t = data.value
  if (!t?.tournament.join_code) return ''
  const resolved = router.resolve({ name: 'tournament-join', params: { code: t.tournament.join_code } })
  return `${window.location.origin}${resolved.href}`
})
const copied = ref(false)
async function copyInviteLink() {
  if (!inviteLink.value) return
  await navigator.clipboard.writeText(inviteLink.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

const startDefaults = computed(() => {
  const t = data.value?.tournament
  return t ? { doubleElimination: !!t.double_elimination, doubleRoundRobin: !!t.double_round_robin, playoffSize: t.playoff_size ?? null } : {}
})

async function onStartConfirm({ seedingMethod, doubleElimination, doubleRoundRobin, playoffSize }) {
  showStartModal.value = false
  await tournamentStore.startTournament({
    tournamentId: data.value.tournament.id,
    seedingMethod,
    doubleElimination,
    doubleRoundRobin,
    playoffSize,
  })
  activeTab.value = isChampionship.value ? 'matchdays' : 'bracket'
}

function onAddHost(friend) {
  showHostPicker.value = false
  tournamentStore.addHost(data.value.tournament.id, friend.id)
}
function onRemoveHost(userId) {
  tournamentStore.removeHost(data.value.tournament.id, userId)
}
function askRemoveParticipant(participant) {
  participantToRemove.value = participant
}
function confirmRemoveParticipant() {
  if (participantToRemove.value) {
    tournamentStore.removeParticipant(data.value.tournament.id, participantToRemove.value.id)
  }
  participantToRemove.value = null
}

async function confirmDeleteTournament() {
  if (deleting.value) return
  deleting.value = true
  const ok = await tournamentStore.deleteTournament(data.value.tournament.id)
  deleting.value = false
  showDeleteConfirm.value = false
  if (ok) router.push({ name: 'tournaments' })
}
function onAddPlayers(newPlayers) {
  showAddPlayerPicker.value = false
  for (const p of newPlayers) {
    tournamentStore.addParticipant(data.value.tournament.id, p)
  }
}

const winnerName = computed(() => {
  const t = data.value
  if (!t?.tournament?.winner_participant_id) return null
  return t.participants.find(p => p.id === t.tournament.winner_participant_id)?.player_data?.name ?? null
})

// Lancement : l'hôte peut lancer n'importe quel match prêt, chaque joueur le sien.
// Un match en cours ne se rejoint que par ses deux joueurs (match en ligne ouvert).
function myMatchSlots(match) {
  const t     = data.value
  const slots = [match.player1_participant_id, match.player2_participant_id]
    .map(id => t.participants.find(p => p.id === id))
  const me       = slots.find(p => p?.user_id && p.user_id === authStore.user?.id)
  const opponent = slots.find(p => p && p !== me)
  return { me, opponent }
}

const playableMatchIds = computed(() => {
  const t = data.value
  if (!t) return []
  return t.matches
    .filter(m => {
      const { me } = myMatchSlots(m)
      if (m.status === 'ready')       return isHost.value || !!me
      if (m.status === 'in_progress') return !!me
      return false
    })
    .map(m => m.id)
})

const playChoice = ref(null) // { matchId, me, opponent } (participants)

function onPlay(matchId) {
  if (isMock.value || !playableMatchIds.value.includes(matchId)) return
  const open = onlineMatchStore.openMatches.find(m => m.tournament_match_id === matchId)
  if (open) {
    router.push({ name: 'online-match', params: { id: open.id } })
    return
  }
  const match = data.value.matches.find(m => m.id === matchId)
  if (match.status !== 'ready') return
  const { me, opponent } = myMatchSlots(match)
  if (me) playChoice.value = { matchId, me, opponent }
  else playLocal(matchId)
}

function playLocal(matchId) {
  playChoice.value = null
  const settings = tournamentStore.buildGameSettingsForMatch(matchId)
  if (!settings) return
  gameStore.gameSettings = settings
  router.push({ name: 'x01-game' })
}

// Onglet Stats : sessions X01 de tous les joueurs, rechargées à chaque match terminé
const playerSessions = ref([])
watch(
  () => [activeTab.value, data.value?.matches.filter(m => m.status === 'completed').length],
  async ([tab]) => {
    if (tab !== 'stats' || !data.value) return
    playerSessions.value = isMock.value
      ? (data.value.playerSessions ?? [])
      : await tournamentStore.fetchPlayerSessions(data.value.tournament.id)
  },
  { immediate: true },
)

// Stats d'un match terminé (feuille plein écran)
const statsMatch   = ref(null)
const matchStats   = ref(null)
const statsLoading = ref(false)

async function openMatchStats(matchId) {
  statsMatch.value = data.value.matches.find(m => m.id === matchId) ?? null
  matchStats.value = null
  if (isMock.value || !statsMatch.value) return
  statsLoading.value = true
  matchStats.value   = await tournamentStore.fetchMatchStats(matchId)
  statsLoading.value = false
}

async function playOnline() {
  const { matchId, me, opponent } = playChoice.value
  playChoice.value = null
  const t = data.value.tournament
  const match = await onlineMatchStore.invite({
    guest:      { id: opponent.user_id, name: opponent.player_data?.name ?? 'Joueur' },
    startScore: t.start_score,
    legsToWin:  t.legs_to_win,
    tournament: { tournamentId: t.id, matchId, myParticipantId: me.id, opponentParticipantId: opponent.id },
  })
  if (match) router.push({ name: 'online-match', params: { id: match.id } })
}
</script>

<template>
  <div class="tournament" v-if="data">
    <AppHeader :title="data.tournament.name" tone="tournament" @back="router.push({ name: 'tournaments' })" />

    <TournamentHero
      :name="data.tournament.name"
      :status="STATUS_LABELS[data.tournament.status]"
      :tags="heroTags"
      :progress="heroProgress"
    >
      <div v-if="isPending && data.tournament.join_code" class="tournament__invite">
        <div class="tournament__invite-text">
          <span class="tournament__invite-label">Code d'invitation</span>
          <span class="tournament__invite-code">{{ data.tournament.join_code }}</span>
        </div>
        <button class="tournament__invite-copy" @click="copyInviteLink">
          <AppIcon name="copy" :width="16" :height="16" />
          {{ copied ? 'Copié !' : 'Copier' }}
        </button>
      </div>
    </TournamentHero>

    <template v-if="isPending">
      <main class="tournament__main" :class="{ 'tournament__main--start': isHost }">
        <TournamentRoster
          :participants="data.participants"
          :hosts="resolvedHosts"
          :host-user-ids="hostUserIds"
          :my-user-id="authStore.user?.id ?? null"
          :can-manage="isHost"
          :is-host="isHost"
          :min-players="MIN_PARTICIPANTS_TO_START"
          @add-player="openAddPlayerPicker"
          @remove-player="askRemoveParticipant"
          @add-host="openHostPicker"
          @remove-host="onRemoveHost"
        />
        <button v-if="isHost" class="tournament__delete" @click="showDeleteConfirm = true">
          <AppIcon name="trash" :width="16" :height="16" />
          Supprimer le tournoi
        </button>
      </main>

      <div v-if="isHost" class="tournament__start">
        <span v-if="!canStart" class="tournament__start-hint">
          <AppIcon name="lock" :width="16" :height="16" />
          Encore {{ MIN_PARTICIPANTS_TO_START - data.participants.length }} joueur{{ MIN_PARTICIPANTS_TO_START - data.participants.length > 1 ? 's' : '' }} pour pouvoir démarrer
        </span>
        <AppButton tone="tournament" :disabled="!canStart" @click="showStartModal = true">
          Démarrer le tournoi
        </AppButton>
      </div>
    </template>

    <template v-else>
      <AppTabs v-model="activeTab" class="tournament__tabs" variant="underline" :tabs="tabs" scrollable />

      <main class="tournament__main">

        <!-- ── Classement (championnat) ───────────────────────────────────── -->
        <div v-if="activeTab === 'standings'" class="tournament__tab">
          <TournamentStandingsTable
            :matches="data.matches"
            :participants="data.participants"
            :playoff-size="data.tournament.playoff_size"
            :my-user-id="authStore.user?.id ?? null"
          />
          <AppButton v-if="canStartPlayoffs" tone="tournament" :disabled="startingPlayoffs" @click="onStartPlayoffs">
            Lancer les playoffs
          </AppButton>
        </div>

        <!-- ── Journées (championnat) ─────────────────────────────────────── -->
        <div v-if="activeTab === 'matchdays'" class="tournament__tab">
          <TournamentMatchdayList
            :matches="data.matches"
            :participants="data.participants"
            :playable-match-ids="playableMatchIds"
            @play="onPlay"
            @details="openMatchStats"
          />
        </div>

        <!-- ── Bracket / Playoffs ─────────────────────────────────────────── -->
        <div v-if="activeTab === 'bracket'" class="tournament__tab">
          <div v-if="isChampionship && !hasPlayoffMatches" class="tournament__locked">
            <AppIcon name="lock" :width="18" :height="18" />
            <div>
              <span class="tournament__locked-title">Playoffs à venir</span>
              <span class="tournament__locked-text">Ils démarrent une fois toutes les journées jouées.</span>
            </div>
          </div>
          <TournamentBracketTree
            v-else
            :matches="data.matches"
            :participants="data.participants"
            :playable-match-ids="playableMatchIds"
            @play="onPlay"
            @details="openMatchStats"
          />
          <AppButton v-if="canStartPlayoffs" tone="tournament" :disabled="startingPlayoffs" @click="onStartPlayoffs">
            Lancer les playoffs
          </AppButton>
        </div>

        <!-- ── Stats des joueurs ──────────────────────────────────────────── -->
        <div v-if="activeTab === 'stats'" class="tournament__tab">
          <p v-if="!playerSessions.length" class="tournament__empty">
            Aucun match joué pour l'instant.
          </p>
          <TournamentPlayerStatsTable
            v-else
            :sessions="playerSessions"
            :participants="data.participants"
            :my-user-id="authStore.user?.id ?? null"
          />
        </div>

        <!-- ── Joueurs ────────────────────────────────────────────────────── -->
        <div v-if="activeTab === 'participants'" class="tournament__tab">
          <TournamentRoster
            :participants="data.participants"
            :hosts="resolvedHosts"
            :host-user-ids="hostUserIds"
            :my-user-id="authStore.user?.id ?? null"
            :is-host="isHost"
            @add-host="openHostPicker"
            @remove-host="onRemoveHost"
          />
        </div>

        <!-- ── Infos ──────────────────────────────────────────────────────── -->
        <div v-if="activeTab === 'infos'" class="tournament__tab">
          <TournamentInfos
            v-model:name="nameDraft"
            :tournament="data.tournament"
            :format-label="formatLabel"
            :hosts="resolvedHosts"
            :is-host="isHost"
            :my-user-id="authStore.user?.id ?? null"
            :winner-name="winnerName"
            @save-name="saveNameIfChanged"
            @delete="showDeleteConfirm = true"
          />
        </div>

      </main>
    </template>

    <TournamentStartModal
      :show="showStartModal"
      :participant-count="data.participants.length"
      :format="data.tournament.format"
      :defaults="startDefaults"
      @close="showStartModal = false"
      @confirm="onStartConfirm"
    />
    <TournamentHostPickerModal
      :show="showHostPicker"
      :friends="friendStore.friends"
      :excluded-ids="hostUserIds"
      @close="showHostPicker = false"
      @select="onAddHost"
    />
    <X01PlayerPicker
      :show="showAddPlayerPicker"
      :friends="friendStore.friends"
      :selected-ids="data.participants.map(p => p.player_data?.id).filter(Boolean)"
      :allow-guests="false"
      @close="showAddPlayerPicker = false"
      @select="onAddPlayers"
    />
    <TournamentMatchStatsSheet
      :match="statsMatch"
      :participants="data.participants"
      :start-score="data.tournament.start_score"
      :match-stats="matchStats"
      :loading="statsLoading"
      :my-user-id="authStore.user?.id ?? null"
      @close="statsMatch = null"
    />
    <AppModal :show="!!playChoice" title="Jouer le match" @close="playChoice = null">
      <div class="tournament__play-choice">
        <AppButton v-if="playChoice?.opponent?.user_id" tone="tournament" @click="playOnline">
          En ligne contre {{ playChoice.opponent.player_data?.name }}
        </AppButton>
        <AppButton variant="secondary" @click="playLocal(playChoice.matchId)">
          Sur cet appareil
        </AppButton>
      </div>
    </AppModal>
    <ConfirmModal
      :show="!!participantToRemove"
      title="Retirer ce participant"
      :message="`${participantToRemove?.player_data?.name ?? 'Ce joueur'} sera retiré du tournoi.`"
      confirm-label="Retirer"
      @close="participantToRemove = null"
      @confirm="confirmRemoveParticipant"
    />
    <ConfirmModal
      :show="showDeleteConfirm"
      title="Supprimer le tournoi"
      message="Cette action est définitive : le tournoi, ses participants et ses matchs seront supprimés pour tout le monde. Les stats X01 des joueurs sont conservées."
      :confirm-label="deleting ? 'Suppression...' : 'Supprimer'"
      @close="showDeleteConfirm = false"
      @confirm="confirmDeleteTournament"
    />
  </div>
  <div v-else class="tournament__loading">Chargement du tournoi…</div>
</template>

<style lang="scss" scoped>
.tournament {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  @include nav-safe-bottom;

  &__tabs { --tab-color: #{$mode-tournament}; }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-md;

    // Room for the fixed start button
    &--start { padding-bottom: calc(#{$padding-xxl} * 3); }
  }

  &__tab {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__loading,
  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xl;
  }

  &__invite {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $white;
    color: $text-color;
  }

  &__invite-text {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__invite-label {
    @include text-xxs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    color: $muted;
  }

  &__invite-code {
    @include title-xxl;
    line-height: 0.9;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  &__invite-copy {
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    height: 44px;
    padding: 0 $padding-sm;
    border-radius: $radius-sm;
    background: $mode-tournament;
    color: $white;
    @include title-sm;
  }

  &__delete {
    align-self: center;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    @include text-sm;
    color: $error;
  }

  &__start {
    position: fixed;
    left: $padding-md;
    right: $padding-md;
    bottom: calc(#{$bottom-nav-height} + env(safe-area-inset-bottom) + #{$padding-sm});
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__start-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xxs;
    @include text-xs;
    color: $muted;
  }

  &__locked {
    display: flex;
    gap: $gap-sm;
    align-items: flex-start;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
    color: $muted;

    div { display: flex; flex-direction: column; gap: $gap-xxs; }
  }

  &__locked-title {
    @include title-md;
    line-height: 1;
    color: $text-color;
  }

  &__locked-text { @include text-sm; }

  &__play-choice {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }
}

@media (min-width: $bp-laptop) {
  .tournament {
    @include nav-safe-bottom($padding-xl);

    &__main { padding: $padding-xl $padding-xxl; }
    &__loading,
    &__empty,
    &__locked-text,
    &__delete { @include text-md; }
    &__invite-label { @include text-xs; }
    &__invite-code { @include display-xs; }
    &__invite-copy { @include title-md; }
    &__locked-title { @include title-lg; }
    &__start-hint { @include text-sm; }

    &__start {
      left: auto;
      right: $padding-xxl;
      width: 420px;
    }
  }
}
</style>
