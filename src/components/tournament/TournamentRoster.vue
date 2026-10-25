<script setup>
import SectionTitle from '../SectionTitle.vue'
import { avatarColor } from '../../utils/avatarColor.js'

defineProps({
  participants: { type: Array,   required: true },
  hosts:        { type: Array,   required: true }, // [{ user_id, name, role }]
  hostUserIds:  { type: Array,   default: () => [] },
  myUserId:     { type: String,  default: null },
  canManage:    { type: Boolean, default: false }, // host of a not-yet-started tournament
  isHost:       { type: Boolean, default: false },
  minPlayers:   { type: Number,  default: 0 },
})

defineEmits(['add-player', 'remove-player', 'add-host', 'remove-host'])
</script>

<template>
  <div class="roster">
    <section class="roster__section">
      <SectionTitle ruled :title="`Joueurs ${participants.length}`" :action="canManage ? '+ Ajouter' : null" @action="$emit('add-player')" />
      <div class="roster__list">
        <div v-for="p in participants" :key="p.id" class="roster__row">
          <span class="roster__avatar" :style="{ background: avatarColor(p.player_data?.name) }">{{ p.player_data?.name?.[0] }}</span>
          <span class="roster__name">{{ p.user_id && p.user_id === myUserId ? 'Toi' : p.player_data?.name }}</span>
          <span v-if="hostUserIds.includes(p.user_id)" class="roster__tag">Hôte</span>
          <button
            v-else-if="canManage"
            class="roster__remove"
            @click="$emit('remove-player', p)"
          >Retirer</button>
        </div>
        <div v-if="canManage && participants.length < minPlayers" class="roster__row roster__row--empty">
          <span class="roster__avatar roster__avatar--empty" />
          <span class="roster__wait">En attente d'un {{ participants.length + 1 }}e joueur…</span>
        </div>
      </div>
    </section>

    <section class="roster__section">
      <SectionTitle ruled title="Hôtes" :action="isHost ? '+ Ajouter un hôte' : null" @action="$emit('add-host')" />
      <div class="roster__list">
        <div v-for="h in hosts" :key="h.user_id" class="roster__row">
          <span class="roster__avatar" :style="{ background: avatarColor(h.name) }">{{ h.name?.[0] }}</span>
          <span class="roster__name">{{ h.user_id === myUserId ? 'Toi' : h.name }}</span>
          <span v-if="h.role === 'creator'" class="roster__hint">Créateur</span>
          <button
            v-else-if="isHost && h.user_id !== myUserId"
            class="roster__remove"
            @click="$emit('remove-host', h.user_id)"
          >Retirer</button>
        </div>
      </div>
      <p class="roster__hint">Les hôtes peuvent démarrer le tournoi et saisir les résultats.</p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.roster {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;

    // The shared section action is red; here it follows the tournament color
    :deep(.section-title__action) { color: $mode-tournament; }
  }

  &__list {
    border-radius: $radius-sm;
    background: $surface;
    overflow: hidden;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    min-height: 56px;
    padding: 0 $padding-sm;

    & + & { border-top: $border-sm solid $border-color; }

    &--empty {
      border-top-style: dashed;
      color: $muted;
    }
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

    &--empty {
      box-sizing: border-box;
      border: $border-md dashed $border-color;
      background: transparent;
    }
  }

  &__name {
    flex: 1;
    min-width: 0;
    @include title-lg;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__wait {
    @include text-sm;
    font-style: italic;
  }

  &__tag {
    padding: 2px $padding-xs;
    border-radius: $radius-sm;
    background: $black;
    color: $bg;
    @include title-xxs;
    letter-spacing: 0.04em;
  }

  &__hint {
    @include text-xs;
    color: $muted;
  }

  &__remove {
    height: 36px;
    padding: 0 $padding-xs;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    @include text-xs;
    font-weight: 600;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .roster {
    &__row { min-height: 64px; }
    &__name { @include title-xl; }
    &__wait,
    &__hint,
    &__remove { @include text-sm; }
  }
}
</style>
