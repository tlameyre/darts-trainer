import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameStore = defineStore('game', () => {
  const gameSettings = ref(null)

  return { gameSettings }
})
