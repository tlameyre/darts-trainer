<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  caption:   { type: String, required: true },   // "Dernière session · hier"
  duration:  { type: String, default: null },
  title:     { type: String, required: true },
  tags:      { type: Array,  default: () => [] }, // chips next to the title (zones, start score…)
  // [{ value, label }] — the first one is the big figure
  metrics:   { type: Array,  default: () => [] },
  color:     { type: String, required: true },
  action:    { type: String, default: 'Relancer les mêmes réglages' },
})

defineEmits(['relaunch', 'stats'])
</script>

<template>
  <section class="last-session" :style="{ '--hero-color': color }" aria-label="Reprendre">
    <div class="last-session__meta">
      <span class="last-session__caption">{{ caption }}</span>
      <span v-if="duration" class="last-session__duration">{{ duration }}</span>
    </div>

    <div class="last-session__main">
      <div class="last-session__id">
        <span class="last-session__title">{{ title }}</span>
        <span v-if="tags.length" class="last-session__tags">
          <span v-for="tag in tags" :key="tag" class="last-session__tag">{{ tag }}</span>
        </span>
      </div>

      <dl v-if="metrics.length" class="last-session__metrics">
        <div v-for="m in metrics" :key="m.label" class="last-session__metric">
          <dd class="last-session__metric-value">{{ m.value }}</dd>
          <dt class="last-session__metric-label">{{ m.label }}</dt>
        </div>
      </dl>
    </div>

    <button class="last-session__relaunch" @click="$emit('relaunch')">
      <AppIcon name="play" :width="18" :height="18" />
      {{ action }}
    </button>
    <button class="last-session__stats" @click="$emit('stats')">
      Voir les stats
      <AppIcon name="angle-down" :width="20" :height="20" class="last-session__stats-icon" />
    </button>
  </section>
</template>

<style lang="scss" scoped>
.last-session {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  padding: $padding-md;
  border-radius: $radius-sm;
  background: var(--hero-color);
  color: $white;

  &__meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__caption {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.85;
  }

  &__duration {
    @include text-xs;
    opacity: 0.85;
  }

  &__main {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__id {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    min-width: 0;
  }

  &__title {
    @include title-xxxl;
    line-height: 0.9;
    text-transform: uppercase;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__tag {
    padding: 2px $padding-xs;
    border-radius: $radius-sm;
    background: $white;
    color: var(--hero-color);
    @include title-sm;
    line-height: 1.3;
    text-transform: uppercase;
  }

  &__metrics {
    display: flex;
    gap: $gap-md;
    margin: 0;
  }

  &__metric {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    &:not(:first-child) { display: none; }
  }

  &__metric-value {
    @include title-xxxl;
    margin: 0;
    line-height: 0.9;
    text-transform: uppercase;
  }

  &__metric-label {
    @include text-xs;
    opacity: 0.85;
  }

  &__relaunch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    height: 48px;
    border-radius: $radius-sm;
    background: $white;
    color: var(--hero-color);
    @include title-md;
    text-transform: uppercase;
  }

  &__stats { display: none; }
}

@media (min-width: $bp-laptop) {
  .last-session {
    gap: $gap-md;
    padding: $padding-lg;

    &__caption,
    &__duration { @include text-sm; }

    &__main {
      flex-direction: column;
      align-items: stretch;
      gap: $gap-md;
    }

    &__title { @include display-xs; }
    &__tag { @include title-md; padding: 3px $padding-sm; }

    &__metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: $gap-sm;
      padding-top: 14px;
      border-top: $border-md solid rgba($white, 0.3);
    }

    &__metric {
      align-items: flex-start;
      &:not(:first-child) { display: flex; }
    }

    &__metric-value { @include display-xs; }
    &__metric-label { @include text-sm; }

    &__relaunch { height: 56px; @include title-lg; }

    &__stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 44px;
      border: $border-md solid rgba($white, 0.5);
      border-radius: $radius-sm;
      color: $white;
      @include title-sm;
      text-transform: uppercase;
    }

    &__stats-icon { transform: rotate(-90deg); }
  }
}
</style>
