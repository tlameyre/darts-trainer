import { createRouter, createWebHashHistory } from 'vue-router'

import LobbyView    from '../views/LobbyView.vue'
import SettingsView from '../views/SettingsView.vue'
import GameView     from '../views/GameView.vue'

const routes = [
  {
    path:      '/',
    name:      'lobby',
    component: LobbyView,
  },
  {
    path:      '/game/:modeId',
    name:      'settings',
    component: SettingsView,
  },
  {
    path:      '/game/:modeId/play',
    name:      'game',
    component: GameView,
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
