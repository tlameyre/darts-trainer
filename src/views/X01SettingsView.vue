<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
import X01BotSettings from '../components/x01/X01BotSettings.vue'
import X01PlayerPicker from '../components/x01/X01PlayerPicker.vue'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useFriendStore } from '../store/friendStore.js'

const router      = useRouter()
const gameStore   = useGameStore()
const authStore   = useAuthStore()
const friendStore = useFriendStore()

const SCORE_OPTIONS = [301, 501]
const LEGS_OPTIONS  = [1, 2, 3, 5]
const MAX_PLAYERS   = 4

const settings = reactive({
  scoreKey:  501,
  legsToWin: 2,
})
const customScore    = ref(401)
const aiProfile      = ref(null)
const showPicker     = ref(false)
const extraPlayers   = ref([]) // friends + guests added by user

const isCustomScore  = computed(() => settings.scoreKey === 'custom')
const effectiveScore = computed(() =>
  isCustomScore.value ? Math.max(1, Number(customScore.value) || 501) : settings.scoreKey
)

// Player 0 is always the logged-in user
const mePlayer = computed(() => ({
  id:   'me',
  name: authStore.profile?.username ?? 'Toi',
  isMe: true,
}))

const allPlayers = computed(() => [mePlayer.value, ...extraPlayers.value])
const canAddMore = computed(() => allPlayers.value.length < MAX_PLAYERS)

const selectedFriendIds = computed(() =>
  extraPlayers.value.filter(p => p.isFriend).map(p => p.id)
)

function onPlayersSelected(newPlayers) {
  const remaining = MAX_PLAYERS - allPlayers.value.length
  extraPlayers.value.push(...newPlayers.slice(0, remaining))
  showPicker.value = false
}

function removePlayer(index) {
  // index is in extraPlayers (0 = first extra player)
  extraPlayers.value.splice(index, 1)
}

function openPicker() {
  if (!friendStore.friends.length) friendStore.fetchFriends()
  showPicker.value = true
}

function avatarLetter(player) {
  return player.name?.[0]?.toUpperCase() ?? '?'
}

