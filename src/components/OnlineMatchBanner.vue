<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOnlineMatchStore, profileName } from '../store/onlineMatchStore.js'
import AppIcon from './AppIcon.vue'

const router           = useRouter()
const onlineMatchStore = useOnlineMatchStore()

// Une invitation reçue passe avant un match en cours à reprendre
const banner = computed(() => {
  const invite = onlineMatchStore.incomingInvites[0]
  if (invite) {
    return { match: invite, text: `${profileName(invite.host)} te défie en ${invite.settings.startScore}`, action: 'Voir' }
  }
  const accepted = onlineMatchStore.acceptedMatches[0]
  if (accepted) {
    return { match: accepted, text: `Bull contre ${profileName(onlineMatchStore.opponentOf(accepted))}`, action: 'Ouvrir' }
  }
  const active = onlineMatchStore.activeMatches[0]
  if (active) {
    return { match: active, text: `Match en cours contre ${profileName(onlineMatchStore.opponentOf(active))}`, action: 'Reprendre' }
  }
  return null
})
</script>

<template>
  <Transition name="banner">
    <button
      v-if="banner"
      class="online-banner"
      @click="router.push({ name: 'online-match', params: { id: banner.match.id } })"
    >
      <AppIcon name="globe" :width="18" :height="18" class="online-banner__icon" />
      <span class="online-banner__text">{{ banner.text }}</span>
      <span class="online-banner__action">{{ banner.action }}</span>
    </button>
  </Transition>
</template>

<style lang="scss" scoped>
.online-banner {
  position: fixed;
  // Juste au-dessus de la BottomNav (bannière affichée seulement là où elle l'est)
  bottom: calc(#{$bottom-nav-height} + #{$padding-sm} + env(safe-area-inset-bottom));
  left: $padding-md;
  right: $padding-md;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: $padding-sm $padding-md;
  background: $orange-dark;
  border-radius: $radius-pill;
  color: $white;
  text-align: left;
  transition: opacity 0.15s;

  &:active { opacity: 0.8; }

  &__icon { flex-shrink: 0; }

  &__text {
    flex: 1;
    @include text-sm;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__action { @include title-sm; }
}

.banner-enter-active,
.banner-leave-active { transition: transform 0.25s ease, opacity 0.25s; }
.banner-enter-from,
.banner-leave-to     { transform: translateY(-20px); opacity: 0; }

@media (min-width: $bp-laptop) {
  .online-banner {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    min-width: 400px;

    &__text   { @include text-md; }
    &__action { @include title-md; }
  }

  .banner-enter-from,
  .banner-leave-to { transform: translate(-50%, 20px); }
}
</style>
