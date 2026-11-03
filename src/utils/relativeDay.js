const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

// "Hier", "Il y a 3 j", "Il y a 2 sem.", then a short date
export function relativeDay(iso) {
  const days = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY_MS)
  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} j`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
