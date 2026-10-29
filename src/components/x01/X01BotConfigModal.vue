<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '../AppModal.vue'
import OptionTile from '../OptionTile.vue'
import AppButton from '../AppButton.vue'
import StepScale from '../StepScale.vue'
import { AI_LEVELS } from '../../composables/useX01AI.js'

const props = defineProps({
  show:       { type: Boolean, required: true },
  modelValue: { type: Object, default: null }, // existing profile when editing, null when creating
})

const emit = defineEmits(['close', 'confirm'])

const AVG_STEPS      = AI_LEVELS.map(l => l.avgVolley)
const CHECKOUT_STEPS = AI_LEVELS.map(l => Math.round(l.checkoutRate * 100))

const level      = ref(5)
const customMode = ref(false)
const customAvg  = ref(5)
const customCo   = ref(5)

function resetFromModelValue() {
  const p = props.modelValue
  level.value      = p?.level ?? 5
  customMode.value = !p?.level && !!p
  customAvg.value  = AI_LEVELS.findIndex(l => l.avgVolley === p?.avgVolley) + 1 || 5
  customCo.value   = AI_LEVELS.findIndex(l => l.checkoutRate === p?.checkoutRate) + 1 || 5
}

watch(() => props.show, (show) => {
  if (show) resetFromModelValue()
})

const profile = computed(() => {
  if (customMode.value) {
    return {
      level:        null,
      label:        'Custom',
      avgVolley:    AI_LEVELS[customAvg.value - 1].avgVolley,
      checkoutRate: AI_LEVELS[customCo.value - 1].checkoutRate,
    }
  }
  return AI_LEVELS[level.value - 1]
})

// A step covers half the gap to each neighbour: "68 – 78 pts" reads better than a lone 73
function stepRange(values, step, unit) {
  const i = step - 1
  const low  = i > 0 ? Math.round((values[i - 1] + values[i]) / 2) : values[i]
  const high = i < values.length - 1 ? Math.round((values[i] + values[i + 1]) / 2) : values[i]
  return `${low} – ${high} ${unit}`
}

// The custom bot is compared to the closest preset level by its average
const closestLevel = computed(() => AI_LEVELS[customAvg.value - 1])
</script>

<template>
  <AppModal :show="show" title="DartBot" size="lg" centered @close="emit('close')">
    <div class="bot-config">
      <div v-if="customMode" class="bot-config__card">
        <div class="bot-config__card-head">
          <span class="bot-config__card-title">Profil custom</span>
          <span class="bot-config__card-note">≈ niveau {{ closestLevel.level }} · {{ closestLevel.label }}</span>
        </div>
        <div class="bot-config__effects">
          <span class="bot-config__effect">
            <span class="bot-config__effect-value">≈ {{ profile.avgVolley }} pts</span>
            de moyenne par volée
          </span>
          <span class="bot-config__effect">
            <span class="bot-config__effect-value">≈ {{ Math.round(profile.checkoutRate * 100) }} %</span>
            des checkouts réussis
          </span>
        </div>
      </div>

      <div v-else class="bot-config__card bot-config__card--level">
        <span class="bot-config__level">{{ level }}</span>
        <span class="bot-config__level-info">
          <span class="bot-config__card-title">{{ profile.label }}</span>
          <span class="bot-config__card-note">
            Moy. {{ profile.avgVolley }} pts/volée · {{ Math.round(profile.checkoutRate * 100) }} % aux checkouts
          </span>
        </span>
      </div>

      <template v-if="customMode">
        <section class="bot-config__section">
          <div class="bot-config__head">
            <span class="bot-config__label">Moyenne par volée</span>
            <span class="bot-config__value">{{ stepRange(AVG_STEPS, customAvg, 'pts') }}</span>
          </div>
          <StepScale v-model="customAvg" label="la moyenne" />
          <p class="bot-config__hint">Plus haut : le bot marque plus à chaque volée et descend plus vite à 0</p>
        </section>

        <section class="bot-config__section">
          <div class="bot-config__head">
            <span class="bot-config__label">Taux de checkout</span>
            <span class="bot-config__value">{{ stepRange(CHECKOUT_STEPS, customCo, '%') }}</span>
          </div>
          <StepScale v-model="customCo" label="le taux de checkout" />
          <p class="bot-config__hint">Plus haut : le bot rate moins ses doubles de fin et ferme plus vite</p>
        </section>
      </template>

      <section v-else class="bot-config__section">
        <div class="bot-config__head">
          <span class="bot-config__label">Niveau</span>
          <span class="bot-config__hint">1 = débutant · 10 = pro</span>
        </div>
        <StepScale v-model="level" numbered label="Niveau" />
      </section>

      <section class="bot-config__section">
        <span class="bot-config__label">Options</span>
        <OptionTile
          v-model="customMode"
          tone="green"
          title="Niveau custom"
          description="Définis toi-même la moyenne par volée et le taux de checkout du DartBot"
        />
      </section>

      <AppButton size="cta" icon-end="arrow-right" tone="green" @click="emit('confirm', profile); emit('close')">Valider</AppButton>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.bot-config {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;

  &__card {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: $padding-md;
    border-radius: $radius-sm;
    background: $black;
    color: $bg;

    &--level {
      flex-direction: row;
      align-items: center;
      gap: $gap-md;
    }
  }

  &__card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__card-title {
    @include title-xl;
    line-height: 1;
  }

  &__card-note {
    @include text-sm;
    opacity: 0.75;
  }

  &__level {
    @include display-xs;
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $accent;
    line-height: 1;
  }

  &__level-info {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__effects {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__effect {
    @include text-xs;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: $padding-xs;
    border-radius: $radius-sm;
    background: rgba($bg, 0.08);
    line-height: 1.3;
  }

  &__effect-value {
    @include title-xxl;
    line-height: 1;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__label {
    @include title-sm;
    color: $muted;
  }

  &__value {
    @include title-lg;
    color: $accent;
  }

  &__hint {
    @include text-xs;
    color: $muted;
    line-height: 1.3;
  }
}

@media (min-width: $bp-laptop) {
  .bot-config {
    &__card-title { @include title-xxl; line-height: 1; }
    &__card-note { @include text-md; }
    &__level { width: 72px; height: 72px; }
    &__effect { @include text-sm; line-height: 1.3; }
    &__effect-value { @include title-xxxl; line-height: 1; }
    &__label { @include title-md; }
    &__value { @include title-xl; }
    &__hint { @include text-sm; line-height: 1.3; }
  }
}
</style>
