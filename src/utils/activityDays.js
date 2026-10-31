const DAY_MS = 86_400_000

// Local calendar day as an integer, so consecutive days differ by exactly 1 (DST-safe)
function dayIndex(date) {
  const d = new Date(date)
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS)
}

// Longest run of consecutive calendar days with at least one session
export function bestDayStreak(dates) {
  const days = [...new Set(dates.map(dayIndex))].sort((a, b) => a - b)
  let best = 0
  let run = 0
  days.forEach((day, i) => {
    run = i > 0 && day === days[i - 1] + 1 ? run + 1 : 1
    best = Math.max(best, run)
  })
  return best
}

// Highest number of sessions falling inside any window of `windowDays` consecutive calendar days
export function maxSessionsInWindow(dates, windowDays) {
  const days = dates.map(dayIndex).sort((a, b) => a - b)
  let best = 0
  let start = 0
  days.forEach((day, end) => {
    while (day - days[start] >= windowDays) start++
    best = Math.max(best, end - start + 1)
  })
  return best
}
