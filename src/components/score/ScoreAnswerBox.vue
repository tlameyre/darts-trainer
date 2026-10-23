<script setup>
defineProps({
  value: { type: String, required: true },
  // null while typing, 'ok' / 'ko' once the answer is checked
  tone: { type: String, default: null },
  expected: { type: Number, default: null },
})
</script>

<template>
  <div
    class="answer-box"
    :class="[{ 'answer-box--empty': !value && !tone }, tone && `answer-box--${tone}`]"
    aria-live="polite"
  >
    <template v-if="tone === 'ko'">
      <span class="answer-box__wrong">{{ value || '—' }}</span>
      <span>→ {{ expected }}</span>
    </template>
    <template v-else>{{ value || '?' }}</template>
  </div>
</template>

<style lang="scss" scoped>
.answer-box {
  @include display-xs;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $gap-sm;
  height: 76px;
  flex-shrink: 0;
  border-radius: $radius-sm;
  background: $bg;
  color: $black;
  font-variant-numeric: tabular-nums;
  transition: background 0.2s, color 0.2s;

  &--empty {
    color: $border-color;
  }

  &--ok,
  &--ko {
    color: $white;
  }

  &--ok { background: rgba($white, 0.2); }
  &--ko { background: rgba($white, 0.2); }

  &__wrong {
    text-decoration: line-through;
    opacity: 0.7;
  }
}

@media (min-width: $bp-laptop) {
  .answer-box {
    @include display-md;
    height: 120px;
    border: $border-sm solid $muted;

    &--ok {
      background: $accent;
      border-color: $accent;
    }

    &--ko {
      background: $error;
      border-color: $error;
    }
  }
}
</style>
