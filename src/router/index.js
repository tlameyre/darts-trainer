import { createRouter, createWebHashHistory } from 'vue-router'
import { isAuth, loading } from '../store/authStore.js'

import LobbyView          from '../views/LobbyView.vue'
import SettingsView       from '../views/SettingsView.vue'
import GameView           from '../views/GameView.vue'
import WarmupSettingsView from '../views/WarmupSettingsView.vue'
import WarmupGameView     from '../views/WarmupGameView.vue'
import LoginView          from '../views/LoginView.vue'
import RegisterView       from '../views/RegisterView.vue'
import ProfileView        from '../views/ProfileView.vue'

const routes = [
  // Auth
  { path: '/login',    name: 'login',    component: LoginView,    meta: { public: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { public: true } },

  // App
  { path: '/',                   name: 'lobby',          component: LobbyView },
  { path: '/profile',            name: 'profile',        component: ProfileView },
  { path: '/score-training',     name: 'score-settings', component: SettingsView },
  { path: '/score-training/play',name: 'score-game',     component: GameView },
  { path: '/warmup',             name: 'warmup-settings',component: WarmupSettingsView },
  { path: '/warmup/play',        name: 'warmup-game',    component: WarmupGameView },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to) => {
  // Attendre la résolution de la session Supabase au premier chargement
  if (loading.value) {
    await new Promise(resolve => {
      const stop = setInterval(() => {
        if (!loading.value) { clearInterval(stop); resolve() }
      }, 20)
    })
  }

  if (!to.meta.public && !isAuth.value) {
    return { name: 'login' }
  }

  if (to.meta.public && isAuth.value) {
    return { name: 'lobby' }
  }
})
