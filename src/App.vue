<script setup>
import { watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppIconDefs from './components/AppIconDefs.vue'
import BottomNav from './components/BottomNav.vue'
import { isAuth } from './store/authStore.js'

const router = useRouter()
const route  = useRoute()

// Redirige vers /login uniquement lors de la déconnexion.
// Le router guard gère déjà la redirection vers home à la connexion.
watch(isAuth, (val) => {
  if (route.meta.dev) return
  if (!val) router.replace({ name: 'login' })
})
</script>

<template>
  <AppIconDefs />
  <RouterView />
  <BottomNav v-if="isAuth && !route.meta.hideNav && !route.meta.public" />
</template>