function startGame() {
  gameStore.gameSettings = {
    mode:       'x01',
    startScore: effectiveScore.value,
    legsToWin:  settings.legsToWin,
    aiProfile:  aiProfile.value,
    players:    allPlayers.value,
  }
  router.push({ name: 'x01-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="501" @back="router.push({ name: 'play' })" />

    <main class="settings__main">

      <!-- Score de départ -->
      <div class="settings__card">
        <div class="settings__section-label">Score de départ</div>
        <div class="settings__row">
          <AppButton
            v-for="s in SCORE_OPTIONS" :key="s"
            size="small" variant="ghost" :active="settings.scoreKey === s"
            @click="settings.scoreKey = s"
          >{{ s }}</AppButton>
          <AppButton size="small" variant="ghost" :active="isCustomScore" @click="settings.scoreKey = 'custom'">
            Custom
          </AppButton>
        </div>
        <Transition name="slide-fade">
          <div v-if="isCustomScore" class="settings__custom-field">
            <input
              v-model.number="customScore"
              type="number" min="1" max="9999"
              class="settings__custom-input"
              placeholder="ex: 701"
            />
            <span class="settings__custom-label">pts</span>
          </div>
        </Transition>
      </div>

      <!-- Manches à gagner -->
      <div class="settings__card">
        <div class="settings__section-label">Manches à gagner</div>
        <div class="settings__row">
          <AppButton
            v-for="l in LEGS_OPTIONS" :key="l"
            size="small" variant="ghost" :active="settings.legsToWin === l"
            @click="settings.legsToWin = l"
          >{{ l }}</AppButton>
        </div>
        <p class="settings__hint">
          La partie se termine après {{ settings.legsToWin }} manche{{ settings.legsToWin > 1 ? 's' : '' }}.
        </p>
      </div>

      <!-- Joueurs -->
      <div class="settings__card">
        <div class="settings__section-label">Joueurs</div>

        <div class="settings__players">
          <!-- Joueur connecté (non supprimable) -->
          <div class="settings__player settings__player--me">
            <div class="settings__player-avatar">{{ avatarLetter(mePlayer) }}</div>
            <span class="settings__player-name">{{ mePlayer.name }}</span>
            <span class="settings__player-tag">Toi</span>
          </div>

          <!-- Joueurs supplémentaires -->
          <div
            v-for="(player, i) in extraPlayers"
            :key="player.id"
            class="settings__player"
          >
            <div class="settings__player-avatar" :class="{ 'settings__player-avatar--guest': player.isGuest }">
              {{ avatarLetter(player) }}
            </div>
            <span class="settings__player-name">{{ player.name }}</span>
            <span v-if="player.isFriend" class="settings__player-tag">Ami</span>
            <button class="settings__player-remove" @click="removePlayer(i)">
              <AppIcon name="close" :width="14" :height="14" />
            </button>
          </div>

          <!-- Bouton ajouter -->
          <button v-if="canAddMore" class="settings__add-player" @click="openPicker">
            + Ajouter un joueur
          </button>
          <p v-else class="settings__hint">Maximum {{ MAX_PLAYERS }} joueurs atteint.</p>
        </div>
      </div>

      <!-- Adversaire DartBot -->
      <div class="settings__card">
        <X01BotSettings v-model="aiProfile" />
      </div>

    </main>

    <AppButton @click="startGame">COMMENCER</AppButton>

    <!-- Picker amis/invités -->
    <X01PlayerPicker
      :show="showPicker"
      :friends="friendStore.friends"
      :selected-ids="selectedFriendIds"
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
  padding: $padding-md $padding-md calc($padding-xxl + 64px);
  gap: $gap-md;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-xxl;
    padding: $padding-md 0;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__section-label {
    @include title-lg;
    color: $white;
  }

  &__row {
    display: flex;
    gap: $gap-xs;

    :deep(.btn) { flex: 1; }
  }

  &__custom-field {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__custom-input {
    flex: 1;
    background: rgba($white, 0.05);
    border: $border-md solid rgba($white, 0.15);
    border-radius: $radius-sm;
    color: $text-color;
    @include title-md;
    padding: $padding-xs $padding-sm;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $orange;
    }
  }

  &__custom-label {
    @include title-md;
    color: $muted;
    white-space: nowrap;
  }

  &__hint {
    @include title-sm;
    color: $muted;
  }

  // ── Players section ──────────────────────────────────────────────────────
  &__players {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__player {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    border-radius: $radius-md;
    background: rgba($white, 0.05);

    &--me {
      background: rgba($orange, 0.12);
      border: $border-sm solid rgba($orange, 0.3);
    }
  }

  &__player-avatar {
    width: 32px;
    height: 32px;
    border-radius: $radius-pill;
    background: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xs;
    font-weight: 700;
    color: $white;
    flex-shrink: 0;

    &--guest {
      background: rgba($white, 0.15);
    }
  }

  &__player-name {
    flex: 1;
    @include text-sm;
    font-weight: 600;
    color: $text-color;
  }

  &__player-tag {
    @include text-xs;
    color: $muted;
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    padding: 2px 8px;
  }

  &__player-remove {
    color: $muted;
    display: flex;
    align-items: center;
    padding: $padding-xxs;

    &:active { opacity: 0.6; }
  }

  &__add-player {
    @include text-sm;
    color: $muted;
    padding: $padding-sm $padding-md;
    border-radius: $radius-md;
    border: $border-sm dashed rgba($white, 0.2);
    text-align: center;
    transition: border-color 0.15s, color 0.15s;

    &:active {
      border-color: $orange;
      color: $orange;
    }
  }
}

@media (min-width: $bp-laptop) {
  .settings {
    padding: $padding-xl $padding-xl calc($padding-xxl + 64px);
    gap: $gap-lg;

    &__main {
      gap: $gap-xxl;
      padding: $padding-lg 0;
    }

    &__section-label  { @include title-xl; }
    &__custom-input   { @include title-lg; padding: $padding-sm $padding-md; }
    &__custom-label   { @include title-lg; }
    &__hint           { @include title-md; }
    &__player-name    { @include text-md; }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
