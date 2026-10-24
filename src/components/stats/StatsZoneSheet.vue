<script setup>
import AppIcon from '../AppIcon.vue'
import AppModal from '../AppModal.vue'

const props = defineProps({
  show:       { type: Boolean, required: true },
  // [{ id, label, zones: [{ key, label, color, sessions, accuracy }] }]
  categories: { type: Array,   required: true },
  selected:   { type: Array,   required: true }, // zone keys
})

const emit = defineEmits(['close', 'toggle', 'toggle-category', 'clear'])

function isFull(cat) {
  return cat.zones.every(z => props.selected.includes(z.key))
}

function selectedZones() {
  return props.categories.flatMap(c => c.zones).filter(z => props.selected.includes(z.key))
}
</script>

<template>
  <AppModal :show="show" title="Zones à comparer" size="lg" centered width="760px" @close="emit('close')">
    <div class="zone-sheet">
      <div class="zone-sheet__selection">
        <span class="zone-sheet__caption">Sélection · {{ selected.length }} courbe{{ selected.length > 1 ? 's' : '' }}</span>
        <div class="zone-sheet__tags">
          <button
            v-for="z in selectedZones()" :key="z.key"
            class="zone-sheet__tag" :style="{ background: z.color }"
            :aria-label="`Retirer ${z.label}`" @click="emit('toggle', z.key)"
          >
            {{ z.label }}
            <AppIcon name="close" :width="12" :height="12" />
          </button>
        </div>
      </div>

      <div class="zone-sheet__groups">
        <section v-for="cat in categories" :key="cat.id" class="zone-sheet__group">
          <div class="zone-sheet__head">
            <span class="zone-sheet__title">{{ cat.label }}</span>
            <button class="zone-sheet__all" :aria-pressed="isFull(cat)" @click="emit('toggle-category', cat)">
              {{ isFull(cat) ? 'Tout retirer' : 'Tout sélectionner' }}
            </button>
          </div>
          <div class="zone-sheet__list">
            <label
              v-for="z in cat.zones" :key="z.key"
              class="zone-sheet__row" :class="{ 'zone-sheet__row--on': selected.includes(z.key) }"
            >
              <input
                type="checkbox" class="zone-sheet__input"
                :checked="selected.includes(z.key)" @change="emit('toggle', z.key)"
              >
              <span class="zone-sheet__dot" :style="{ background: z.color }" />
              <span class="zone-sheet__label">{{ z.label }}</span>
              <span class="zone-sheet__count">{{ z.sessions }} séance{{ z.sessions > 1 ? 's' : '' }}</span>
              <span class="zone-sheet__accuracy">{{ z.accuracy }} %</span>
              <span
                class="zone-sheet__box"
                :style="selected.includes(z.key) ? { background: z.color, borderColor: z.color } : {}"
              >
                <AppIcon v-if="selected.includes(z.key)" name="check" :width="16" :height="16" />
              </span>
            </label>
          </div>
        </section>
      </div>

      <div class="zone-sheet__footer">
        <button class="zone-sheet__clear" :disabled="!selected.length" @click="emit('clear')">
          Tout désélectionner
        </button>
        <button class="zone-sheet__done" @click="emit('close')">
          {{ selected.length ? `Afficher ${selected.length} zone${selected.length > 1 ? 's' : ''}` : 'Fermer' }}
        </button>
      </div>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.zone-sheet {
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__selection {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding-bottom: $padding-sm;
    border-bottom: $border-sm solid $border-color;
  }

  &__caption {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    color: $muted;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__tag {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 $padding-xs 0 10px;
    border-radius: $radius-sm;
    color: $white;
    @include title-sm;
    text-transform: uppercase;
  }

  &__groups {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    @include title-sm;
    text-transform: uppercase;
    color: $muted;
  }

  &__all {
    height: 32px;
    padding: 0 $padding-xxs;
    @include text-xs;
    font-weight: 600;
    color: $text-color;
    text-decoration: underline;
  }

  &__list {
    overflow: hidden;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__row {
    display: grid;
    grid-template-columns: 12px 56px 1fr auto 24px;
    align-items: center;
    gap: $gap-sm;
    min-height: 48px;
    padding: 0 $padding-sm;
    cursor: pointer;

    & + & { border-top: $border-sm solid $border-color; }

    &--on { background: $white; }
  }

  &__input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }

  &__dot {
    width: 12px;
    height: 12px;
    border-radius: $radius-xs;
  }

  &__label {
    @include title-xl;
    line-height: 1;
    text-transform: uppercase;
  }

  &__count {
    @include text-xs;
    color: $muted;
  }

  &__accuracy {
    @include title-md;
    line-height: 1;
    text-align: right;
  }

  &__box {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 24px;
    height: 24px;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $white;
    color: $white;
  }

  &__footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: $gap-xs;
  }

  &__clear,
  &__done {
    height: 56px;
    border-radius: $radius-sm;
    text-transform: uppercase;
  }

  &__clear {
    border: $border-md solid $black;
    color: $text-color;
    @include title-md;

    &:disabled { opacity: 0.4; }
  }

  &__done {
    background: $blue;
    color: $white;
    @include title-xl;
  }
}

@media (min-width: $bp-laptop) {
  .zone-sheet {
    &__groups {
      display: grid;
      grid-template-rows: repeat(2, auto);
      grid-auto-columns: minmax(0, 1fr);
      grid-auto-flow: column;
      align-items: start;
      gap: $gap-lg;
    }

    &__footer {
      display: flex;
      justify-content: flex-end;
    }

    &__clear,
    &__done { padding: 0 $padding-xl; }
    &__done { padding: 0 $padding-xxl; }
  }
}
</style>
