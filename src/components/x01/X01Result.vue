<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import StatCell from '../StatCell.vue'

const props = defineProps({
  stats:       { type: Object,  default: null },
  legsPlayed:  { type: Number,  required: true },
  startScore:  { type: Number,  required: true },
  aiWon:       { type: Boolean, default: false },
  aiLegsWon:   { type: Number,  default: 0 },
  aiStats:     { type: Object,  default: null },
  hideActions: { type: Boolean, default: false },
})

defineEmits(['replay', 'home'])

const sliderEl   = ref(null)
const currentTab = ref(0)
const TAB_COUNT  = 3
const VOLLEY_BUCKETS = ['180', '160', '140', '120', '100', '80', '60', '40']

const checkoutPct = computed(() => {
  if (!props.stats?.doublesAttempted) return null
  return Math.round((props.stats.doublesHit / props.stats.doublesAttempted) * 100)
})

const totalVolleyCount = computed(() =>
  Math.max(1, VOLLEY_BUCKETS.reduce((sum, k) => sum + (props.stats?.volleyDistribution?.[k] ?? 0), 0))
)

const totalAiVolleyCount = computed(() =>
  Math.max(1, VOLLEY_BUCKETS.reduce((sum, k) => sum + (props.aiStats?.volleyDistribution?.[k] ?? 0), 0))
)

const distribMax = computed(() =>
  Math.max(1, ...VOLLEY_BUCKETS.map(k =>
    Math.max(
      props.stats?.volleyDistribution?.[k] ?? 0,
      props.aiStats?.volleyDistribution?.[k] ?? 0,
    )
  ))
)

let rafId = null
function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    if (!sliderEl.value) return
    currentTab.value = Math.round(sliderEl.value.scrollLeft / sliderEl.value.offsetWidth)
  })
}

function goToTab(idx) {
  sliderEl.value?.scrollTo({ left: idx * sliderEl.value.offsetWidth, behavior: 'smooth' })
}

