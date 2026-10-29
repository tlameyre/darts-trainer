<script setup>
import { computed } from 'vue'
import GameStatCard from '../game/GameStatCard.vue'

const props = defineProps({
  // Array of player card data:
  // Human: { name, remaining, legsWon, avgVolley, lastScore, totalDarts, checkoutPct, isLegStarter }
  // AI:    { name, level, remaining, legsWon, lastScore, avgVolley, totalDarts, isThinking, isAI }
  players:     { type: Array,  required: true },
  activeIndex: { type: Number, default: 0 },
})

// 3-4 players: the active player keeps the full card, the others stack on the right
const isSpotlight  = computed(() => props.players.length >= 3)
const activePlayer = computed(() => props.players[props.activeIndex])
// Turn order starting right after the active player, so the next-up player sits
// at the top of the list and the one who just threw ends up at the bottom.
const otherPlayers = computed(() => {
  const n = props.players.length
  const list = []
  for (let offset = 1; offset < n; offset++) {
    const i = (props.activeIndex + offset) % n
    list.push({ ...props.players[i], _index: i })
  }
  return list
})

// Spotlight shows only the active card in full; duel shows both
const fullCards = computed(() => isSpotlight.value
  ? [{ ...activePlayer.value, _index: props.activeIndex }]
  : props.players.map((p, i) => ({ ...p, _index: i })))

function displayName(p) {
  return p.isAI ? 'DartBot' : p.name
}

function statRows(p) {
  return [
    { label: 'Moyenne',    value: p.avgVolley ?? '–' },
    { label: 'Dernière',   value: p.lastScore ?? '–' },
    { label: 'Fléchettes', value: p.totalDarts },
    { label: 'Checkout',   value: p.checkoutPct ?? '–' },
  ]
}
</script>

<template>
  <div class="split-card" :class="{ 'split-card--solo': players.length === 1 }">
    <GameStatCard
      v-for="player in fullCards"
      :key="player._index"
      :value="player.remaining"
      :rows="statRows(player)"
      :active="player._index === activeIndex"
    >
      <template #header>
        <span class="split-card__name">
          <span v-if="player.isLegStarter" class="split-card__starter" title="Commence la manche" />
          {{ displayName(player) }}
        </span>
        <span v-if="player.isAI && player.isThinking" class="split-card__thinking">
          <span class="split-card__think-dot" />
          <span class="split-card__think-dot" />
          <span class="split-card__think-dot" />
        </span>
        <span v-if="player.isAI" class="split-card__level">
          {{ player.level != null ? 'Lv. ' + player.level : 'Custom' }}
        </span>
        <span class="split-card__legs" title="Manches gagnées">{{ player.legsWon }}</span>
      </template>
    </GameStatCard>

    <div v-if="isSpotlight" class="split-card__list">
      <div v-for="player in otherPlayers" :key="player._index" class="split-card__row">
        <span class="split-card__row-id">
          <span class="split-card__name">
            <span v-if="player.isLegStarter" class="split-card__starter" title="Commence la manche" />
            {{ displayName(player) }}
          </span>
          <span class="split-card__legs" title="Manches gagnées">{{ player.legsWon }}</span>
        </span>
        <span class="split-card__row-score">{{ player.remaining }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.split-card {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $gap-xs;

  &--solo { grid-template-columns: minmax(0, 1fr); }

  &__name {
    @include title-md;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-card--ghost &__name,
  &__row &__name { opacity: 0.85; }

  &__starter {
    width: 6px;
    height: 6px;
    flex-shrink: 0;
    border-radius: $radius-pill;
    background: currentColor;
  }

  &__legs {
    min-width: 22px;
    height: 22px;
    padding: 0 $padding-xxs;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: rgba($white, 0.2);
    color: $white;
    @include title-sm;
    line-height: 1;
  }

  .stat-card:not(.stat-card--ghost) &__legs { background: var(--game-color, #{$accent}); }

  &__level {
    @include text-xs;
    font-weight: 600;
    flex-shrink: 0;
    opacity: 0.8;
  }

  // ── Spotlight list (3-4 players) ────────────────────────────────────────
  &__list {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__row {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-xs;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    background: rgba($white, 0.14);
    color: $white;
  }

  &__row-id {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $gap-xxs;
  }

  &__row-score {
    @include title-xxxl;
    line-height: 1;
    opacity: 0.85;
    font-variant-numeric: tabular-nums;
  }

  // ── DartBot thinking indicator ──────────────────────────────────────────
  &__thinking {
    display: flex;
    gap: 3px;
    align-items: center;
    flex-shrink: 0;
  }

  &__think-dot {
    width: 4px;
    height: 4px;
    border-radius: $radius-pill;
    background: currentColor;
    animation: think-blink 1.2s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes think-blink {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1.1); }
}

@media (min-width: $bp-laptop) {
  .split-card {
    gap: $gap-md;

    &__name     { @include title-xxl; }
    &__legs     { @include title-lg; min-width: 30px; height: 30px; }
    &__level    { @include text-sm; }
    &__row      { padding: $padding-md $padding-xl; }
    &__row-score { @include display-xs; }
  }
}
</style>
