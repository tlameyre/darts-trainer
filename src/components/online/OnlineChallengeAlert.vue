<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import { avatarColor } from '../../utils/avatarColor.js'

const props = defineProps({
  opponentName: { type: String, required: true },
  myName:       { type: String, default: 'Toi' },
  startScore:   { type: Number, required: true },
  legsToWin:    { type: Number, required: true },
  tone:         { type: String, default: 'online', validator: v => ['online', 'tournament'].includes(v) },
  // { name, round } of the tournament match, null for a plain online match
  tournament:   { type: Object, default: null },
  busy:         { type: Boolean, default: false },
})

defineEmits(['accept', 'later', 'decline'])

const chips = computed(() => [String(props.startScore), `Premier à ${props.legsToWin} manche${props.legsToWin > 1 ? 's' : ''}`])
</script>

<template>
  <Teleport to="body">
    <div class="alert" :class="`alert--${tone}`">
      <div class="alert__backdrop" @click="$emit('later')" />
      <section class="alert__card" role="alertdialog" aria-labelledby="challenge-title">
        <div class="alert__hero">
          <div class="alert__top">
            <span class="alert__kicker">
              <AppIcon :name="tournament ? 'trophy' : 'globe'" :width="16" :height="16" />
              {{ tournament ? 'Défi de tournoi' : 'Défi en ligne' }}
            </span>
            <button class="alert__close" aria-label="Fermer" @click="$emit('later')">
              <AppIcon name="close" :width="16" :height="16" />
            </button>
          </div>

          <h2 id="challenge-title" class="alert__title">{{ opponentName }} te défie</h2>

          <div class="alert__versus">
            <div class="alert__player">
              <span class="alert__avatar" :style="{ background: avatarColor(opponentName) }">{{ opponentName[0] }}</span>
              <span class="alert__name">{{ opponentName }}</span>
              <span class="alert__tag">Adversaire</span>
            </div>
            <span class="alert__vs">VS</span>
            <div class="alert__player">
              <span class="alert__avatar" :style="{ background: avatarColor(myName) }">{{ myName[0] }}</span>
              <span class="alert__name">Toi</span>
              <span class="alert__tag">Toi</span>
            </div>
          </div>
        </div>

        <div class="alert__body">
          <div v-if="tournament" class="alert__tournament">
            <span class="alert__tournament-icon"><AppIcon name="trophy" :width="20" :height="20" /></span>
            <span class="alert__tournament-text">
              <span class="alert__tournament-kicker">Match de tournoi · {{ tournament.round }}</span>
              <span class="alert__tournament-name">{{ tournament.name }}</span>
            </span>
          </div>

          <div class="alert__chips">
            <span v-for="c in chips" :key="c" class="alert__chip">{{ c }}</span>
          </div>

          <div class="alert__actions">
            <button class="alert__btn" @click="$emit('later')">Plus tard</button>
            <button class="alert__btn alert__btn--primary" :disabled="busy" @click="$emit('accept')">
              <AppIcon name="check" :width="20" :height="20" />
              Accepter
            </button>
          </div>
          <button class="alert__decline" :disabled="busy" @click="$emit('decline')">Refuser le défi</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.alert {
  --alert-color: #{$mode-online};
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $padding-md;

  &--tournament { --alert-color: #{$mode-tournament}; }

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba($black, 0.6);
  }

  &__card {
    position: relative;
    width: 100%;
    max-width: 342px;
    max-height: 100%;
    overflow-y: auto;
    border-radius: $radius-lg;
    background: $bg;
    box-shadow: 0 24px 48px rgba($black, 0.35);
  }

  &__hero {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding: $padding-md $padding-md $padding-lg;
    background: var(--alert-color);
    color: $white;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__kicker {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
  }

  &__close {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: rgba($white, 0.18);
    color: $white;
  }

  &__title {
    @include title-xxl;
    line-height: 0.9;
    text-align: center;
  }

  &__versus {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__player {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
  }

  &__avatar {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    border-radius: $radius-pill;
    box-shadow: 0 0 0 3px $white;
    color: $white;
    @include title-xl;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__name {
    max-width: 100%;
    @include title-lg;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tag {
    padding: 2px $padding-xs;
    border-radius: $radius-sm;
    background: rgba($white, 0.2);
    @include title-xxs;
    letter-spacing: 0.04em;
  }

  &__vs {
    @include title-xl;
    opacity: 0.7;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding: $padding-md;
  }

  &__tournament {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm;
    border: $border-md solid $mode-tournament;
    border-radius: $radius-sm;
    background: $white;
  }

  &__tournament-icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: $radius-sm;
    background: $mode-tournament;
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__tournament-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__tournament-kicker {
    @include text-xxs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    color: $mode-tournament;
  }

  &__tournament-name {
    @include title-md;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: $gap-xxs;
  }

  &__chip {
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: $surface;
    @include title-sm;
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 1.6fr;
    gap: $gap-xs;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    height: 56px;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    color: $text-color;
    @include title-lg;

    &--primary {
      border-color: var(--alert-color);
      background: var(--alert-color);
      color: $white;
      @include title-xl;
    }

    &:disabled { opacity: 0.4; }
  }

  &__decline {
    align-self: center;
    padding: $padding-xxs $padding-xs;
    @include text-sm;
    font-weight: 600;
    color: $muted;
    text-decoration: underline;

    &:disabled { opacity: 0.4; }
  }
}

@media (min-width: $bp-laptop) {
  .alert {
    &__card { max-width: 520px; }
    &__hero { gap: $gap-lg; padding: $padding-lg $padding-lg $padding-xl; }
    &__kicker { @include text-sm; }
    &__title { @include display-xs; }
    &__avatar { width: 80px; height: 80px; @include title-xxl; }
    &__name { @include title-xl; }
    &__vs { @include title-xxl; }
    &__body { gap: $gap-lg; padding: $padding-lg; }
    &__tournament-kicker { @include text-xs; }
    &__tournament-name { @include title-xl; }
    &__chip { @include title-md; }
    &__btn { height: 70px; @include title-xl; }
    &__btn--primary { @include title-xxl; }
    &__decline { @include text-md; }
  }
}
</style>
