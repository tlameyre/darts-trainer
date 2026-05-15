<script setup>
defineProps({
  streak:        { type: Number, required: true },
  questionLabel: { type: String, required: true },
  maxQuestions:  { default: null },
})
</script>

<template>
  <header class="app-header">
    <h1 class="app-header__title">Darts <span>Counter</span></h1>

    <div class="app-header__right">
      <!-- Questions définies : affiche uniquement le compteur -->
      <div v-if="maxQuestions !== null" class="stat-pill">
        {{ questionLabel }}
      </div>
      <!-- Illimité : affiche la série -->
      <div v-else class="stat-pill">
        Série: <strong>{{ streak }}</strong>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  width: 100%;
  background: $card;
  border-bottom: 1px solid $border;
  padding: 12px 16px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;

  &__title {
    font-size: 18px;
    font-weight: 700;

    span { color: $accent; }
  }
}

.stat-pill {
  background: $bg;
  border: 1px solid $border;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 600;
  color: $text;
  font-variant-numeric: tabular-nums;
}
</style>
