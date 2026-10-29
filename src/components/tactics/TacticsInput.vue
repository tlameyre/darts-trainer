<script setup>
import { computed } from 'vue'
import DartPad from '../game/DartPad.vue'

const props = defineProps({
  darts:  { type: Array, required: true }, // darts of the current volley (max 3)
  // { sector: number|null, onlyType: 'double'|'triple'|null }, sector null = bull
  target: { type: Object, required: true },
  locked: Boolean,
})

const emit = defineEmits(['dart', 'miss', 'undo'])

const buttons = computed(() => {
  const { sector, onlyType } = props.target
  if (sector === null) {
    return [
      { label: 'Outer', sub: '25', dart: { type: 'bull', sector: null, pts: 25, label: 'Outer' } },
      { label: 'Bull',  sub: '50', dart: { type: 'bull', sector: null, pts: 50, label: 'Bull' } },
    ]
  }
  const all = [
    { key: 'single', label: `S${sector}`, sub: 'Simple', dart: { type: 'single', sector, pts: sector,     label: `S${sector}` } },
    { key: 'double', label: `D${sector}`, sub: 'Double', dart: { type: 'double', sector, pts: sector * 2, label: `D${sector}` } },
    { key: 'triple', label: `T${sector}`, sub: 'Triple', dart: { type: 'triple', sector, pts: sector * 3, label: `T${sector}` } },
  ]
  if (!onlyType) return all
  const only = all.find(b => b.key === onlyType)
  return [{ ...only, label: only.sub, sub: '' }]
})

const rows = computed(() => [{ key: 'target', buttons: buttons.value }])
</script>

<template>
  <DartPad
    :darts="darts"
    :rows="rows"
    :locked="locked"
    @dart="emit('dart', $event)"
    @miss="emit('miss')"
    @undo="emit('undo')"
  />
</template>
