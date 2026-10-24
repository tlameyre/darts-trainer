<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  initials: { type: String, required: true },
  name:     { type: String, required: true },
  username: { type: String, default: null },
  sessions: { type: [String, Number], default: '—' },
  darts:    { type: [String, Number], default: '—' },
  accuracy: { type: [String, Number], default: null },
})

defineEmits(['edit'])
</script>

<template>
  <header class="profile-hero">
    <div class="profile-hero__top">
      <button class="profile-hero__edit" @click="$emit('edit')">
        <AppIcon name="pen" :width="20" :height="20" />
        Modifier
      </button>
    </div>

    <div class="profile-hero__identity">
      <span class="profile-hero__avatar">{{ initials }}</span>
      <div class="profile-hero__names">
        <h1 class="profile-hero__name">{{ name }}</h1>
        <span v-if="username" class="profile-hero__username">@{{ username }}</span>
      </div>
    </div>

    <dl class="profile-hero__stats">
      <div class="profile-hero__stat">
        <dd class="profile-hero__value">{{ sessions }}</dd>
        <dt class="profile-hero__label">Parties jouées</dt>
      </div>
      <div class="profile-hero__stat">
        <dd class="profile-hero__value">{{ darts }}</dd>
        <dt class="profile-hero__label">Fléchettes</dt>
      </div>
      <div class="profile-hero__stat">
        <dd class="profile-hero__value">
          {{ accuracy ?? '—' }}<span v-if="accuracy != null" class="profile-hero__unit">%</span>
        </dd>
        <dt class="profile-hero__label">Précision</dt>
      </div>
    </dl>
  </header>
</template>

<style lang="scss" scoped>
.profile-hero {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;
  padding: calc(#{$padding-xxl} + env(safe-area-inset-top)) $padding-md $padding-lg;
  background: $black;
  color: $bg;

  &__top {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  &__edit {
    @include title-sm;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    height: 40px;
    padding: 0 $padding-sm;
    border: $border-md solid rgba($bg, 0.3);
    border-radius: $radius-sm;
    color: $bg;
    text-transform: uppercase;
    transition: background 0.15s;

    &:active { background: rgba($bg, 0.1); }
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: $gap-md;
    min-width: 0;
  }

  &__avatar {
    @include title-xxl;
    width: 72px;
    height: 72px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: $error;
    color: $bg;
    text-transform: uppercase;
  }

  &__names {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    min-width: 0;
  }

  &__name {
    @include title-xxxl;
    line-height: 0.9;
    overflow-wrap: anywhere;
  }

  &__username {
    @include text-sm;
    opacity: 0.75;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0 (-$padding-sm);
    padding-top: $padding-md;
    border-top: $border-md solid rgba($bg, 0.2);
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    padding: 0 $padding-sm;

    & + & { border-left: $border-sm solid rgba($bg, 0.2); }
  }

  &__value {
    @include title-xxxl;
    line-height: 0.9;
    margin: 0;
  }

  &__unit { font-size: 0.55em; }

  &__label {
    @include text-xs;
    opacity: 0.75;
  }
}

@media (min-width: $bp-laptop) {
  .profile-hero {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    grid-template-areas: 'identity . stats edit';
    align-items: end;
    gap: $gap-sm $gap-xl;
    padding: calc(#{$padding-xxl} + env(safe-area-inset-top)) $padding-xxl $padding-xl;

    &__top { display: contents; }
    &__edit { grid-area: edit; height: 48px; padding: 0 $padding-md; @include title-md; }
    &__identity { grid-area: identity; gap: $gap-lg; }
    &__stats { grid-area: stats; margin: 0; padding-top: 0; border-top: 0; }

    &__avatar { @include title-xxxl; width: 104px; height: 104px; }
    &__name { @include display-xs; line-height: 0.9; }
    &__username { @include text-md; }
    &__stat { padding: 0 $padding-xl; }
    &__value { @include display-xs; line-height: 0.9; }
    &__label { @include text-sm; }
  }
}
</style>
