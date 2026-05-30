<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { user, profile, signOut, updateProfile } from '../store/authStore.js'
import { fetchGlobalStats, fetchGameSessions, fetchWarmupSessions } from '../store/dbStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'

const router = useRouter()

const stats          = ref(null)
const gameSessions   = ref([])
const warmupSessions = ref([])
const editingName    = ref(false)
const newUsername    = ref('')
const saveLoading    = ref(false)

onMounted(async () => {
  newUsername.value = profile.value?.username ?? ''
  const [s, gs, ws] = await Promise.all([
    fetchGlobalStats(),
    fetchGameSessions(10),
    fetchWarmupSessions(10),
  ])
  stats.value          = s
  gameSessions.value   = gs
  warmupSessions.value = ws
})

async function onSaveUsername() {
  saveLoading.value = true
  try {
    await updateProfile({ username: newUsername.value })
    editingName.value = false
  } finally {
    saveLoading.value = false
  }
}

async function onSignOut() {
  await signOut()
  router.replace({ name: 'login' })
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="profile">
    <AppHeader title="PROFIL" @back="router.push({ name: 'lobby' })" />

    <main class="profile__main">

      <!-- Identité -->
      <section class="profile__card">
        <div v-if="!editingName" class="profile__identity">
          <div>
            <p class="profile__username">{{ profile?.username ?? 'Joueur' }}</p>
            <p class="profile__email">{{ user?.email }}</p>
          </div>
          <button class="profile__edit-btn" @click="editingName = true">Modifier</button>
        </div>
        <div v-else class="profile__identity-edit">
          <input v-model="newUsername" class="profile__input" placeholder="Pseudo" />
          <div class="profile__identity-actions">
            <AppButton variant="ghost" @click="editingName = false">Annuler</AppButton>
            <AppButton variant="primary" :disabled="saveLoading" @click="onSaveUsername">
              {{ saveLoading ? '…' : 'Sauvegarder' }}
            </AppButton>
          </div>
        </div>
      </section>

      <!-- Stats globales Score Training -->
      <section v-if="stats?.gameStats" class="profile__card">
        <h2 class="profile__section-title">Score Training</h2>
        <div class="profile__stats-grid">
          <div class="profile__stat">
            <span class="profile__stat-value">{{ stats.gameStats.sessions }}</span>
            <span class="profile__stat-label">Sessions</span>
          </div>
          <div class="profile__stat">
            <span class="profile__stat-value">
              {{ stats.gameStats.totalQuestions > 0
                ? Math.round((stats.gameStats.totalCorrect / stats.gameStats.totalQuestions) * 100)
                : 0 }}%
            </span>
            <span class="profile__stat-label">Précision</span>
          </div>
          <div class="profile__stat">
            <span class="profile__stat-value">{{ stats.gameStats.bestStreak }}</span>
            <span class="profile__stat-label">Meilleure série</span>
          </div>
        </div>
      </section>

      <!-- Stats globales Échauffement -->
      <section v-if="stats?.warmupStats" class="profile__card">
        <h2 class="profile__section-title">Échauffement</h2>
        <div class="profile__stats-grid">
          <div class="profile__stat">
            <span class="profile__stat-value">{{ stats.warmupStats.sessions }}</span>
            <span class="profile__stat-label">Sessions</span>
          </div>
          <div class="profile__stat">
            <span class="profile__stat-value">{{ stats.warmupStats.totalDarts }}</span>
            <span class="profile__stat-label">Fléchettes</span>
          </div>
          <div class="profile__stat">
            <span class="profile__stat-value">{{ stats.warmupStats.avgAccuracy }}%</span>
            <span class="profile__stat-label">Précision moy.</span>
          </div>
        </div>
      </section>

      <!-- Historique Score Training -->
      <section v-if="gameSessions.length" class="profile__card">
        <h2 class="profile__section-title">Historique — Score Training</h2>
        <ul class="profile__history">
          <li v-for="s in gameSessions" :key="s.id" class="profile__history-item">
            <div class="profile__history-left">
              <span class="profile__history-score">{{ s.correct_count }}/{{ s.total_questions }}</span>
              <span class="profile__history-streak">série {{ s.best_streak }}</span>
            </div>
            <span class="profile__history-date">{{ formatDate(s.played_at) }}</span>
          </li>
        </ul>
      </section>

      <!-- Historique Échauffement -->
      <section v-if="warmupSessions.length" class="profile__card">
        <h2 class="profile__section-title">Historique — Échauffement</h2>
        <ul class="profile__history">
          <li v-for="s in warmupSessions" :key="s.id" class="profile__history-item">
            <div class="profile__history-left">
              <span class="profile__history-score">{{ s.hits }}/{{ s.total_darts }}</span>
              <span class="profile__history-streak">{{ s.accuracy }}%</span>
            </div>
            <span class="profile__history-date">{{ formatDate(s.played_at) }}</span>
          </li>
        </ul>
      </section>

      <AppButton variant="ghost" class="profile__logout" @click="onSignOut">
        Se déconnecter
      </AppButton>

    </main>
  </div>
</template>

<style lang="scss" scoped>
.profile {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-md;
  gap: $gap-md;

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding-bottom: $padding-xxl;
  }

  &__card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-lg;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__identity {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-md;
  }

  &__username {
    @include title-lg;
    color: $text-color;
  }

  &__email {
    @include text-sm;
    color: $muted;
    margin-top: $gap-xxs;
  }

  &__edit-btn {
    @include text-sm;
    color: $orange;
  }

  &__identity-edit {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__identity-actions {
    display: flex;
    gap: $gap-sm;
  }

  &__input {
    @include text-sm;
    background: rgba(255, 255, 255, 0.07);
    border: $border-sm solid rgba(255, 255, 255, 0.15);
    border-radius: $radius-md;
    color: $text-color;
    padding: $padding-sm $padding-md;
    outline: none;

    &::placeholder { color: $input-placeholder; }
    &:focus { border-color: rgba(255, 255, 255, 0.4); }
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $gap-sm;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__stat-value {
    @include title-xl;
    color: $text-color;
  }

  &__stat-label {
    @include text-sm;
    color: $muted;
    text-align: center;
    font-size: 11px;
  }

  &__history {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $padding-xs 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);

    &:last-child { border-bottom: none; }
  }

  &__history-left {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__history-score {
    @include text-sm;
    color: $text-color;
  }

  &__history-streak {
    @include text-sm;
    color: $muted;
    font-size: 13px;
  }

  &__history-date {
    @include text-sm;
    color: $muted;
    font-size: 13px;
  }

  &__logout {
    margin-top: $gap-sm;
    color: $error;
    border-color: rgba($error, 0.3);
  }
}
</style>
