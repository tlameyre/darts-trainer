<script setup>
defineProps({
  name: { type: String, required: true },
  initials: { type: String, required: true },
  streak: { type: Number, default: 0 },
})

defineEmits(['profile'])
</script>

<template>
  <header class="home-header">
    <div class="home-header__who">
      <button class="home-header__avatar" aria-label="Ouvrir le profil" @click="$emit('profile')">
        {{ initials }}
      </button>
      <div>
        <p class="home-header__greeting">Bonjour,</p>
        <h1 class="home-header__name">{{ name }}</h1>
      </div>
    </div>
    <span v-if="streak" class="home-header__streak">
      Série - <span class="home-header__streak-value">{{ streak }}j</span>
    </span>
  </header>
</template>

<style lang="scss" scoped>
.home-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $gap-sm;
  padding: calc(#{$padding-xxl} + env(safe-area-inset-top)) $padding-md $padding-md;
  background: $black;
  color: $bg;

  &__who {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    min-width: 0;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: $radius-pill;
    background: $error;
    color: $bg;
    @include title-lg;
    transition: opacity 0.15s;

    &:active { opacity: 0.7; }
  }

  &__greeting {
    margin-bottom: $gap-xs;
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.7;
  }

  &__name {
    @include title-xxxl;
    line-height: 0.9;
    overflow-wrap: anywhere;
  }

  &__streak {
    flex-shrink: 0;
    padding: $padding-xxs $padding-xs;
    border: $border-md solid rgba($bg, 0.3);
    border-radius: $radius-sm;
    @include title-sm;
  }

  &__streak-value { color: $error-light; }
}

@media (min-width: $bp-laptop) {
  .home-header {
    padding: $padding-xxl $padding-xxl $padding-xl;

    &__who { gap: $gap-md; }

    &__avatar {
      width: 64px;
      height: 64px;
      @include title-xl;
    }

    &__greeting { @include text-sm; font-weight: 600; }

    &__name {
      @include display-xs;
      line-height: 0.9;
      text-transform: uppercase;
    }

    &__streak {
      padding: $padding-xs $padding-sm;
      @include title-lg;
    }
  }
}
</style>
