<script setup>
import { computed } from 'vue'
import AppButton from '../AppButton.vue'
import IconButton from '../IconButton.vue'
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

defineEmits(['replay', 'home', 'quit'])

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
      <header class="result__bar">
        <IconButton variant="bare" light icon="arrow-left" label="Quitter" @click="$emit('quit')" />
        <h1 class="result__bar-title">Fin de partie</h1>
      </header>

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
      <AppButton size="md" tone="red" @click="$emit('replay')">Rejouer</AppButton>
      <AppButton size="md" variant="secondary" @click="$emit('home')">Accueil</AppButton>
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

  // The header lives in the side column on desktop only (the app header serves mobile)
  &__bar { display: none; }

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

}

// Desktop: red side column (header, winner, scores) and the ranking on the right
// with the actions under it, full width
@media (min-width: $bp-laptop) {
  .result {
    display: grid;
    grid-template-columns: 440px minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    overflow: hidden;

    &__hero {
      grid-column: 1;
      grid-row: 1 / 3;
      padding: $padding-xxl * 1.25;
      gap: $gap-xl;
    }

    &__bar {
      display: flex;
      align-items: center;
      gap: $gap-sm;
    }


    &__bar-title {
      @include title-xl;
      letter-spacing: $tracking-sm;
    }

    &__trophy { width: 72px; height: 72px; }
    &__champion { gap: $gap-md; }
    &__kicker { @include text-xs; }
    &__name { @include display-xs; }
    &__score-name { @include title-md; }
    &__score-value { @include display-xs; }
    &__subtitle { @include text-md; }

    &__main {
      grid-column: 2;
      grid-row: 1;
      min-height: 0;
      overflow-y: auto;
      padding: $padding-xxl * 1.25;
    }

    &__title { @include title-xxl; }
    &__hint { @include text-sm; }
    &__rank { @include title-xl; }
    &__avatar { @include title-md; width: 40px; height: 40px; }
    &__player { @include title-xxl; }
    &__row { padding: $padding-md; gap: $gap-md; }
    &__closed-value { @include title-xxxl; }
    &__closed-label { @include text-xxs; }

    &__actions {
      grid-column: 2;
      grid-row: 2;
      margin-top: 0;
      gap: $gap-sm;
      padding: 0 $padding-xxl * 1.25 $padding-xxl * 1.25;
    }
  }
}
</style>
