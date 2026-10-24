<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import { avatarColor } from '../../utils/avatarColor.js'

const props = defineProps({
  // [{ name, legsWon, closedZones }]
  players:    { type: Array,  required: true },
  legsToWin:  { type: Number, required: true },
  winnerIndex: { type: Number, default: 0 },
  totalDarts: { type: Number,  default: null },
  zoneCount:  { type: Number,  default: 12 },
})

defineEmits(['replay', 'home'])

const isMulti = computed(() => props.players.length > 1)

const winnerName = computed(() => props.players[props.winnerIndex]?.name ?? '')

const ranking = computed(() => props.players
  .map((p, i) => ({ ...p, isWinner: i === props.winnerIndex }))
  .sort((a, b) => b.legsWon - a.legsWon || b.closedZones - a.closedZones))

const subtitle = computed(() => {
  const legs = `${props.legsToWin} manche${props.legsToWin > 1 ? 's' : ''}`
  if (!isMulti.value) return `Tactics · ${legs}`
  const closedBoard = props.players[props.winnerIndex]?.closedZones === props.zoneCount
  return `${closedBoard ? 'A fermé le plateau le premier · ' : ''}Tactics · ${legs} · ${props.players.length} joueurs`
})
</script>

<template>
  <div class="result">
    <section class="result__hero">
      <div class="result__champion">
        <span class="result__trophy"><AppIcon name="trophy" :width="30" :height="30" /></span>
        <div class="result__champion-text">
          <span class="result__kicker">{{ isMulti ? 'Victoire' : 'Plateau fermé' }}</span>
          <span class="result__name">{{ winnerName }}</span>
        </div>
      </div>

      <div v-if="isMulti" class="result__scores">
        <div
          v-for="(p, i) in players"
          :key="i"
          class="result__score"
          :class="{ 'result__score--dim': i !== winnerIndex }"
        >
          <span class="result__score-name">{{ p.name }}</span>
          <span class="result__score-value">{{ p.legsWon }}</span>
        </div>
      </div>
      <div v-else class="result__scores result__scores--solo">
        <div class="result__score">
          <span class="result__score-name">Fléchettes</span>
          <span class="result__score-value">{{ totalDarts ?? '–' }}</span>
        </div>
      </div>

      <span class="result__subtitle">{{ subtitle }}</span>
    </section>

    <main v-if="isMulti" class="result__main">
      <div class="result__head">
        <h2 class="result__title">Classement</h2>
        <span class="result__hint">zones fermées</span>
      </div>
      <div
        v-for="(p, i) in ranking"
        :key="p.name"
        class="result__row"
        :class="{ 'result__row--winner': p.isWinner }"
      >
        <span class="result__rank">{{ i + 1 }}</span>
        <span class="result__avatar" :style="{ background: avatarColor(p.name) }">{{ p.name?.[0]?.toUpperCase() }}</span>
        <span class="result__player">{{ p.name }}</span>
        <span class="result__closed">
          <span class="result__closed-value">{{ p.closedZones }}/{{ zoneCount }}</span>
          <span class="result__closed-label">zones fermées</span>
        </span>
      </div>
    </main>

    <div class="result__actions">
      <button class="result__btn result__btn--primary" @click="$emit('replay')">Rejouer</button>
      <button class="result__btn" @click="$emit('home')">Accueil</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.result {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  &__hero {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding: $padding-md;
    background: $mode-tactics;
    color: $white;
  }

  &__champion {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__trophy {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $white;
    color: $mode-tactics;
  }

  &__champion-text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__kicker {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.85;
  }

  &__name {
    @include display-sm;
    line-height: 0.9;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__scores {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: $gap-sm;
    padding-top: $padding-sm;
    border-top: $border-md solid rgba($white, 0.3);

    &--solo { grid-auto-columns: auto; }
  }

  &__score {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    min-width: 0;

    & + & {
      padding-left: $padding-sm;
      border-left: $border-md solid rgba($white, 0.3);
    }

    &--dim { opacity: 0.8; }
  }

  &__score-name {
    @include title-sm;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__score-value {
    @include display-xs;
    line-height: 1;
  }

  &__subtitle {
    @include text-sm;
    opacity: 0.85;
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding: $padding-md;
  }

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: $padding-xs 0;
    border-bottom: $border-lg solid $black;
  }

  &__title { @include title-lg; }

  &__hint {
    @include text-sm;
    color: $muted;
  }

  &__row {
    display: grid;
    grid-template-columns: 28px 40px minmax(0, 1fr) auto;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xs $padding-sm;
    border: $border-md solid $surface;
    border-radius: $radius-sm;
    background: $surface;

    &--winner { border-color: $mode-tactics; }
  }

  &__rank {
    @include title-lg;
    color: $muted;

    .result__row--winner & { color: $mode-tactics; }
  }

  &__avatar {
    @include title-md;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    color: $white;
  }

  &__player {
    @include title-lg;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__closed {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  &__closed-value {
    @include title-xxl;
    line-height: 1;

    .result__row--winner & { color: $mode-tactics; }
  }

  &__closed-label {
    @include text-xxs;
    color: $muted;
  }

  &__actions {
    margin-top: auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $gap-xs;
    padding: $padding-md;
    @include safe-bottom($padding-md);
  }

  &__btn {
    @include title-xl;
    height: 56px;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    color: $black;

    &--primary {
      border-color: $mode-tactics;
      background: $mode-tactics;
      color: $white;
    }
  }
}

@media (min-width: $bp-laptop) {
  .result {
    &__hero {
      padding: $padding-xl $padding-xxl;
      gap: $gap-lg;
    }

    &__trophy { width: 72px; height: 72px; }
    &__kicker { @include text-sm; }
    &__name { @include display-md; }
    &__score-name { @include title-md; }
    &__score-value { @include display-sm; }
    &__subtitle { @include text-md; }

    &__main {
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
      padding: $padding-xl;
    }

    &__title { @include title-xl; }
    &__hint { @include text-md; }
    &__rank { @include title-xl; }
    &__avatar { @include title-lg; width: 48px; height: 48px; }
    &__player { @include title-xl; }
    &__closed-value { @include title-xxxl; }
    &__closed-label { @include text-xs; }

    &__actions {
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
    }

    &__btn { @include title-xxl; height: 64px; }
  }
}
</style>
