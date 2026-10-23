// Local calendar day, so a late-evening session counts for the day it was played
const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

function startOfWeek(now) {
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

// Monday first: [{ isToday, counts: { [modeId]: sessions } }] × 7
export function weekActivity(activity, now = new Date()) {
  const monday = startOfWeek(now)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return { key: dayKey(date), isToday: dayKey(date) === dayKey(now), counts: {} }
  })
  const byKey = new Map(days.map((day) => [day.key, day]))
  for (const { mode, playedAt } of activity) {
    const day = byKey.get(dayKey(new Date(playedAt)))
    if (day) day.counts[mode] = (day.counts[mode] ?? 0) + 1
  }
  return days
}

// Consecutive days with at least one session, ending today
export function dayStreak(activity, now = new Date()) {
  const activeDays = new Set(activity.map((a) => dayKey(new Date(a.playedAt))))
  const day = new Date(now)
  // No session yet today doesn't break the streak
  if (!activeDays.has(dayKey(day))) day.setDate(day.getDate() - 1)
  let streak = 0
  while (activeDays.has(dayKey(day))) {
    streak++
    day.setDate(day.getDate() - 1)
  }
  return streak
}
