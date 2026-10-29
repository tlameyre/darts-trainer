<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTournamentStore } from '../store/tournamentStore.js'
import PageHeader from '../components/PageHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppTabs from '../components/AppTabs.vue'
import TournamentListCard from '../components/tournament/TournamentListCard.vue'
import TournamentJoinByCodeModal from '../components/tournament/TournamentJoinByCodeModal.vue'

const router          = useRouter()
const tournamentStore = useTournamentStore()

const showJoinModal = ref(false)
const joinModalRef  = ref(null)

async function onJoinCode(code) {
  const tournamentId = await tournamentStore.joinTournament(code)
  if (tournamentId) {
    showJoinModal.value = false
    router.push({ name: 'tournament-detail', params: { id: tournamentId } })
  } else {
    joinModalRef.value?.setError("Code invalide ou tournoi déjà démarré.")
  }
}

const activeTab = ref('active')

onMounted(() => {
  tournamentStore.fetchTournaments()
  tournamentStore.subscribeToTournamentList()
})

onUnmounted(() => {
  tournamentStore.unsubscribeFromTournamentList()
})

const activeList    = computed(() => tournamentStore.tournaments.filter(t => t.status !== 'completed'))
const completedList = computed(() => tournamentStore.tournaments.filter(t => t.status === 'completed'))
const filtered      = computed(() => activeTab.value === 'active' ? activeList.value : completedList.value)

const tabs = computed(() => [
  { id: 'active',    label: `En cours · ${activeList.value.length}` },
  { id: 'completed', label: `Terminés · ${completedList.value.length}` },
])

function openTournament(id) {
  router.push({ name: 'tournament-detail', params: { id } })
}
</script>

<template>
  <div class="tournaments">
    <PageHeader class="tournaments__header" title="Tournois">
      <div class="tournaments__header-actions">
        <AppButton size="md" variant="secondary" tone="inverse" :block="false" @click="showJoinModal = true">Rejoindre avec un code</AppButton>
        <AppButton size="md" tone="tournament" :block="false" icon="plus" @click="router.push({ name: 'tournament-settings' })">Créer un tournoi</AppButton>
      </div>
    </PageHeader>

    <AppTabs v-model="activeTab" class="tournaments__tabs" variant="underline" :tabs="tabs" />

    <main class="tournaments__main">
      <div v-if="filtered.length" class="tournaments__list">
        <TournamentListCard
          v-for="t in filtered"
          :key="t.id"
          :tournament="t"
          @click="openTournament(t.id)"
        />
      </div>
      <p v-else-if="tournamentStore.loading" class="tournaments__empty">Chargement…</p>
      <p v-else class="tournaments__empty">
        {{ activeTab === 'active' ? 'Aucun tournoi en cours.' : 'Aucun tournoi terminé.' }}
      </p>
    </main>

    <div class="tournaments__actions">
      <AppButton variant="secondary" @click="showJoinModal = true">Rejoindre</AppButton>
      <AppButton tone="tournament" icon="plus" @click="router.push({ name: 'tournament-settings' })">Créer</AppButton>
    </div>

    <TournamentJoinByCodeModal
      ref="joinModalRef"
      :show="showJoinModal"
      @close="showJoinModal = false"
      @joined="onJoinCode"
    />
  </div>
</template>

<style lang="scss" scoped>
// Content column of the desktop layout (1120px, centered)
$content-inset: max(#{$padding-xxl}, calc((100% - 1120px) / 2));

.tournaments {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  margin: 0 auto;
  gap: $gap-md;
  @include nav-safe-bottom($padding-xxl * 2);

  &__tabs { --tab-color: #{$mode-tournament}; }

  &__header-actions { display: none; }

  &__main {
    flex: 1;
    padding: 0 $padding-md;
  }

  &__list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: $gap-sm;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xl 0;
  }

  &__actions {
    position: fixed;
    left: $padding-md;
    right: $padding-md;
    bottom: calc(#{$bottom-nav-height} + env(safe-area-inset-bottom) + #{$padding-sm});
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $gap-xs;
  }
}

@media (min-width: $bp-laptop) {
  .tournaments {
    gap: $gap-lg;
    @include nav-safe-bottom($padding-xxl);

    .tournaments__header {
      padding-left: $content-inset;
      padding-right: $content-inset;
      padding-bottom: $padding-xl;
    }

    &__header-actions {
      display: flex;
      gap: $gap-xs;
    }

    &__tabs {
      padding-left: $content-inset;
      padding-right: $content-inset;

      :deep(.app-tabs__tab) {
        flex: none;
        height: 56px;
        padding: 0 $padding-lg;
        border-bottom-width: 4px;
      }
    }

    &__main { padding: 0 $content-inset; }

    &__list { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: $gap-lg; }

    &__empty { @include text-md; }

    // Create / join live in the header on desktop
    &__actions { display: none; }
  }
}
</style>
