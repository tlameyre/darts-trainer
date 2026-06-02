import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router/index.js'
import './styles/main.scss'

// Gère le redirect de 404.html pour GitHub Pages
const params = new URLSearchParams(window.location.search)
const redirect = params.get('redirect')
if (redirect) {
  params.delete('redirect')
  const remaining = params.toString()
  window.history.replaceState(
    null, '',
    '/darts-trainer' + redirect + (remaining ? '?' + remaining : '')
  )
}

createApp(App).use(createPinia()).use(router).mount('#app')
