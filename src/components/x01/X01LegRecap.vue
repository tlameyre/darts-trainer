<script setup>
defineProps({
  show:         { type: Boolean, required: true },
  legWinner:    { type: String,  required: true },  // 'human' | 'ai'
  hasAI:        { type: Boolean, default: false },
  humanRemaining: { type: Number, default: 0 },
  aiRemaining:  { type: Number,  default: 0 },
  totalDarts:   { type: Number,  required: true },
  checkoutScore: { type: Number, default: null },
  aiDartsUsed:  { type: Number,  default: null },
  volleys:      { type: Array,   required: true },
})

defineEmits(['next'])
</script>

<template>
  <Transition name="slide-up">
    <div v-if="show" class="leg-recap">
      <div class="leg-recap__card">

        <div class="leg-recap__winner"
          :class="legWinner === 'ai' ? 'leg-recap__winner--ai' : 'leg-recap__winner--human'">
          {{ legWinner === 'ai' ? '🤖 L\'IA a remporté cette manche' : '🎯 Tu as remporté cette manche !' }}
        </div>

        <div v-if="hasAI" class="leg-recap__score-line">
          <span>Toi : <strong>{{ legWinner === 'human' ? 0 : humanRemaining }}</strong></span>
          <span>·</span>
          <span>IA : <strong>{{ legWinner === 'ai' ? 0 : aiRemaining }}</strong></span>
        </div>

        <div class="leg-recap__stats">
          <div class="leg-recap__stat">
            <span class="leg-recap__stat-val">{{ totalDarts }}</span>
            <span class="leg-recap__stat-lbl">fléchettes</span>
          </div>
          <div v-if="legWinner === 'human' && checkoutScore != null" class="leg-recap__stat">
            <span class="leg-recap__stat-val">{{ checkoutScore }}</span>
            <span class="leg-recap__stat-lbl">finish</span>
          </div>
          <div v-if="legWinner === 'ai' && aiDartsUsed != null" class="leg-recap__stat">
            <span class="leg-recap__stat-val">{{ aiDartsUsed }}</span>
            <span class="leg-recap__stat-lbl">fléchettes IA</span>
          </div>
          <div class="leg-recap__stat">
            <span class="leg-recap__stat-val">{{ volleys.filter(v => !v.bust).length }}</span>
            <span class="leg-recap__stat-lbl">volées valides</span>
          </div>
        </div>

        <div class="leg-recap__volleys">
          <span
            v-for="(v, i) in volleys"
            :key="i"
            class="leg-recap__chip"
            :class="{ 'leg-recap__chip--bust': v.bust }"
          >
            {{ v.bust ? 'BUST' : v.score }}
          </span>
        </div>

        <button class="leg-recap__next" @click="$emit('next')">
          Manche suivante →
        </button>

      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.leg-recap {
  position: fixed;
  inset: 0;
  background: $bg;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $padding-xl $padding-md;

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-lg;
    width: 100%;
    max-width: 380px;
  }

  &__winner {
    @include title-lg;
    font-weight: 700;
    color: $white;
    text-align: center;

    &--ai    { color: $orange; }
    &--human { color: $accent; }
  }

  &__score-line {
    display: flex;
    gap: $gap-sm;
    align-items: center;
    @include text-sm;
    color: $muted;

    strong { color: $white; }
  }

  &__stats {
    display: flex;
    gap: $gap-xl;
    justify-content: center;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__stat-val {
    @include title-xxxl;
    font-weight: 700;
    color: $white;
    line-height: 1;
  }

  &__stat-lbl {
    @include title-xs;
    color: $muted;
    text-align: center;
  }

  &__volleys {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xs;
    justify-content: center;
  }

  &__chip {
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    padding: 5px 14px;
    @include title-sm;
    font-weight: 700;
    color: $white;

    &--bust {
      background: rgba($error, 0.2);
      color: $error-light;
    }
  }

  &__next {
    width: 100%;
    background: $orange;
    border-radius: $radius-sm;
    padding: $padding-md;
    @include title-md;
    font-weight: 700;
    text-transform: uppercase;
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.8; }
  }
}

@media (min-width: $bp-laptop) {
  .leg-recap {
    &__winner    { @include title-xl; }
    &__stat-val  { @include display-sm; }
    &__stat-lbl  { @include title-sm; }
    &__chip      { @include title-md; }
    &__next      { @include title-lg; }
  }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
