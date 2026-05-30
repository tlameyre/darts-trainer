import { createRouter, createWebHistory } from 'vue-router'
import { isAuth, loading } from '../store/authStore.js'

import HomeView         from '../views/HomeView.vue'
import LobbyView          from '../views/LobbyView.vue'
import StatsView          from '../views/StatsView.vue'
import SettingsView       from '../views/SettingsView.vue'
import GameView           from '../views/GameView.vue'
import WarmupSettingsView from '../views/WarmupSettingsView.vue'
import WarmupGameView     from '../views/WarmupGameView.vue'
import LoginView          from '../views/LoginView.vue'
import RegisterView       from '../views/RegisterView.vue'
import ProfileView        from '../views/ProfileView.vue'
import ProfileEditView    from '../views/ProfileEditView.vue'
import BadgesView         from '../views/BadgesView.vue'

const routes = [
  // Auth
  { path: '/login',    name: 'login',    component: LoginView,    meta: { public: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { public: true } },

  // App — onglets nav
  { path: '/',      name: 'home',  component: HomeView,  meta: { nav: true } },
  { path: '/play',  name: 'play',  component: LobbyView, meta: { nav: true } },
  { path: '/stats', name: 'stats', component: StatsView, meta: { nav: true } },

  // App — autres
  { path: '/profile',            name: 'profile',        component: ProfileView },
  { path: '/profile/edit',      name: 'profile-edit',   component: ProfileEditView },
  { path: '/profile/badges',    name: 'badges',         component: BadgesView },
  { path: '/score-training',     name: 'score-settings', component: SettingsView },
  { path: '/score-training/play',name: 'score-game',     component: GameView },
  { path: '/warmup',             name: 'warmup-settings',component: WarmupSettingsView },
  { path: '/warmup/play',        name: 'warmup-game',    component: WarmupGameView },
]

export const router = createRouter({
  history: createWebHistory('/darts-trainer/'),
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
    return { name: 'home' }
  }
})
