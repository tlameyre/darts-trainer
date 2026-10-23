import { computed } from 'vue'

const MAX_ZONES = 5

function isBull(zone) {
  return zone?.sector === null
}

// Le bull stocke son type en AB/SB/B (legacy, pas de triple) — on le traduit
// vers le référentiel générique A/S/D partagé avec les secteurs numériques.
export function genericType(zone) {
  if (!zone) return 'A'
  if (isBull(zone)) {
    if (zone.type === 'B') return 'D'
    if (zone.type === 'SB') return 'S'
    return 'A'
  }
  return zone.type
}

function bullType(generic) {
  if (generic === 'S') return 'SB'
  if (generic === 'D') return 'B'
  return 'AB'
}

// Shared zone selection logic for v-model components: `props.modelValue` is a
// zone ({ sector, type }) or, when `props.multiple`, an array of up to 5 zones.
export function useZoneSelection(props, emit) {
  const zones = computed(() => (props.multiple ? props.modelValue : [props.modelValue]))

  const activeType = computed(() => genericType(zones.value[0]))

  const isBullSelected = computed(() => zones.value.some(isBull))

  function isSelected(sector) {
    return zones.value.some(z => z.sector === sector)
  }

  function selectSector(sector) {
    const zone = { sector, type: sector === null ? bullType(activeType.value) : activeType.value }
    if (!props.multiple) {
      emit('update:modelValue', zone)
      return
    }
    const idx = props.modelValue.findIndex(z => z.sector === sector)
    if (idx >= 0) {
      if (props.modelValue.length > 1) emit('update:modelValue', props.modelValue.filter((_, i) => i !== idx))
      return
    }
    if (props.modelValue.length >= MAX_ZONES) return
    emit('update:modelValue', [...props.modelValue, zone])
  }

  function selectType(type) {
    const retype = z => ({ ...z, type: isBull(z) ? bullType(type) : type })
    emit('update:modelValue', props.multiple ? props.modelValue.map(retype) : retype(props.modelValue))
  }

  return { activeType, isBullSelected, isSelected, selectSector, selectType }
}
