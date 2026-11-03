<script setup>
import { computed } from 'vue'
import DartPad from '../game/DartPad.vue'

const props = defineProps({
  darts: { type: Array, required: true }, // darts of the current volley (max 3)
  zones: { type: Array, required: true },
  locked: Boolean,
})

const emit = defineEmits(['dart', 'miss', 'undo'])

// One row of buttons per zone; keyboard shortcuts 1-3 only make sense with a single zone
const rows = computed(() => props.zones.map(zone => {
  if (zone.sector === null) {
    return {
      key: 'bull',
      buttons: [
        { label: '25', sub: 'Outer', dart: { type: 'bull', sector: null, pts: 25, label: 'Outer' } },
        { label: '50', sub: 'Bull', dart: { type: 'bull', sector: null, pts: 50, label: 'Bull' } },
      ],
    }
  }
  const s = zone.sector
  return {
    key: s,
    buttons: [
      { label: `S${s}`, sub: 'Simple', dart: { type: 'single', sector: s, pts: s, label: `S${s}` } },
      { label: `D${s}`, sub: 'Double', dart: { type: 'double', sector: s, pts: s * 2, label: `D${s}` } },
      { label: `T${s}`, sub: 'Triple', dart: { type: 'triple', sector: s, pts: s * 3, label: `T${s}` } },
    ],
  }
}))
</script>

<template>
  <DartPad
    scored
    :shortcuts="rows.length === 1"
    :darts="darts"
    :rows="rows"
    :locked="locked"
    @dart="emit('dart', $event)"
    @miss="emit('miss')"
    @undo="emit('undo')"
  />
</template>
