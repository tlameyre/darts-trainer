<script setup>
import { watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppIconDefs from './components/AppIconDefs.vue'
import BottomNav from './components/BottomNav.vue'
import { isAuth } from './store/authStore.js'

const router = useRouter()
const route  = useRoute()

watch(isAuth, (val) => {
  if (val) router.replace({ name: 'home' })
  else router.replace({ name: 'login' })
})
</script>

<template>
  <AppIconDefs />
  <RouterView />
  <BottomNav v-if="route.meta.nav" />
</template>
