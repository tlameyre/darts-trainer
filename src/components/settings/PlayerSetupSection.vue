<script setup>
import { computed, ref } from 'vue'
import SettingsSection from './SettingsSection.vue'
import DashedAddButton from './DashedAddButton.vue'
import X01PlayerOrderList from '../x01/X01PlayerOrderList.vue'
import X01PlayerPicker from '../x01/X01PlayerPicker.vue'
import { useFriendStore } from '../../store/friendStore.js'

const MAX_PLAYERS = 4

const players = defineModel({ type: Array, required: true })

defineProps({
  bot: { type: Object, default: null },
  soloHint: String,
})

defineEmits(['edit-bot', 'remove-bot'])

const friendStore = useFriendStore()
const showPicker = ref(false)

const canAddMore = computed(() => players.value.length < MAX_PLAYERS)
const selectedIds = computed(() => players.value.map(p => p.id))

function openPicker() {
  if (!friendStore.friends.length) friendStore.fetchFriends()
  showPicker.value = true
}

function onSelected(newPlayers) {
  const remaining = MAX_PLAYERS - players.value.length
  players.value.push(...newPlayers.slice(0, remaining))
  showPicker.value = false
}

function remove(index) {
  if (players.value[index]?.isMe) return
  players.value.splice(index, 1)
}
</script>

<template>
  <SettingsSection label="Joueurs" hint="Glisse pour changer l'ordre">
    <X01PlayerOrderList
      v-model="players"
      removable
      :bot="bot"
      @remove="remove"
      @edit-bot="$emit('edit-bot')"
      @remove-bot="$emit('remove-bot')"
    />

    <div v-if="canAddMore && !bot" class="players__add">
      <DashedAddButton @click="openPicker">Joueur</DashedAddButton>
      <slot name="actions" :players="players" />
    </div>
    <p v-else-if="!bot" class="players__hint">Maximum {{ MAX_PLAYERS }} joueurs atteint.</p>
    <p v-if="soloHint && players.length === 1" class="players__hint">{{ soloHint }}</p>

    <X01PlayerPicker
      :show="showPicker"
      :friends="friendStore.friends"
      :selected-ids="selectedIds"
      :max-additional="MAX_PLAYERS - players.length"
      @close="showPicker = false"
      @select="onSelected"
    />
  </SettingsSection>
</template>

<style lang="scss" scoped>
.players {
  &__add {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: $gap-xs;
  }

  &__hint {
    @include text-xs;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .players__hint { @include text-sm; }
}
</style>
