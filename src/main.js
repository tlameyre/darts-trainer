import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router/index.js'
import './styles/main.scss'
import VueApexCharts from "vue3-apexcharts";

createApp(App).use(VueApexCharts).use(createPinia()).use(router).mount('#app')
