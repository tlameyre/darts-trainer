<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import StartButton from '../components/StartButton.vue'
import TacticsPrinciple from '../components/tactics/TacticsPrinciple.vue'
import X01PlayerPicker from '../components/x01/X01PlayerPicker.vue'
import X01PlayerOrderList from '../components/x01/X01PlayerOrderList.vue'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useFriendStore } from '../store/friendStore.js'

const router      = useRouter()
const gameStore   = useGameStore()
const authStore   = useAuthStore()
const friendStore = useFriendStore()

const MIN_LEGS    = 1
const MAX_LEGS    = 9
const MAX_PLAYERS = 4

const settings = reactive({ legsToWin: 1 })
const showPicker = ref(false)

const players = ref([
  { id: 'me', name: authStore.profile?.username ?? 'Toi', isMe: true },
])

watch(() => authStore.profile, (profile) => {
  const me = players.value.find(p => p.isMe)
  if (me && profile?.username) me.name = profile.username
})

const canAddMore = computed(() => players.value.length < MAX_PLAYERS)

const legsHint = computed(() => `Fin après ${settings.legsToWin} manche${settings.legsToWin > 1 ? 's' : ''}`)

function decrementLegs() {
  settings.legsToWin = Math.max(MIN_LEGS, settings.legsToWin - 1)
}

function incrementLegs() {
  settings.legsToWin = Math.min(MAX_LEGS, settings.legsToWin + 1)
}

const selectedPlayerIds = computed(() => players.value.map(p => p.id))

function onPlayersSelected(newPlayers) {
  const remaining = MAX_PLAYERS - players.value.length
  players.value.push(...newPlayers.slice(0, remaining))
  showPicker.value = false
}

function removePlayer(index) {
  if (players.value[index]?.isMe) return
  players.value.splice(index, 1)
}

function openPicker() {
  if (!friendStore.friends.length) friendStore.fetchFriends()
  showPicker.value = true
}

function startGame() {
  gameStore.gameSettings = {
    mode:      'tactics',
    legsToWin: settings.legsToWin,
    players:   players.value,
  }
  const needsStarterDraw = players.value.length > 1
  router.push({ name: needsStarterDraw ? 'tactics-starter' : 'tactics-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="Tactics" tone="red" @back="router.push({ name: 'play' })" />

    <main class="settings__main">
      <TacticsPrinciple class="settings__principle" />

      <section class="settings__players">
        <div class="settings__head">
          <h2 class="settings__label">Joueurs</h2>
          <span class="settings__hint">Glisse pour changer l'ordre</span>
        </div>

        <X01PlayerOrderList v-model="players" removable @remove="removePlayer" />

        <button v-if="canAddMore" class="settings__add-btn" @click="openPicker">
          <AppIcon name="plus" :width="16" :height="16" />Ajouter un joueur
        </button>
        <p v-else class="settings__hint">Maximum {{ MAX_PLAYERS }} joueurs atteint.</p>
        <p v-if="players.length === 1" class="settings__hint">Laisse juste « Toi » pour jouer seul.</p>
      </section>

      <div class="settings__side">
        <section class="settings__section">
          <div class="settings__head">
            <h2 class="settings__label">Manches à gagner</h2>
            <span class="settings__hint">{{ legsHint }}</span>
          </div>
          <div class="settings__stepper">
            <button
              class="settings__step-btn"
              aria-label="Moins de manches"
              :disabled="settings.legsToWin <= MIN_LEGS"
              @click="decrementLegs"
            ><AppIcon name="minus" :width="24" :height="24" /></button>
            <span class="settings__step-value">{{ settings.legsToWin }}</span>
            <button
              class="settings__step-btn settings__step-btn--up"
              aria-label="Plus de manches"
              :disabled="settings.legsToWin >= MAX_LEGS"
              @click="incrementLegs"
            ><AppIcon name="plus" :width="24" :height="24" /></button>
          </div>
        </section>

        <StartButton class="settings__start" tone="red" @click="startGame" />
      </div>
    </main>

    <X01PlayerPicker
      :show="showPicker"
      :friends="friendStore.friends"
      :selected-ids="selectedPlayerIds"
      :max-additional="MAX_PLAYERS - players.length"
      @close="showPicker = false"
      @select="onPlayersSelected"
    />
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  @include safe-bottom($padding-md);

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-lg $padding-md 0;
  }

  &__players,
  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__players { --player-accent: #{$mode-tactics}; }

  &__side {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
  }

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__label {
    @include title-sm;
    color: $muted;
  }

  &__hint {
    @include text-xs;
    color: $muted;
  }

  &__add-btn {
    @include title-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    height: 44px;
    border: $border-md dashed $border-color;
    border-radius: $radius-sm;
    color: $text-color;

    &:active { border-color: $mode-tactics; }
  }

  &__stepper {
    display: grid;
    grid-template-columns: 56px 1fr 56px;
    gap: $gap-xs;
  }

  &__step-btn {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;

    &--up {
      border-color: $mode-tactics;
      background: $mode-tactics;
      color: $white;
    }

    &:disabled { opacity: 0.4; }
  }

  &__step-value {
    @include display-xs;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $surface;
    line-height: 1;
  }

  &__start {
    margin-top: auto;
  }
}

@media (min-width: $bp-laptop) {
  .settings {
    @include safe-bottom(0px);

    &__main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      padding: 0;
    }

    &__principle {
      grid-column: 1 / -1;
      margin: $padding-xxl $padding-xxl 0;
    }

    &__players,
    &__side {
      padding: $padding-xxl;
    }

    &__side {
      gap: $gap-xxl;
      border-left: $border-sm solid $border-color;
    }

    &__players { gap: $gap-sm; }
    &__label { @include title-md; }
    &__hint { @include text-sm; }
    &__add-btn { @include title-md; height: 56px; }
    &__stepper { grid-template-columns: 64px 1fr 64px; }
    &__step-btn { height: 64px; }
    &__step-value { @include display-sm; height: 64px; }
  }
}
</style>