onMounted(() => sliderEl.value?.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => sliderEl.value?.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="result">

    <div class="result__top">
      <div class="result__emoji">{{ aiWon ? '🤖' : '🏆' }}</div>
      <h2 class="result__title" :class="{ 'result__title--ai': aiWon }">
        {{ aiWon ? 'L\'IA a gagné la partie !' : 'Bien joué !' }}
      </h2>
      <p class="result__subtitle">
        {{ startScore }} pts ·
        <template v-if="aiWon">
          {{ aiLegsWon }} manche{{ aiLegsWon > 1 ? 's' : '' }} remportée{{ aiLegsWon > 1 ? 's' : '' }} par l'IA
        </template>
        <template v-else>
          {{ legsPlayed }} manche{{ legsPlayed > 1 ? 's' : '' }}
        </template>
      </p>
    </div>

    <div v-if="stats || aiStats" class="result__tabs">

      <div class="result__dots">
        <button
          v-for="i in TAB_COUNT"
          :key="i"
          class="result__dot"
          :class="{ 'result__dot--active': currentTab === i - 1 }"
          @click="goToTab(i - 1)"
          :aria-label="`Onglet ${i}`"
        />
      </div>

      <div class="result__slider" ref="sliderEl">

        <!-- Tab 1 : Stats globales du joueur -->
        <div class="result__slide">
          <p class="result__slide-title">Stats globales</p>
          <div v-if="stats" class="result__grid">
            <StatCell :value="stats.avgVolley" label="Moy. par volée" />
            <StatCell :value="stats.avg9darts || '–'" label="Moy. 9 fléchettes" />
            <StatCell :value="`${stats.doublesHit}/${stats.doublesAttempted || '?'}`" label="Aux doubles" />
            <StatCell :value="checkoutPct != null ? checkoutPct + ' %' : '–'" label="% de finish" />
            <StatCell :value="stats.highestFinish || '–'" label="Plus haut finish" />
            <StatCell :value="stats.highestVolley || '–'" label="Meilleure volée" />
            <StatCell v-if="stats.bestLeg" :value="`${stats.bestLeg.darts} fléchettes`" label="Meilleure manche" />
            <StatCell v-if="stats.worstLeg" :value="`${stats.worstLeg.darts} fléchettes`" label="Pire manche" />
          </div>
          <p v-else class="result__no-stats result__no-stats--inline">
            Aucune volée enregistrée.
          </p>
        </div>

        <!-- Tab 2 : Distribution des volées -->
        <div class="result__slide">
          <p class="result__slide-title">Volées</p>

          <!-- Mode comparaison avec le bot -->
          <template v-if="aiStats">
            <div class="result__distrib-legend">
              <span class="result__distrib-legend-item">Toi</span>
              <span class="result__distrib-legend-item result__distrib-legend-item--ai">DartBot</span>
            </div>
            <div class="result__distrib">
              <div
                v-for="bucket in VOLLEY_BUCKETS"
                :key="bucket"
                class="result__distrib-row"
              >
                <span class="result__distrib-label">{{ bucket === '180' ? '180' : bucket + '+' }}</span>
                <div class="result__distrib-tracks">
                  <div class="result__distrib-track">
                    <div
                      class="result__distrib-bar"
                      :style="{ width: ((stats?.volleyDistribution?.[bucket] ?? 0) / distribMax * 100) + '%' }"
                    />
                  </div>
                  <div class="result__distrib-track">
                    <div
                      class="result__distrib-bar result__distrib-bar--ai"
                      :style="{ width: ((aiStats.volleyDistribution?.[bucket] ?? 0) / distribMax * 100) + '%' }"
                    />
                  </div>
                </div>
                <div class="result__distrib-counts">
                  <span class="result__distrib-count">{{ stats?.volleyDistribution?.[bucket] ?? 0 }}</span>
                  <span class="result__distrib-count result__distrib-count--ai">{{ aiStats.volleyDistribution?.[bucket] ?? 0 }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Mode solo -->
          <template v-else>
            <div class="result__distrib">
              <div
                v-for="bucket in VOLLEY_BUCKETS"
                :key="bucket"
                class="result__distrib-row"
              >
                <span class="result__distrib-label">{{ bucket === '180' ? '180' : bucket + '+' }}</span>
                <div class="result__distrib-track">
                  <div
                    class="result__distrib-bar"
                    :style="{ width: ((stats.volleyDistribution?.[bucket] ?? 0) / totalVolleyCount * 100) + '%' }"
                  />
                </div>
                <span class="result__distrib-count">{{ stats.volleyDistribution?.[bucket] ?? 0 }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Tab 3 : Progression par manche -->
        <div class="result__slide">
          <p class="result__slide-title">Par manche</p>

          <div v-if="aiStats" class="result__ai-summary">
            <span class="result__ai-summary-label">DartBot — moy.</span>
            <span class="result__ai-summary-val">{{ aiStats.avgVolley }}/volée</span>
          </div>

          <div v-if="stats?.legAverages?.length" class="result__legs">
            <div
              v-for="item in stats.legAverages"
              :key="item.leg"
              class="result__leg-row"
            >
              <span class="result__leg-num">M{{ item.leg }}</span>
              <div class="result__leg-track">
                <div
                  class="result__leg-bar"
                  :style="{ width: (item.avg / 180 * 100) + '%' }"
                />
              </div>
              <span class="result__leg-avg">{{ item.avg }}</span>
            </div>
          </div>
        </div>

      </div>

    </div>

    <p v-else class="result__no-stats">
      Tu n'as pas terminé de manche cette partie.
    </p>

    <div v-if="!hideActions" class="result__actions">
      <button class="result__btn result__btn--secondary" @click="$emit('home')">
        Retour au lobby
      </button>
      <button class="result__btn result__btn--primary" @click="$emit('replay')">
        Rejouer
      </button>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.result {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: $gap-lg;
  padding: $padding-lg 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &__top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
  }

  &__emoji  { @include display-xs; line-height: 1; }

  &__title {
    @include title-xxl;
    color: $white;
    text-align: center;

    &--ai { color: $orange; }
  }

  &__subtitle {
    @include text-sm;
    color: $muted;
    text-align: center;
  }

  // ── Wrapper dots + slider ─────────────────────────────────────────────────
  &__tabs {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  // ── Dots ─────────────────────────────────────────────────────────────────
  &__dots {
    display: flex;
    justify-content: center;
    gap: $gap-sm;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    background: rgba($white, 0.2);
    transition: background 0.2s, transform 0.2s;

    &--active {
      background: $orange;
      transform: scale(1.3);
    }
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  &__slider {
    flex: 1;
    min-height: 0;
    display: flex;
    overflow-x: scroll;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar { display: none; }
  }

  &__slide {
    scroll-snap-align: start;
    flex-shrink: 0;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__slide-title {
    @include title-xs;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: center;
  }

  // ── Tab 1 : stats grid ────────────────────────────────────────────────────
  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $gap-sm;
  }

  // ── Tab 2 : distribution des volées ──────────────────────────────────────
  &__distrib-legend {
    display: flex;
    justify-content: flex-end;
    gap: $gap-lg;
    padding-right: $padding-xs;
  }

  &__distrib-legend-item {
    @include title-xs;
    color: $orange;
    text-transform: uppercase;
    letter-spacing: 0.06em;

    &--ai { color: $blue; }
  }

  &__distrib {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__distrib-row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__distrib-label {
    @include title-sm;
    color: $muted;
    width: 36px;
    text-align: right;
    flex-shrink: 0;
  }

  &__distrib-tracks {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__distrib-track {
    flex: 1;
    height: 8px;
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    overflow: hidden;
  }

  &__distrib-bar {
    height: 100%;
    background: $orange;
    border-radius: $radius-pill;
    transition: width 0.4s ease;
    min-width: 0;

    &--ai { background: $blue; }
  }

  &__distrib-counts {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex-shrink: 0;
  }

  &__distrib-count {
    @include title-sm;
    color: $white;
    font-variant-numeric: tabular-nums;
    width: 24px;
    text-align: right;
    flex-shrink: 0;
    line-height: 8px;

    &--ai { color: $blue; }
  }

  // ── Tab 3 : par manche ────────────────────────────────────────────────────
  &__ai-summary {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xs $padding-sm;
    background: rgba($blue, 0.12);
    border-radius: $radius-sm;
    border-left: 3px solid $blue;
  }

  &__ai-summary-label {
    @include text-sm;
    color: $blue;
    flex: 1;
  }

  &__ai-summary-val {
    @include title-sm;
    color: $blue;
    font-variant-numeric: tabular-nums;
  }

  &__legs {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    overflow-y: auto;
  }

  &__leg-row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__leg-num {
    @include title-sm;
    color: $muted;
    width: 28px;
    flex-shrink: 0;
  }

  &__leg-track {
    flex: 1;
    height: 8px;
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    overflow: hidden;
  }

  &__leg-bar {
    height: 100%;
    background: $accent;
    border-radius: $radius-pill;
    transition: width 0.4s ease;
  }

  &__leg-avg {
    @include title-sm;
    color: $white;
    font-variant-numeric: tabular-nums;
    width: 28px;
    text-align: right;
    flex-shrink: 0;
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  &__no-stats {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-lg 0;

    &--inline { padding: $padding-md 0; }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  &__actions {
    display: flex;
    gap: $gap-md;
    margin-top: auto;
    padding: 0 $padding-md;
  }

  &__btn {
    flex: 1;
    padding: $padding-md;
    border-radius: $radius-sm;
    @include title-md;
    font-weight: 700;
    text-transform: uppercase;
    transition: opacity 0.15s;

    &:active { opacity: 0.75; }

    &--primary   { background: $orange; color: $white; }
    &--secondary { background: rgba($white, 0.08); color: $white; }
  }
}

@media (min-width: $bp-laptop) {
  .result {
    gap: $gap-xl;

    &__title    { @include display-xs; }
    &__subtitle { @include text-md; }

    &__slide    { padding: 0 $padding-xxl; }
    &__actions  { padding: 0 $padding-xxl; }

    &__grid { grid-template-columns: repeat(4, 1fr); gap: $gap-md; }

    &__slide-title { @include title-sm; }

    &__distrib-label { @include title-md; width: 44px; }
    &__distrib-count { @include title-md; width: 32px; line-height: 12px; }
    &__distrib-track { height: 12px; }

    &__leg-avg   { @include title-md; width: 36px; }
    &__leg-track { height: 12px; }

    &__btn { @include title-lg; }
  }
}
</style>
