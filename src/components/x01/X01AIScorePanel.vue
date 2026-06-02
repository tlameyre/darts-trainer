<script setup>
defineProps({
  remaining:   { type: Number, required: true },
  legsWon:     { type: Number, required: true },
  legsToWin:   { type: Number, required: true },
  profileLabel:{ type: String, required: true },
  lastVolley:  { type: Object, default: null },  // { score, bust, isCheckout }
  isPlaying:   { type: Boolean, default: false },
})
</script>

<template>
  <div class="ai-panel" :class="{ 'ai-panel--playing': isPlaying }">
    <div class="ai-panel__header">
      <span class="ai-panel__label">🤖 IA — {{ profileLabel }}</span>
      <span class="ai-panel__legs">
        <span v-for="i in legsToWin" :key="i" class="ai-panel__leg-dot"
          :class="{ 'ai-panel__leg-dot--won': i <= legsWon }" />
      </span>
    </div>

    <div class="ai-panel__score">{{ remaining }}</div>

    <div class="ai-panel__volley" v-if="lastVolley">
      <span v-if="lastVolley.isCheckout" class="ai-panel__tag ai-panel__tag--checkout">FINISH {{ lastVolley.score }}</span>
      <span v-else-if="lastVolley.bust"  class="ai-panel__tag ai-panel__tag--bust">BUST</span>
      <span v-else                       class="ai-panel__tag">{{ lastVolley.score > 0 ? '+' + lastVolley.score : '—' }}</span>
    </div>

    <div v-if="isPlaying" class="ai-panel__thinking">
      <span class="ai-panel__dot" /><span class="ai-panel__dot" /><span class="ai-panel__dot" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ai-panel {
  background: rgba(255, 255, 255, 0.04);
  border: $border-sm solid rgba(255, 255, 255, 0.08);
  border-radius: $radius-md;
  padding: $padding-sm $padding-md;
  display: flex;
  align-items: center;
  gap: $gap-md;
  transition: border-color 0.2s;

  &--playing {
    border-color: $orange;
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    flex: 1;
    min-width: 0;
  }

  &__label {
    @include text-xs;
    color: $muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__legs {
    display: flex;
    gap: 4px;
  }

  &__leg-dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    background: rgba(255, 255, 255, 0.15);

    &--won { background: $orange; }
  }

  &__score {
    @include display-xs;
    color: $text-color;
    line-height: 1;
    flex-shrink: 0;
  }

  &__volley {
    flex-shrink: 0;
    width: 72px;
    text-align: right;
  }

  &__tag {
    @include title-sm;
    color: $muted;

    &--checkout { color: $accent; }
    &--bust     { color: $error; }
  }

  &__thinking {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-shrink: 0;
  }

  &__dot {
    width: 5px;
    height: 5px;
    border-radius: $radius-pill;
    background: $orange;
    animation: ai-blink 1.2s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes ai-blink {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1.1); }
}

@media (min-width: $bp-laptop) {
  .ai-panel {
    &__label { @include text-sm; }
    &__tag   { @include title-md; }
  }
}
</style>
