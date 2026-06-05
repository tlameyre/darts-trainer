<script setup>
import { computed } from 'vue'
import StatCell from '../StatCell.vue'

const props = defineProps({
  stats:      { type: Object,  default: null },
  legsPlayed: { type: Number,  required: true },
  startScore: { type: Number,  required: true },
  aiWon:      { type: Boolean, default: false },
  aiLegsWon:  { type: Number,  default: 0 },
})

defineEmits(['replay', 'home'])

const checkoutPct = computed(() => {
  if (!props.stats?.doublesAttempted) return null
  return Math.round((props.stats.doublesHit / props.stats.doublesAttempted) * 100)
})
</script>

<template>
  <div class="result">

    <div class="result__top">
      <div class="result__emoji">{{ aiWon ? '🤖' : '🏆' }}</div>
      <h2 class="result__title" :class="{ 'result__title--ai': aiWon }">
        {{ aiWon ? 'L\'IA a gagné la partie !' : 'Bien joué !' }}
      </h2>
      <p class="result__subtitle">
        {{ startScore }} pts ·
        <template v-if="aiWon">
          {{ aiLegsWon }} manche{{ aiLegsWon > 1 ? 's' : '' }} remportée{{ aiLegsWon > 1 ? 's' : '' }} par l'IA
        </template>
        <template v-else>
          {{ legsPlayed }} manche{{ legsPlayed > 1 ? 's' : '' }}
        </template>
      </p>
    </div>

    <template v-if="stats">

      <!-- ── Ligne 1 : moyennes ──────────────────────────────────────────── -->
      <div class="result__row">
        <StatCell :value="stats.avgVolley" label="Moy. par volée"     highlight />
        <StatCell :value="stats.avg9darts" label="Moy. 9 fléchettes"  highlight />
      </div>

      <!-- ── Ligne 2 : doubles / finish ─────────────────────────────────── -->
      <div class="result__row">
        <StatCell :value="`${stats.doublesHit}/${stats.doublesAttempted || '?'}`" label="Aux doubles" />
        <StatCell :value="checkoutPct != null ? checkoutPct + ' %' : '–'" label="% de finish" />
        <StatCell :value="stats.highestFinish || '–'" label="Plus haut finish" />
      </div>

      <!-- ── Ligne 3 : volée / manches ──────────────────────────────────── -->
      <div class="result__row">
        <StatCell :value="stats.highestVolley || '–'" label="Meilleure volée" />
        <div class="result__leg-cell">
          <div class="result__leg">
            <span class="result__leg-darts">{{ stats.bestLeg.darts }}</span>
            <span class="result__leg-label">fléchettes</span>
            <span class="result__leg-finish">finish {{ stats.bestLeg.checkoutScore }}</span>
          </div>
          <span class="result__leg-title">Meilleure manche</span>
        </div>
        <div class="result__leg-cell">
          <div class="result__leg">
            <span class="result__leg-darts">{{ stats.worstLeg.darts }}</span>
            <span class="result__leg-label">fléchettes</span>
            <span class="result__leg-finish">finish {{ stats.worstLeg.checkoutScore }}</span>
          </div>
          <span class="result__leg-title">Pire manche</span>
        </div>
      </div>

    </template>

    <p v-else class="result__no-stats">
      Tu n'as pas terminé de manche cette partie.
    </p>

    <div class="result__actions">
      <button class="result__btn result__btn--secondary" @click="$emit('home')">
        Retour au lobby
      </button>
      <button class="result__btn result__btn--primary" @click="$emit('replay')">
        Rejouer
      </button>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.result {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;
  padding: $padding-lg 0;
  flex: 1;
  overflow-y: auto;

  &__top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
  }

  &__emoji  { @include title-xxxl; line-height: 1; }

  &__title {
    @include title-xxl;
    color: $white;
    text-align: center;

    &--ai { color: $orange; }
  }

  &__subtitle {
    @include text-sm;
    color: $muted;
    text-align: center;
  }

  // ── Grille de stats ───────────────────────────────────────────────────────
  &__row {
    display: flex;
    gap: $gap-sm;
  }

  // ── Bloc manche (meilleure / pire) ────────────────────────────────────────
  &__leg-cell {
    flex: 1;
    background: rgba($white, 0.06);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: $gap-xxs;
    min-width: 0;
  }

  &__leg {
    display: flex;
    align-items: baseline;
    gap: 4px;
    flex-wrap: wrap;
  }

  &__leg-darts {
    @include title-xl;
    font-weight: 700;
    color: $white;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__leg-label  { @include text-xxs; color: rgba($white, 0.6); }
  &__leg-finish { @include text-xxs; color: $muted; white-space: nowrap; }

  &__leg-title {
    @include text-xxs;
    color: $muted;
    line-height: 1.3;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  &__no-stats {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-lg 0;
  }

  &__actions {
    display: flex;
    gap: $gap-sm;
    margin-top: auto;
  }

  &__btn {
    flex: 1;
    padding: $padding-md;
    border-radius: $radius-sm;
    @include title-md;
    font-weight: 700;
    text-transform: uppercase;
    transition: opacity 0.15s;

    &:active { opacity: 0.75; }

    &--primary   { background: $orange; color: $white; }
    &--secondary { background: rgba($white, 0.08); color: $white; }
  }
}

@media (min-width: $bp-laptop) {
  .result {
    gap: $gap-xl;

    &__title    { @include title-xxxl; }
    &__subtitle { @include text-md; }
    &__leg-darts  { @include title-xxl; }
    &__leg-label  { @include text-xs; }
    &__leg-finish { @include text-xs; }
    &__leg-title  { @include text-xs; }
    &__btn        { @include title-lg; }
  }
}
</style>
