<script setup>
import { watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppIconDefs from './components/AppIconDefs.vue'
import BottomNav from './components/BottomNav.vue'
import { useAuthStore } from './store/authStore.js'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

watch(() => authStore.isAuth, (val) => {
  if (route.meta.dev) return
  if (!val) {
    // Déconnexion → login
    router.replace({ name: 'login' })
  } else if (route.meta.public) {
    // Connexion OAuth : l'utilisateur est sur login/register → home
    router.replace({ name: 'home' })
  }
})
</script>

<template>
  <AppIconDefs />
  <RouterView />
  <BottomNav v-if="isAuth && !route.meta.hideNav && !route.meta.public" />
</template>
