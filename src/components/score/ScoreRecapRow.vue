<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  index: { type: Number, required: true },
  entry: { type: Object, required: true },
  doubleValidation: Boolean,
})

// One answer line: what was typed, struck through and followed by the right value when wrong
function step(answer, expected) {
  const ok = answer === expected
  return { ok, answer: answer ?? '—', fix: ok ? null : expected }
}

const volee = computed(() => step(props.entry.answer, props.entry.total))

const remaining = computed(() =>
  props.entry.phase2Played && props.entry.remainingAnswer !== undefined
    ? step(props.entry.remainingAnswer, props.entry.remaining)
    : null
)

// A step 2 cut short by "Terminer la partie" doesn't count against the question
const isOk = computed(() => volee.value.ok && (remaining.value?.ok ?? true))

const remainingLabel = computed(() =>
  props.entry.phase2Played ? 'Reste · interrompue' : 'Reste · non jouée'
)
</script>

<template>
  <li class="recap-row">
    <span class="recap-row__chip" :class="isOk ? 'recap-row__chip--ok' : 'recap-row__chip--ko'">
      <AppIcon :name="isOk ? 'check' : 'close'" :width="22" :height="22" />
    </span>

    <div class="recap-row__info">
      <span class="recap-row__name"><span class="recap-row__muted">Q{{ index }} - </span> {{ entry.label }}</span>
      <span class="recap-row__score">Reste <span class="recap-row__score-value">{{ entry.score }}</span></span>
    </div>

    <div class="recap-row__answers">
      <div class="recap-row__line">
        <span v-if="doubleValidation" class="recap-row__line-label">Volée</span>
        <span class="recap-row__answer" :class="volee.ok ? 'recap-row__answer--ok' : 'recap-row__answer--ko'">{{ volee.answer }}</span>
        <span v-if="volee.fix !== null" class="recap-row__answer recap-row__answer--fix">→ {{ volee.fix }}</span>
      </div>

      <div v-if="doubleValidation" class="recap-row__line">
        <template v-if="remaining">
          <span class="recap-row__line-label">Nouveau reste</span>
          <span class="recap-row__answer" :class="remaining.ok ? 'recap-row__answer--ok' : 'recap-row__answer--ko'">{{ remaining.answer }}</span>
          <span v-if="remaining.fix !== null" class="recap-row__answer recap-row__answer--fix">→ {{ remaining.fix }}</span>
        </template>
        <template v-else>
          <span class="recap-row__line-label">{{ remainingLabel }}</span>
          <span class="recap-row__answer recap-row__muted">—</span>
        </template>
      </div>
    </div>
  </li>
</template>

<style lang="scss" scoped>
.recap-row {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: $padding-sm;
  border-radius: $radius-sm;
  background: $surface;

  &__chip {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: $radius-sm;
    color: $white;

    &--ok { background: $accent; }
    &--ko { background: $error; }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__name {
    @include title-md;
    line-height: 1.1;
  }

  &__muted {
    color: $muted;
  }

  &__score {
    @include text-xs;
    text-transform: uppercase;
    letter-spacing: $tracking-sm;
    color: $muted;
  }

  &__score-value {
    @include title-sm;
    color: $text-color;
  }

  &__answers {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    flex-shrink: 0;
  }

  &__line {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: $gap-xs;
  }

  &__line-label {
    @include text-xxs;
    text-transform: uppercase;
    letter-spacing: $tracking-sm;
    color: $muted;
  }

  &__answer {
    @include title-xl;
    line-height: 1;

    &--ok  { color: $accent; }
    &--ko  { color: $error; text-decoration: line-through; }
    &--fix { color: $accent; }
  }
}

@media (min-width: $bp-laptop) {
  .recap-row {
    padding: $padding-sm $padding-md;

    &__chip   { width: 48px; height: 48px; }
    &__name   { @include title-xl; }
    &__score  { @include text-sm; }
    &__answer { @include title-xxl; }
    &__line-label { @include text-xs; }
  }
}
</style>
