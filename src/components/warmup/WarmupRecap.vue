<script setup>
import { computed } from 'vue'
import { formatZoneLabel } from '../../composables/useWarmup.js'
import AppButton from '../AppButton.vue'

const props = defineProps({
  zoneRecapStats: { type: Array, required: true },
  sessionStats: { type: Object, required: true },
})

const emit = defineEmits(['restart', 'home'])

// Même logique de couleurs que DartChip
const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

function cardStyle(zone) {
  const isRed = RED_NUMBERS.has(zone.sector)

  // Zones noires : Tout (A / AB) et simples secteurs rouges
  if (zone.type === 'A' || zone.type === 'AB') {
    return { '--card-bg': '#000000', '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.55)', '--card-sep': 'rgba(255,255,255,0.12)' }
  }
  if (zone.type === 'S' && isRed) {
    return { '--card-bg': 'var(--dart-black)', '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.55)', '--card-sep': 'rgba(255,255,255,0.12)' }
  }

  // Simples clairs et Bull → beige
  if (zone.type === 'S' || zone.type === 'B' || zone.type === 'SB' || zone.sector === null) {
    return { '--card-bg': 'var(--dart-cream)', '--card-text': 'var(--dart-cream-text)', '--card-muted': 'rgba(0,0,0,0.4)', '--card-sep': 'rgba(0,0,0,0.12)' }
  }

  // Doubles et triples → rouge ou vert selon le secteur
  return isRed
    ? { '--card-bg': 'var(--dart-red)',   '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.7)', '--card-sep': 'rgba(255,255,255,0.25)' }
    : { '--card-bg': 'var(--dart-green)', '--card-text': '#ffffff', '--card-muted': 'rgba(255,255,255,0.7)', '--card-sep': 'rgba(255,255,255,0.25)' }
}

function fmtDuration(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m} min ${sec}s` : `${sec}s`
}

function zoneLabel(zone) {
  return formatZoneLabel(zone).trim()
}

const totalDurationMs = computed(() =>
  props.zoneRecapStats.reduce((sum, zs) => sum + zs.durationMs, 0)
)
</script>

<template>
  <div class="recap">
    <!-- Titre -->
    <h1 class="recap__title">SESSION TERMINÉE</h1>

    <!-- Cards par zone -->
    <div class="recap__zones">
      <div v-for="zs in zoneRecapStats" :key="`${zs.zone.sector}-${zs.zone.type}`" class="recap__zone-card"
        :style="cardStyle(zs.zone)">
        <div class="recap__zone-header">
          <span class="recap__zone-name">Zone travaillée : {{ zoneLabel(zs.zone) }}</span>
          <span class="recap__zone-acc">{{ zs.accuracy }}%</span>
        </div>

        <div class="recap__zone-stats">
          <div class="recap__zone-stat">
            <span class="recap__zone-stat-val">{{ fmtDuration(zs.durationMs) }}</span>
            <span class="recap__zone-stat-lbl">Temps</span>
          </div>
          <div class="recap__zone-sep" />
          <div class="recap__zone-stat">
            <span class="recap__zone-stat-val">{{ zs.total }}</span>
            <span class="recap__zone-stat-lbl">Jetées</span>
          </div>
          <div class="recap__zone-sep" />
          <div class="recap__zone-stat">
            <span class="recap__zone-stat-val">{{ zs.hits }}</span>
            <span class="recap__zone-stat-lbl">Touchées</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Total session -->
    <div class="recap__total">
      <div class="recap__total-title">TOTAL DE SESSION</div>
      <div class="recap__total-grid">
        <div class="recap__total-cell">
          <span class="recap__total-val">{{ fmtDuration(totalDurationMs) }}</span>
          <span class="recap__total-lbl">Temps</span>
        </div>
        <div class="recap__total-cell">
          <span class="recap__total-val">{{ sessionStats.total }}</span>
          <span class="recap__total-lbl">Jetées</span>
        </div>
        <div class="recap__total-cell">
          <span class="recap__total-val">{{ sessionStats.hits }}</span>
          <span class="recap__total-lbl">Touchées</span>
        </div>
        <div class="recap__total-cell">
          <span class="recap__total-val">{{ sessionStats.accuracy }}%</span>
          <span class="recap__total-lbl">Précision</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="recap__actions">
      <AppButton @click="emit('restart')">Recommencer</AppButton>
      <AppButton variant="secondary" @click="emit('home')">Accueil</AppButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.recap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  padding-bottom: $padding-md;

  &__title {
    @include title-xxl;
    color: $white;
    text-align: center;
    flex-shrink: 0;
  }

  // ── Zone cards ──────────────────────────────────
  &__zones {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    flex: 1;
  }

  &__zone-card {
    background: var(--card-bg);
    border-radius: $radius-sm;
    padding: $padding-sm;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    border: $border-md solid $white;
  }

  &__zone-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__zone-name {
    @include title-lg;
    color: var(--card-text);
  }

  &__zone-acc {
    @include title-xl;
    color: var(--card-text);
    font-variant-numeric: tabular-nums;
  }

  &__zone-stats {
    display: flex;
    align-items: center;
  }

  &__zone-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 $padding-md;

    &-val {
      @include title-lg;
      color: var(--card-text);
      font-variant-numeric: tabular-nums;
    }

    &-lbl {
      @include text-sm;
      color: $white;
    }
  }

  &__zone-sep {
    width: 1px;
    height: 32px;
    background: var(--card-sep);
    flex-shrink: 0;
  }

  // ── Total session ────────────────────────────────
  &__total {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__total-title {
    @include title-xl;
    color: $white;
    text-align: center;
  }

  &__total-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;

    > :nth-child(odd) {
      border-right: $border-md solid $white;
    }

    > :nth-child(-n+2) {
      border-bottom: $border-md solid $white;
    }
  }

  &__total-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
    padding: $padding-md;
  }

  &__total-val {
    @include title-xl;
    color: $white;
    font-variant-numeric: tabular-nums;
  }

  &__total-lbl {
    @include text-sm;
    color: $white;
  }

  // ── Boutons ──────────────────────────────────────
  &__actions {
    display: flex;
    gap: $gap-xs;
    width: 100%;

    :deep(.btn) { flex: 1; }
  }
}

@media (min-width: $bp-laptop) {
  .recap {
    &__title         { @include title-xxxl; }
    &__zone-card     { padding: $padding-md; gap: $gap-sm; }
    &__zone-name     { @include title-xl; }
    &__zone-acc      { @include title-xxl; }
    &__zone-stat-val { @include title-xl; }
    &__zone-stat-lbl { @include text-md; }
    &__zone-sep      { height: 48px; }
    &__total-title   { @include title-xxl; }
    &__total-cell    { padding: $padding-lg; }
    &__total-val     { @include title-xxl; }
    &__total-lbl     { @include text-md; }
  }
}
</style>
