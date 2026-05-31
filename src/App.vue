<script setup>
import { watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppIconDefs from './components/AppIconDefs.vue'
import BottomNav from './components/BottomNav.vue'
import { isAuth } from './store/authStore.js'

const router = useRouter()
const route  = useRoute()

watch(isAuth, (val) => {
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
