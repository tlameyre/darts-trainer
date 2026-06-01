<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  badges: { type: Array, default: () => [] },
})

const emit = defineEmits(['done'])

const current = ref(0)
const visible = ref(false)

watch(() => props.badges, (val) => {
  if (val.length) {
    current.value = 0
    visible.value = true
  }
}, { immediate: true })

function next() {
  if (current.value < props.badges.length - 1) {
    current.value++
  } else {
    visible.value = false
    emit('done')
  }
}
</script>

<template>
  <Transition name="overlay">
    <div v-if="visible && badges.length" class="badge-overlay" @click="next">
      <div class="badge-overlay__card">
        <p class="badge-overlay__eyebrow">Badge débloqué !</p>

        <div class="badge-overlay__icon">{{ badges[current].icon }}</div>

        <h2 class="badge-overlay__label">{{ badges[current].label }}</h2>
        <p class="badge-overlay__desc">{{ badges[current].description }}</p>

        <p class="badge-overlay__hint">
          {{ current < badges.length - 1 ? 'Appuie pour continuer' : 'Appuie pour fermer' }} </p>

            <div v-if="badges.length > 1" class="badge-overlay__dots">
              <span v-for="(_, i) in badges" :key="i" class="badge-overlay__dot"
                :class="{ 'badge-overlay__dot--active': i === current }" />
            </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.badge-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: $padding-xl;

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-md;
    text-align: center;
  }

  &__eyebrow {
    @include title-sm;
    color: $orange;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__icon {
    @include display-lg;
    line-height: 1;
    filter: drop-shadow(0 0 24px rgba($orange, 0.4));
  }

  &__label {
    @include title-xl;
    color: $text-color;
  }

  &__desc {
    @include text-sm;
    color: $muted;
    line-height: 1.5;
  }

  &__hint {
    @include text-xs;
    color: rgba(255, 255, 255, 0.3);
    margin-top: $gap-sm;
  }

  &__dots {
    display: flex;
    gap: $gap-xs;
    margin-top: $gap-xs;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-pill;
    background: rgba(255, 255, 255, 0.2);
    transition: background 0.2s;

    &--active {
      background: $orange;
    }
  }
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

@media (min-width: $bp-laptop) {
  .badge-overlay__card {
    gap: $gap-lg;
  }

  .badge-overlay__icon {
    @include display-xl;
  }

  .badge-overlay__label {
    @include title-xxl;
  }

  .badge-overlay__desc {
    @include text-md;
  }

  .badge-overlay__hint {
    @include text-sm;
  }
}
</style>
