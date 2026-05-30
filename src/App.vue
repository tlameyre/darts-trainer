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
  if (val) router.replace({ name: 'home' })
  else router.replace({ name: 'login' })
})
</script>

<template>
  <AppIconDefs />
  <RouterView />
  <BottomNav v-if="isAuth && !route.meta.hideNav && !route.meta.public" />
</template>
