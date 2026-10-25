<template>
  <div class="chart-container">
    <apexchart
      type="line"
      height="350"
      :options="chartOptions"
      :series="chartSeries"
    ></apexchart>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, default: () => [] },
  periodMode: { type: String, default: 'year' },
})

// 1. SOLUTION : On mappe les données au format [{ x: timestamp, y: accuracy }]
// Cela permet à ApexCharts de positionner chaque point de manière autonome sur la frise chronologique
const chartSeries = computed(() => {
  return props.series.map(zone => ({
    name: zone.label,
    data: zone.points ? zone.points.map(pt => ({
      x: new Date(pt.played_at).getTime(), // Position exacte sur l'axe X
      y: pt.accuracy                      // Hauteur sur l'axe Y
    })) : []
  }))
})

// 2. Récupération plate de TOUS les timestamps existants pour caler les filtres et les bornes
const allTimestamps = computed(() => {
  if (!props.series.length) return []
  return props.series
    .flatMap(zone => zone.points ? zone.points.map(pt => new Date(pt.played_at).getTime()) : [])
    .sort((a, b) => a - b)
})

// 3. Couleurs dynamiques extraites du JSON
const chartColors = computed(() => {
  return props.series.map(zone => zone.color || '#3b82f6')
})

// 4. Calcul de la valeur maximale globale de la série + 10
const maxAxisValue = computed(() => {
  if (!props.series.length) return 100

  const allAccuracies = props.series.flatMap(zone =>
    zone.points ? zone.points.map(pt => pt.accuracy) : []
  )

  if (!allAccuracies.length) return 100

  const calculatedMax = Math.max(...allAccuracies) + 10
  return calculatedMax > 100 ? 100 : calculatedMax
})

// 5. Calcul dynamique du nombre de graduations (ticks) sur l'axe X
const calculatedTicks = computed(() => {
  switch (props.periodMode) {
    case 'week':
      return 7   // 7 jours
    case 'month':
      return 3   // ~4 semaines
    case 'year':
      return 12  // 12 mois
    default:
      return 10  // Valeur par défaut pour le mode 'all'
  }
})

// 6. Configuration dynamique d'ApexCharts
const chartOptions = computed(() => {
  const timeMin = allTimestamps.value.length ? allTimestamps.value[0] : undefined
  const timeMax = allTimestamps.value.length ? allTimestamps.value[allTimestamps.value.length - 1] : undefined

  return {
    chart: {
      id: 'darts-accuracy-chart',
      toolbar: { show: false },
      fontFamily: 'Barlow',
      locales: [{
        name: 'fr',
        options: {
          months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
          shortMonths: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
        }
      }],
      defaultLocale: 'fr'
    },
    colors: chartColors.value,
    stroke: {
      curve: 'smooth',
      width: 3
    },
    markers: {
      size: 4 // Réduction légère pour une meilleure visibilité sur les lignes denses
    },
    xaxis: {
      type: 'datetime',
      // REMARQUE : On retire la propriété "categories" car les dates sont maintenant portées par les points eux-mêmes !
      min: timeMin,
      max: timeMax,
      labels: {
        hideOverlappingLabels: true,
        style: {
          fontSize: '11px'
        },
        datetimeFormatter: {
          year: 'dd/MM',
          month: 'dd/MM',
          day: 'dd/MM',
          hour: 'dd/MM'
        }
      },
      tickAmount: calculatedTicks.value,
    },
    yaxis: {
      min: 0,
      max: maxAxisValue.value,
      labels: {
        formatter: (val) => `${Math.round(val)}%`
      },
      title: { text: 'Précision (Accuracy)' }
    },
    tooltip: {
      enabled: true,
      shared: true,
      x: {
        format: 'dd MMMM yyyy'
      },
      y: {
        formatter: (val) => `${val}% de réussite`
      }
    }
  }
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  margin: 20px auto;
  padding: 15px;
  border-radius: 12px;
}
</style>
