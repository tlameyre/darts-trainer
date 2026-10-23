<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTournamentStore } from '../store/tournamentStore.js'
import { useFriendStore } from '../store/friendStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useGameStore } from '../store/gameStore.js'
import { useOnlineMatchStore } from '../store/onlineMatchStore.js'
import { MIN_PARTICIPANTS_TO_START } from '../data/tournamentConstants.js'
import { isLeagueComplete } from '../composables/useChampionship.js'
import AppHeader from '../components/AppHeader.vue'
import AppTabs from '../components/AppTabs.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
import AppModal from '../components/AppModal.vue'
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

const tabs = computed(() => {
  const base = [
    { id: 'infos',        label: 'Infos' },
    { id: 'participants', label: 'Participants' },
  ]
  const stats = { id: 'stats', label: 'Stats' }
  if (!isChampionship.value) return [...base, { id: 'bracket', label: 'Bracket' }, stats]
  return [
    ...base,
    { id: 'standings', label: 'Classement' },
    stats,
    { id: 'matchdays', label: 'Journées' },
    ...(data.value.tournament.playoff_size ? [{ id: 'bracket', label: 'Playoffs' }] : []),
  ]
})
// ?tab=bracket / ?tab=matchdays au retour d'un match
const activeTab = ref(route.query.tab ?? 'infos')
watch(tabs, (list) => {
  if (data.value && !list.some(t => t.id === activeTab.value)) activeTab.value = 'infos'
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
  <div class="tournament" :class="{ 'tournament--fill': activeTab === 'participants' }" v-if="data">
    <AppHeader :title="data.tournament.name" @back="router.push({ name: 'tournaments' })" />

    <AppTabs v-model="activeTab" :tabs="tabs" scrollable />

    <main class="tournament__main">

      <!-- ── Infos ────────────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'infos'" class="tournament__tab">
        <div v-if="winnerName" class="tournament__winner">
          <div class="tournament__winner-trophy">🏆</div>
          <div class="tournament__winner-name">{{ winnerName }}</div>
          <div class="tournament__winner-sub">remporte le tournoi !</div>
        </div>

        <p v-if="data.tournament.description" class="tournament__description">{{ data.tournament.description }}</p>

        <div class="tournament__info-row">
          <span class="tournament__info-label">Nom</span>
          <input
            v-if="isHost"
            v-model="nameDraft"
            class="tournament__info-input"
            maxlength="60"
            @blur="saveNameIfChanged"
            @keydown.enter="$event.target.blur()"
          />
          <span v-else class="tournament__info-value">{{ data.tournament.name }}</span>
        </div>
        <div class="tournament__info-row">
          <span class="tournament__info-label">Format</span>
          <span class="tournament__info-value">{{ formatLabel }}</span>
        </div>
        <div class="tournament__info-row">
          <span class="tournament__info-label">Format de match</span>
          <span class="tournament__info-value">{{ data.tournament.start_score }} · {{ data.tournament.legs_to_win }} manche(s)</span>
        </div>
        <div class="tournament__info-row">
          <span class="tournament__info-label">Hôtes</span>
          <span class="tournament__info-value">{{ resolvedHosts.map(h => h.name).join(', ') }}</span>
        </div>

        <template v-if="data.tournament.status === 'pending'">
          <p v-if="!canStart" class="tournament__banner">
            Minimum {{ MIN_PARTICIPANTS_TO_START }} participants pour démarrer ({{ data.participants.length }}/{{ MIN_PARTICIPANTS_TO_START }}).
          </p>

          <div class="tournament__invite">
            <span class="tournament__invite-label">Code d'invitation</span>
            <button class="tournament__invite-code" @click="copyInviteLink">
              {{ data.tournament.join_code }}
              <AppIcon name="copy" :width="14" :height="14" />
            </button>
            <span v-if="copied" class="tournament__invite-copied">Lien copié !</span>
          </div>

          <AppButton v-if="isHost" :disabled="!canStart" @click="showStartModal = true">
            Démarrer le tournoi
          </AppButton>
        </template>

        <AppButton v-if="canStartPlayoffs" :disabled="startingPlayoffs" @click="onStartPlayoffs">
          Lancer les playoffs
        </AppButton>

        <button v-if="isHost" class="tournament__delete-action" @click="showDeleteConfirm = true">
          <AppIcon name="trash" :width="16" :height="16" />
          Supprimer le tournoi
        </button>
      </div>

      <!-- ── Participants ─────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'participants'" class="tournament__tab tournament__tab--fill">
        <div class="tournament__section">
          <div class="tournament__section-header">
            <span class="tournament__section-title">Hôtes ({{ resolvedHosts.length }})</span>
            <button v-if="isHost" class="tournament__section-action" @click="openHostPicker">+ Ajouter un hôte</button>
          </div>
          <div class="tournament__list">
            <div v-for="h in resolvedHosts" :key="h.user_id" class="tournament__row">
              <div class="tournament__avatar">{{ h.name?.[0]?.toUpperCase() }}</div>
              <span class="tournament__row-name">{{ h.name }}</span>
              <span v-if="h.role === 'creator'" class="tournament__row-tag">Créateur</span>
              <button
                v-if="isHost && h.role !== 'creator' && h.user_id !== authStore.user?.id"
                class="tournament__row-manage"
                @click="onRemoveHost(h.user_id)"
              >Retirer</button>
            </div>
          </div>
        </div>

        <div class="tournament__section tournament__section--fill">
          <div class="tournament__section-header">
            <span class="tournament__section-title">Participants ({{ data.participants.length }})</span>
            <button v-if="isHost && data.tournament.status === 'pending'" class="tournament__section-action" @click="openAddPlayerPicker">+ Ajouter</button>
          </div>
          <div class="tournament__list tournament__list--scroll">
            <div v-for="p in data.participants" :key="p.id" class="tournament__row">
              <div class="tournament__avatar">{{ p.player_data?.name?.[0]?.toUpperCase() }}</div>
              <span class="tournament__row-name">{{ p.player_data?.name }}</span>
              <button
                v-if="isHost && data.tournament.status === 'pending' && !hostUserIds.includes(p.user_id)"
                class="tournament__row-manage"
                @click="askRemoveParticipant(p)"
              >Retirer</button>
            </div>
          </div>
        </div>

        <template v-if="isHost && data.tournament.status === 'pending'">
          <p v-if="!canStart" class="tournament__banner">
            Minimum {{ MIN_PARTICIPANTS_TO_START }} participants pour démarrer ({{ data.participants.length }}/{{ MIN_PARTICIPANTS_TO_START }}).
          </p>
          <AppButton :disabled="!canStart" @click="showStartModal = true">
            Démarrer le tournoi
          </AppButton>
        </template>
      </div>

      <!-- ── Classement (championnat) ───────────────────────────────────────── -->
      <div v-if="activeTab === 'standings'" class="tournament__tab">
        <p v-if="data.tournament.status === 'pending'" class="tournament__empty">
          Le tournoi n'a pas encore démarré.
        </p>
        <template v-else>
          <TournamentStandingsTable
            :matches="data.matches"
            :participants="data.participants"
            :playoff-size="data.tournament.playoff_size"
            :my-user-id="authStore.user?.id ?? null"
          />
          <AppButton v-if="canStartPlayoffs" :disabled="startingPlayoffs" @click="onStartPlayoffs">
            Lancer les playoffs
          </AppButton>
        </template>
      </div>

      <!-- ── Stats des joueurs ───────────────────────────────────────────── -->
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

      <!-- ── Journées (championnat) ──────────────────────────────────────── -->
      <div v-if="activeTab === 'matchdays'" class="tournament__tab">
        <p v-if="data.tournament.status === 'pending'" class="tournament__empty">
          Le tournoi n'a pas encore démarré.
        </p>
        <TournamentMatchdayList
          v-else
          :matches="data.matches"
          :participants="data.participants"
          :playable-match-ids="playableMatchIds"
          @play="onPlay"
          @details="openMatchStats"
        />
      </div>

      <!-- ── Bracket / Playoffs ─────────────────────────────────────────────── -->
      <div v-if="activeTab === 'bracket'" class="tournament__tab">
        <p v-if="data.tournament.status === 'pending'" class="tournament__empty">
          Le tournoi n'a pas encore démarré.
        </p>
        <p v-else-if="isChampionship && !hasPlayoffMatches" class="tournament__empty">
          Les playoffs démarrent une fois toutes les journées jouées.
        </p>
        <TournamentBracketTree
          v-else
          :matches="data.matches"
          :participants="data.participants"
          :playable-match-ids="playableMatchIds"
          @play="onPlay"
          @details="openMatchStats"
        />
      </div>

    </main>

    <TournamentStartModal
      :show="showStartModal"
      :participant-count="data.participants.length"
      :format="data.tournament.format"
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
        <AppButton v-if="playChoice?.opponent?.user_id" @click="playOnline">
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
  padding: $padding-md $padding-md 0;
  gap: $gap-md;
  @include nav-safe-bottom;

  &__play-choice {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  // Onglet Participants : la vue tient dans l'écran, la liste prend la place
  // restante et défile en interne
  &--fill {
    height: 100dvh;
  }

  &__main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: $padding-md 0;
  }

  &__tab {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;

    &--fill {
      flex: 1;
      min-height: 0;
    }
  }

  &__winner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-lg;
    background: rgba($orange, 0.1);
    border: $border-sm solid rgba($orange, 0.3);
    border-radius: $radius-sm;
  }

  &__winner-trophy { font-size: 40px; line-height: 1; }
  &__winner-name   { @include title-lg; font-weight: 700; color: $orange; }
  &__winner-sub    { @include text-sm; color: $muted; }

  &__description {
    @include text-sm;
    color: $muted;
  }

  &__info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $padding-sm 0;
    border-bottom: $border-sm solid rgba($white, 0.08);
  }

  &__info-label { @include text-sm; color: $muted; }
  &__info-value { @include text-sm; color: $text-color; font-weight: 600; }

  &__info-input {
    @include text-sm;
    flex: 1;
    min-width: 0;
    margin-left: $gap-md;
    color: $text-color;
    font-weight: 600;
    font-family: inherit;
    text-align: right;
    background: transparent;
    border: none;
    border-bottom: $border-sm solid transparent;
    padding: 2px 0;

    &:focus {
      outline: none;
      border-bottom-color: $orange;
    }
  }

  &__banner {
    @include text-sm;
    color: $orange;
    background: rgba($orange, 0.1);
    border-radius: $radius-sm;
    padding: $padding-sm $padding-md;
  }

  &__invite {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__invite-label {
    @include text-sm;
    color: $muted;
  }

  &__invite-code {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    @include title-md;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: $text-color;
    background: rgba($white, 0.05);
    border: $border-sm dashed rgba($white, 0.2);
    border-radius: $radius-sm;
    padding: $padding-md;
  }

  &__invite-copied {
    @include text-xs;
    color: $orange;
    text-align: center;
  }

  &__delete-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    @include text-sm;
    color: $error;
    padding: $padding-sm 0;

    &:active { opacity: 0.7; }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;

    &--fill {
      flex: 1;
      min-height: 0;
    }
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__section-action {
    @include text-sm;
    color: $orange;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;

    &--scroll {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    border-radius: $radius-sm;
    background: rgba($white, 0.05);
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: $radius-pill;
    background: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-sm;
    font-weight: 700;
    color: $white;
    flex-shrink: 0;
  }

  &__row-name {
    flex: 1;
    @include text-sm;
    font-weight: 600;
    color: $text-color;
  }

  &__row-tag {
    @include text-xs;
    color: $muted;
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    padding: 2px 8px;
  }

  &__row-manage {
    @include text-xs;
    color: $error;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xl 0;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    @include text-md;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .tournament {
    padding: $padding-xl $padding-xl 0;
    gap: $gap-lg;
    @include nav-safe-bottom($padding-xl);

    &__main { padding: $padding-lg 0; }
    &__winner-name { @include title-xl; }
    &__winner-sub  { @include text-md; }
    &__description { @include text-md; }
  }
}
</style>
