import { GAME_MODES } from '../data/gameModes.js'
import { relativeDay } from './relativeDay.js'

const modeOf = (id) => GAME_MODES.find((m) => m.id === id)
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)
const fmt1 = (v) => Number(v).toFixed(1).replace('.', ',')
const minutes = (seconds) => Math.max(1, Math.round(seconds / 60))

// Latest sessions across the four recorded modes, newest first:
// [{ id, color, icon, title, sub, badge }]
export function recentResults({ score = [], warmup = [], checkout = [], x01 = [] }, limit = 3) {
  const rows = [
    ...score.map((r) => ({
      mode: modeOf('score-training'), row: r,
      detail: `${r.total_questions} questions`,
      badge: `${pct(r.correct_count, r.total_questions)} %`,
    })),
    ...warmup.map((r) => ({
      mode: modeOf('warmup'), row: r,
      detail: [String(r.zone).split('+').join(', '), r.duration_s && `${minutes(r.duration_s)} min`].filter(Boolean).join(' · '),
      badge: `${r.accuracy} %`,
    })),
    ...checkout.map((r) => ({
      mode: modeOf('checkout'), row: r,
      detail: `${r.questions} questions`,
      badge: `${r.correct_count}/${r.questions}`,
    })),
    ...x01.map((r) => ({
      mode: modeOf('x01'), row: r,
      detail: `${r.legs_played} manche${r.legs_played > 1 ? 's' : ''}`,
      badge: r.avg_volley != null ? fmt1(r.avg_volley) : '–',
    })),
  ]

  return rows
    .sort((a, b) => new Date(b.row.played_at) - new Date(a.row.played_at))
    .slice(0, limit)
    .map(({ mode, row, detail, badge }) => ({
      id: `${mode.id}-${row.id ?? row.played_at}`,
      color: mode.color,
      icon: mode.icon,
      title: mode.label,
      sub: `${relativeDay(row.played_at)} · ${detail}`,
      badge,
    }))
}
