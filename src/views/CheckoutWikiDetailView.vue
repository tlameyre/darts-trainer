<script setup>
import { computed, shallowRef, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import CheckoutBoardRoute from '../components/checkout/CheckoutBoardRoute.vue'
import CheckoutRouteCard from '../components/checkout/CheckoutRouteCard.vue'
import { CHECKOUT_SCORES, bracketOf, getCheckout } from '../composables/useCheckouts.js'

const route = useRoute()
const router = useRouter()

const score = computed(() => Number(route.params.score))
const checkout = computed(() => getCheckout(score.value))

const bracketTag = computed(() => {
  const b = bracketOf(score.value)
  return b ? `${b.label} · ${b.points} pt${b.points > 1 ? 's' : ''}` : null
})

// Score inconnu (impossible ou hors barème) : retour à la liste.
watchEffect(() => {
  if (route.name === 'checkout-wiki-detail' && !checkout.value) {
    router.replace({ name: 'checkout-wiki' })
  }
})

// Route affichée sur la cible — remise sur la recommandée à chaque score.
const selectedRoute = shallowRef(null)
watch(
  score,
  () => { selectedRoute.value = checkout.value?.primary ?? null },
  { immediate: true },
)

const idx = computed(() => CHECKOUT_SCORES.indexOf(score.value))
const prevScore = computed(() => (idx.value > 0 ? CHECKOUT_SCORES[idx.value - 1] : null))
const nextScore = computed(() =>
  idx.value >= 0 && idx.value < CHECKOUT_SCORES.length - 1 ? CHECKOUT_SCORES[idx.value + 1] : null,
)

function goto(target) {
  if (target == null) return
  router.replace({ name: 'checkout-wiki-detail', params: { score: target } })
}

// Préc./suiv. utilisent `replace` : un seul retour ramène à la liste.
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'checkout-wiki' })
}
</script>

<template>
  <div v-if="checkout" class="co-detail">
    <AppHeader title="Checkout" tone="ink" @back="goBack" />

    <main class="co-detail__main">
      <div class="co-detail__card">
        <div class="co-detail__band">
          <span class="co-detail__band-score">
            <span class="co-detail__kicker">Reste à finir</span>
            <span class="co-detail__score">{{ score }}</span>
          </span>
          <span v-if="bracketTag" class="co-detail__tag">{{ bracketTag }}</span>
        </div>
        <div class="co-detail__board">
          <CheckoutBoardRoute :route="selectedRoute || []" tone="ink" />
        </div>
      </div>

      <div class="co-detail__side">
        <div class="co-detail__routes">
          <span class="co-detail__label">Routes · clique pour l'afficher sur la cible</span>
          <CheckoutRouteCard
            :checkout="checkout"
            selectable
            tone="ink"
            :selected="selectedRoute"
            @select="selectedRoute = $event"
          />
        </div>

        <nav class="co-detail__nav">
          <button type="button" class="co-detail__nav-btn" :disabled="prevScore == null" @click="goto(prevScore)">
            <AppIcon name="arrow-left" :width="20" :height="20" />
            {{ prevScore ?? '—' }}
          </button>
          <button type="button" class="co-detail__nav-btn" :disabled="nextScore == null" @click="goto(nextScore)">
            {{ nextScore ?? '—' }}
            <AppIcon name="arrow-right" :width="20" :height="20" />
          </button>
        </nav>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.co-detail {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;

  &__main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: $padding-md $padding-md 0;
    @include safe-bottom($padding-xl);
  }

  // Mobile: the board is a full-width square that always stays visible
  &__card {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__band {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    border-radius: $radius-sm;
    background: $black;
    color: $bg;
  }

  &__band-score {
    display: flex;
    flex-direction: column;
  }

  &__kicker {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.7;
  }

  &__score {
    @include display-xs;
    line-height: 0.9;
    font-variant-numeric: tabular-nums;
  }

  &__tag {
    margin-left: auto;
    padding: 2px $padding-xs;
    border-radius: $radius-sm;
    background: rgba($bg, 0.16);
    @include title-sm;
  }

  &__board {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    justify-content: center;
    container-type: size;
  }

  // Routes fill what is left under the board, score navigation stays at the bottom
  &__side {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  // Long route lists scroll inside, the board keeps its room
  &__routes {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    overflow-y: auto;
  }

  &__label {
    display: none;
    @include title-sm;
    color: $muted;
  }

  &__nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__nav-btn {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    border: $border-md solid $text-color;
    border-radius: $radius-sm;
    color: $text-color;
    @include title-lg;
    font-variant-numeric: tabular-nums;
    transition: opacity 0.15s;

    &:active { opacity: 0.7; }
    &:disabled { opacity: 0.3; pointer-events: none; }
  }
}

@media (min-width: $bp-laptop) {
  // Board card on the left, routes and score navigation on the right
  .co-detail {
    &__main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 440px;
      gap: $gap-xxl + $gap-xs;
      padding: $padding-xxl $padding-xxl 0;
      @include safe-bottom($padding-xxl);
    }

    &__card {
      flex-shrink: 1;
      min-height: 0;
      gap: 0;
      border-radius: $radius-sm;
      background: $surface;
      overflow: hidden;
    }

    &__band {
      gap: $gap-md;
      padding: $padding-md $padding-xl;
      border-radius: 0;
    }

    &__kicker { @include text-sm; }
    &__score  { @include display-md; }
    &__tag    { padding: $padding-xxs $padding-xs; @include title-lg; }
    &__board  { flex: 1; min-height: 0; width: auto; aspect-ratio: auto; padding: $padding-sm; }

    &__side {
      min-height: 0;
      gap: $gap-xl;
    }

    &__label { display: block; }

    &__nav { gap: $gap-sm; }

    &__nav-btn { height: 64px; @include title-xxl; }
  }
}
</style>
