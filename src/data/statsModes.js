export const STATS_MODES = [
  { id: 'score',    label: 'Calcul',       color: '#EB6343' },
  { id: 'warmup',   label: 'Échauffement', color: '#1D4ED8' },
  { id: 'x01',      label: '501',          color: '#047857' },
  { id: 'checkout', label: 'Checkouts',    color: '#0891B2' },
]

export const STATS_MODE_COLORS = Object.fromEntries(STATS_MODES.map(m => [m.id, m.color]))
