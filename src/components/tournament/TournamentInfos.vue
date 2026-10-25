<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import SectionTitle from '../SectionTitle.vue'
import { avatarColor } from '../../utils/avatarColor.js'

const props = defineProps({
  tournament:  { type: Object,  required: true },
  formatLabel: { type: String,  required: true },
  hosts:       { type: Array,   required: true },
  isHost:      { type: Boolean, default: false },
  myUserId:    { type: String,  default: null },
  winnerName:  { type: String,  default: null },
  name:        { type: String,  default: '' }, // v-model, editable by hosts
})

const emit = defineEmits(['update:name', 'save-name', 'delete'])

const rules = computed(() => {
  const t = props.tournament
  const rows = [
    { label: 'Format', value: props.formatLabel },
    { label: 'Format de match', value: `${t.start_score} · ${t.legs_to_win} manche${t.legs_to_win > 1 ? 's' : ''}` },
  ]
  if (t.format === 'championship') rows.push({ label: 'Points', value: 'Victoire = 2 pts' })
  return rows
})
</script>

<template>
  <div class="infos">
    <div v-if="winnerName" class="infos__winner">
      <AppIcon name="trophy" :width="32" :height="32" />
      <span class="infos__winner-name">{{ winnerName }}</span>
      <span class="infos__winner-sub">remporte le tournoi !</span>
    </div>

    <p v-if="tournament.description" class="infos__description">{{ tournament.description }}</p>

    <section v-if="isHost" class="infos__section">
      <SectionTitle ruled title="Nom" />
      <input
        class="infos__input"
        :value="name"
        maxlength="60"
        @input="emit('update:name', $event.target.value)"
        @blur="emit('save-name')"
        @keydown.enter="$event.target.blur()"
      />
    </section>

    <section class="infos__section">
      <SectionTitle ruled title="Règles" />
      <div class="infos__card">
        <div v-for="r in rules" :key="r.label" class="infos__row">
          <span class="infos__label">{{ r.label }}</span>
          <span class="infos__value">{{ r.value }}</span>
        </div>
      </div>
    </section>

    <section class="infos__section">
      <SectionTitle ruled title="Hôtes" />
      <div class="infos__card">
        <div v-for="h in hosts" :key="h.user_id" class="infos__row infos__row--host">
          <span class="infos__avatar" :style="{ background: avatarColor(h.name) }">{{ h.name?.[0] }}</span>
          <span class="infos__host">{{ h.user_id === myUserId ? 'Toi' : h.name }}</span>
          <span v-if="h.role === 'creator'" class="infos__label">Créateur</span>
        </div>
      </div>
    </section>

    <button v-if="isHost" class="infos__delete" @click="emit('delete')">
      <AppIcon name="trash" :width="16" :height="16" />
      Supprimer le tournoi
    </button>
  </div>
</template>

<style lang="scss" scoped>
.infos {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;

  &__winner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
    padding: $padding-md;
    border-radius: $radius-sm;
    background: $surface;
    color: $mode-tournament;
  }

  &__winner-name {
    @include title-xxl;
    line-height: 1;
    color: $text-color;
  }

  &__winner-sub {
    @include text-sm;
    color: $muted;
  }

  &__description {
    @include text-md;
    line-height: 1.45;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__input {
    height: 52px;
    padding: 0 $padding-sm;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $white;
    color: $text-color;
    @include text-md;

    &:focus { outline: none; border-color: $mode-tournament; }
  }

  &__card {
    border-radius: $radius-sm;
    background: $surface;
    overflow: hidden;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: $gap-sm;
    min-height: 52px;
    padding: 0 $padding-sm;

    & + & { border-top: $border-sm solid $border-color; }

    &--host {
      align-items: center;
      min-height: 56px;
    }
  }

  &__label {
    @include text-sm;
    color: $muted;
  }

  &__value {
    @include title-md;
    text-align: right;
  }

  &__avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: $radius-pill;
    color: $white;
    @include title-sm;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__host {
    flex: 1;
    @include title-lg;
    line-height: 1;
  }

  &__delete {
    align-self: center;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    @include text-sm;
    color: $error;
  }
}

@media (min-width: $bp-laptop) {
  .infos {
    &__winner-sub,
    &__label,
    &__delete { @include text-md; }
    &__value { @include title-lg; }
    &__host { @include title-xl; }
    &__description { @include text-lg; }
    &__row { min-height: 60px; }
  }
}
</style>
