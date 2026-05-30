<script setup>
/**
 * Playground de développement — accessible uniquement via /dev en mode dev.
 * Permet d'afficher chaque composant conditionnel (overlays, modals, écrans)
 * avec des données factices, sans remplir les conditions réelles.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BADGES } from '../data/badges.js'

import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'
import BadgeDetailModal from '../components/badges/BadgeDetailModal.vue'
import GameOver from '../components/GameOver.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'
import ChangeEmailModal from '../components/profile/ChangeEmailModal.vue'
import ChangePasswordModal from '../components/profile/ChangePasswordModal.vue'

const router = useRouter()

// --- Overlays / modals ---
const unlockBadges      = ref([])
const showBadgeDetail   = ref(false)
const badgeDetail       = ref(null)
const badgeProgress     = ref(null)
const showGameOver      = ref(false)
const showGameMenu      = ref(false)
const showEmailModal    = ref(false)
const showPasswordModal = ref(false)

// Mock data
const mockBadge = { ...BADGES[0], unlockedAt: new Date().toISOString() }
const mockLockedBadge = BADGES.find(b => b.id === 'darts_1000') ?? BADGES[6]
const mockProgress = { current: 430, target: 1000, suffix: '' }

function showUnlockOne() {
  unlockBadges.value = [BADGES[0]]
}
function showUnlockMany() {
  unlockBadges.value = BADGES.slice(0, 3)
}
function openBadgeUnlocked() {
  badgeDetail.value   = mockBadge
  badgeProgress.value = null
  showBadgeDetail.value = true
}
function openBadgeLocked() {
  badgeDetail.value   = { ...mockLockedBadge, unlockedAt: null }
  badgeProgress.value = mockProgress
  showBadgeDetail.value = true
}

// --- Vues plein écran ---
const views = [
  { name: 'home',           label: 'Home' },
  { name: 'play',           label: 'Lobby (Jouer)' },
  { name: 'stats',          label: 'Stats' },
  { name: 'profile',        label: 'Profil' },
  { name: 'profile-edit',   label: 'Édition profil' },
  { name: 'badges',         label: 'Badges' },
  { name: 'score-settings', label: 'Réglages Score' },
  { name: 'warmup-settings',label: 'Réglages Warmup' },
  { name: 'login',          label: 'Login' },
  { name: 'register',       label: 'Register' },
]
</script>

<template>
  <div class="dev">
    <h1 class="dev__title">🛠 Dev Playground</h1>

    <!-- Overlays / Modals -->
    <section class="dev__section">
      <h2 class="dev__section-title">Overlays & Modals</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showUnlockOne">Badge débloqué (1)</button>
        <button class="dev__btn" @click="showUnlockMany">Badges débloqués (3)</button>
        <button class="dev__btn" @click="openBadgeUnlocked">Détail badge (débloqué)</button>
        <button class="dev__btn" @click="openBadgeLocked">Détail badge (verrouillé + progression)</button>
        <button class="dev__btn" @click="showGameOver = true">Game Over</button>
        <button class="dev__btn" @click="showGameMenu = true">Menu de partie</button>
        <button class="dev__btn" @click="showEmailModal = true">Changer email</button>
        <button class="dev__btn" @click="showPasswordModal = true">Changer mot de passe</button>
      </div>
    </section>

    <!-- Vues -->
    <section class="dev__section">
      <h2 class="dev__section-title">Vues</h2>
      <div class="dev__buttons">
        <button
          v-for="v in views"
          :key="v.name"
          class="dev__btn"
          @click="router.push({ name: v.name })"
        >
          {{ v.label }}
        </button>
      </div>
    </section>

    <!-- Game Over en aperçu (a besoin d'un conteneur) -->
    <div v-if="showGameOver" class="dev__gameover-preview">
      <GameOver :correct-count="14" :max-questions="20" :best="9"
        @replay="showGameOver = false" @home="showGameOver = false" />
    </div>

    <!-- Composants montés -->
    <BadgeUnlockOverlay :badges="unlockBadges" @done="unlockBadges = []" />
    <BadgeDetailModal :show="showBadgeDetail" :badge="badgeDetail" :progress="badgeProgress"
      @close="showBadgeDetail = false" />
    <GameMenuModal :show="showGameMenu" @close="showGameMenu = false"
      @finish="showGameMenu = false" @quit="showGameMenu = false" />
    <ChangeEmailModal :show="showEmailModal" current-email="test@exemple.com"
      @close="showEmailModal = false" @save="showEmailModal = false" />
    <ChangePasswordModal :show="showPasswordModal"
      @close="showPasswordModal = false" @save="showPasswordModal = false" />
  </div>
</template>

<style lang="scss" scoped>
.dev {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-lg $padding-md calc($padding-xxl + 64px);
  gap: $gap-xl;

  &__title {
    @include title-xl;
    color: $text-color;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: $gap-xs;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__buttons {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__btn {
    background: rgba(255, 255, 255, 0.06);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
    color: $text-color;
    @include text-sm;
    text-align: left;
    transition: background 0.15s;

    &:active { background: rgba(255, 255, 255, 0.12); }
  }

  &__gameover-preview {
    position: fixed;
    inset: 0;
    background: $bg;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    z-index: 90;
  }
}
</style>
