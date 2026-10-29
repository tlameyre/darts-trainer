<script setup>
import { ref, watch } from 'vue'
import AppButton from '../AppButton.vue'
import AppIcon from '../AppIcon.vue'
import ZoneTypePicker from '../zone/ZoneTypePicker.vue'
import ZoneBoard from '../zone/ZoneBoard.vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  zones: { type: Array, required: true },
  // The change only applies once the current volley is over
  midVolley: Boolean,
})

const emit = defineEmits(['close', 'zone-change', 'finish', 'quit'])

const tempZones = ref([])

watch(() => props.show, (val) => {
  if (val) tempZones.value = props.zones.map(z => ({ ...z }))
}, { immediate: true })

function validate() {
  const changed = tempZones.value.length !== props.zones.length
    || tempZones.value.some((z, i) => z.sector !== props.zones[i].sector || z.type !== props.zones[i].type)
  if (changed) emit('zone-change', tempZones.value.map(z => ({ ...z })))
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="zone-sheet">
      <div v-if="show" class="zone-sheet">
        <div class="zone-sheet__backdrop" @click="emit('close')" />
        <div class="zone-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="zone-sheet-title">
          <span class="zone-sheet__handle" aria-hidden="true" />

          <header class="zone-sheet__header">
            <div class="zone-sheet__heading">
              <span v-if="midVolley" class="zone-sheet__caption">Après la volée en cours</span>
              <h2 id="zone-sheet-title" class="zone-sheet__title">Prochaine zone</h2>
            </div>
            <button class="zone-sheet__close" aria-label="Fermer" @click="emit('close')">
              <AppIcon name="close" :width="16" :height="16" />
            </button>
          </header>

          <div class="zone-sheet__body">
            <section class="zone-sheet__section">
              <h3 class="zone-sheet__label">Zones à travailler</h3>
              <ZoneTypePicker v-model="tempZones" multiple />
            </section>

            <section class="zone-sheet__section zone-sheet__section--board">
              <div class="zone-sheet__board-head">
                <h3 class="zone-sheet__label">Numéros</h3>
                <span class="zone-sheet__hint">Touche la cible</span>
              </div>
              <div class="zone-sheet__board">
                <ZoneBoard v-model="tempZones" multiple />
              </div>
            </section>
          </div>

          <div class="zone-sheet__actions">
            <AppButton size="md" variant="surface" @click="emit('close')">Annuler</AppButton>
            <AppButton size="md" tone="blue" @click="validate">Valider</AppButton>
          </div>

          <div class="zone-sheet__session">
            <AppButton variant="link" tone="muted" :block="false" icon="check" @click="emit('finish')">Terminer la session</AppButton>
            <AppButton variant="link" tone="danger" :block="false" icon="exit" @click="emit('quit')">Quitter sans sauvegarder</AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.zone-sheet {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba($black, 0.55);
  }

  &__panel {
    position: relative;
    width: 100%;
    max-height: 100dvh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding: $padding-xs $padding-md calc(#{$padding-xl} + env(safe-area-inset-bottom));
    border-radius: $radius-lg $radius-lg 0 0;
    background: $bg;
    color: $text-color;
  }

  &__handle {
    align-self: center;
    width: 40px;
    height: 4px;
    border-radius: $radius-xs;
    background: $border-color;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__heading {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__caption {
    @include text-xs;
    text-transform: uppercase;
    letter-spacing: $tracking-lg;
    color: $muted;
  }

  &__title {
    @include title-xxl;
    line-height: 1;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    color: $black;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__label {
    @include title-sm;
    color: $muted;
  }

  &__board-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__hint {
    @include title-sm;
    color: $blue;
  }

  &__board {
    width: 100%;
    max-width: 280px;
    aspect-ratio: 1;
    margin: 0 auto;
  }

  &__actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    gap: $gap-xs;
  }

  &__session {
    display: flex;
    justify-content: center;
    gap: $gap-lg;
  }
}

.zone-sheet-enter-active,
.zone-sheet-leave-active {
  transition: opacity 0.2s;

  .zone-sheet__panel {
    transition: transform 0.25s ease;
  }
}

.zone-sheet-enter-from,
.zone-sheet-leave-to {
  opacity: 0;

  .zone-sheet__panel {
    transform: translateY(100%);
  }
}

@media (min-width: $bp-laptop) {
  .zone-sheet {
    align-items: center;
    justify-content: center;

    &__panel {
      width: 900px;
      max-width: calc(100% - #{$padding-xxl} * 2);
      gap: $gap-xl;
      padding: $padding-xxl;
      border-radius: $radius-lg;
    }

    &__handle {
      display: none;
    }

    &__body {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: $gap-xxl;
    }

    &__board {
      max-width: 360px;
    }
  }

  .zone-sheet-enter-from .zone-sheet__panel,
  .zone-sheet-leave-to .zone-sheet__panel {
    transform: scale(0.96);
  }
}
</style>
