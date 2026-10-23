// "44 s" under a minute, "2 min 05" above
export function formatDuration(ms) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} s`
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`
}
