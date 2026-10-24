<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import OptionSelector from '../components/OptionSelector.vue'
import OptionTile from '../components/OptionTile.vue'
import StartButton from '../components/StartButton.vue'
import X01BotConfigModal from '../components/x01/X01BotConfigModal.vue'
import X01PlayerPicker from '../components/x01/X01PlayerPicker.vue'
import X01PlayerOrderList from '../components/x01/X01PlayerOrderList.vue'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useFriendStore } from '../store/friendStore.js'

const router      = useRouter()
const gameStore   = useGameStore()
const authStore   = useAuthStore()
const friendStore = useFriendStore()

const SCORE_OPTIONS = [101, 170, 301, 501].map(value => ({ value, label: String(value) }))
  .concat({ value: 'custom', label: 'Perso' })
const MIN_LEGS      = 1
const MAX_LEGS      = 9
const MAX_PLAYERS   = 4

const settings = reactive({
  scoreKey:  301,
  legsToWin: 2,
  checkoutAnalysis: false,
})
const customScore = ref(401)
const aiProfile     = ref(null)
const showPicker    = ref(false)
const showBotConfig = ref(false)

// Ordre libre : "moi" (déplaçable comme les autres) + amis/invités ajoutés
const players = ref([
  { id: 'me', name: authStore.profile?.username ?? 'Toi', isMe: true },
])

// Le profil peut se charger après le montage de la vue
watch(() => authStore.profile, (profile) => {
  const me = players.value.find(p => p.isMe)
  if (me && profile?.username) me.name = profile.username
})

const isCustomScore  = computed(() => settings.scoreKey === 'custom')
const effectiveScore = computed(() =>
  isCustomScore.value ? Math.max(1, Number(customScore.value) || 501) : settings.scoreKey
)

const canAddMore = computed(() => players.value.length < MAX_PLAYERS)
const canAddBot  = computed(() => !aiProfile.value && players.value.length === 1)

const legsHint = computed(() => {
  const legs = `${settings.legsToWin} manche${settings.legsToWin > 1 ? 's' : ''}`
  return players.value.length > 1 || aiProfile.value ? `Premier à ${legs}` : `Partie en ${legs}`
})

// Checkout analysis tile preview: the targets announced on a 81 finish
const SAMPLE_AIMS = ['T15', 'D18', '—']

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
    mode:       'x01',
    startScore: effectiveScore.value,
    legsToWin:  settings.legsToWin,
    aiProfile:  aiProfile.value,
    players:    players.value,
    checkoutAnalysis: settings.checkoutAnalysis,
  }
  const needsStarterDraw = players.value.length > 1 && !aiProfile.value
  router.push({ name: needsStarterDraw ? 'x01-starter' : 'x01-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="501" tone="green" @back="router.push({ name: 'play' })" />

    <main class="settings__main">
      <section class="settings__players">
        <div class="settings__head">
          <h2 class="settings__label">Joueurs</h2>
          <span class="settings__hint">Glisse pour changer l'ordre</span>
        </div>

        <X01PlayerOrderList
          v-model="players"
          removable
          :bot="aiProfile"
          @remove="removePlayer"
          @edit-bot="showBotConfig = true"
          @remove-bot="aiProfile = null"
        />

        <div v-if="canAddMore && !aiProfile" class="settings__add">
          <button class="settings__add-btn" @click="openPicker">
            <AppIcon name="plus" :width="16" :height="16" />Joueur
          </button>
          <button v-if="canAddBot" class="settings__add-btn" @click="showBotConfig = true">
            <AppIcon name="plus" :width="16" :height="16" />DartBot
          </button>
        </div>
        <p v-else-if="!aiProfile" class="settings__hint">Maximum {{ MAX_PLAYERS }} joueurs atteint.</p>
      </section>

      <div class="settings__side">
        <section class="settings__section">
          <OptionSelector v-model="settings.scoreKey" label="Score de départ" :options="SCORE_OPTIONS" tone="green" />
          <Transition name="slide-fade">
            <label v-if="isCustomScore" class="settings__custom">
              <input
                v-model.number="customScore"
                type="number" min="1" max="9999"
                class="settings__custom-input"
                placeholder="ex : 701"
              />
              <span class="settings__custom-unit">pts</span>
            </label>
          </Transition>
        </section>

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

        <section class="settings__section">
          <h2 class="settings__label">Options</h2>
          <OptionTile
            v-model="settings.checkoutAnalysis"
            tone="green"
            title="Analyse des checkouts"
            description="Sous 170, indique ta cible avant chaque fléchette : revue de tes placements en fin de partie"
          >
            <template #preview>
              <div class="settings__aims">
                <span class="settings__preview-caption">Ex. · Reste 81</span>
                <span v-for="(aim, i) in SAMPLE_AIMS" :key="i" class="settings__aim">
                  <span class="settings__aim-caption">Visé</span>
                  {{ aim }}
                </span>
              </div>
            </template>
          </OptionTile>
        </section>

        <StartButton class="settings__start" tone="green" @click="startGame" />
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

    <X01BotConfigModal
      :show="showBotConfig"
      :model-value="aiProfile"
      @close="showBotConfig = false"
      @confirm="aiProfile = $event"
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

  &__add {
    display: flex;
    gap: $gap-xs;
  }

  &__add-btn {
    @include title-sm;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    height: 44px;
    border: $border-md dashed $border-color;
    border-radius: $radius-sm;
    color: $text-color;

    &:active { border-color: $accent; }
  }

  &__custom {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__custom-input {
    @include title-lg;
    flex: 1;
    min-width: 0;
    height: 44px;
    padding: 0 $padding-sm;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $white;
    color: $text-color;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $accent;
    }
  }

  &__custom-unit {
    @include title-md;
    color: $muted;
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
      border-color: $accent;
      background: $accent;
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

  // Preview content — colors follow the tile's on/off state through currentColor
  &__aims {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__preview-caption {
    @include text-xxs;
    flex: 1;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    opacity: 0.8;
  }

  &__aim {
    @include title-md;
    min-width: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $padding-xxs 0;
    border-radius: $radius-sm;
    background: $bg;
    line-height: 1;
  }

  &__aim-caption {
    @include text-xxs;
    opacity: 0.75;
    text-transform: uppercase;
  }

  &__start {
    margin-top: auto;
  }
}

.option-tile--on .settings__aim {
  background: rgba($white, 0.16);
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
    &__custom-input { @include title-xl; height: 56px; }
    &__custom-unit { @include title-lg; }
    &__stepper { grid-template-columns: 64px 1fr 64px; }
    &__step-btn { height: 64px; }
    &__step-value { @include display-sm; height: 64px; }
    &__preview-caption { @include text-xs; }
    &__aim { @include title-xl; min-width: 56px; }
    &__aim-caption { @include text-xs; }
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
