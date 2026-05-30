export const BADGES = [
  // Premières fois
  {
    id:          'first_game',
    label:       'Première partie',
    description: 'Jouer sa première session Score Training',
    icon:        '🎯',
    category:    'Débuts',
  },
  {
    id:          'first_warmup',
    label:       'Premier échauffement',
    description: 'Compléter son premier échauffement',
    icon:        '🔥',
    category:    'Débuts',
  },

  // Volume
  {
    id:          'centurion',
    label:       'Centurion',
    description: '100 fléchettes lancées en échauffement',
    icon:        '💯',
    category:    'Volume',
  },
  {
    id:          'thousand_darts',
    label:       '1000 fléchettes',
    description: '1000 fléchettes lancées en échauffement',
    icon:        '🎳',
    category:    'Volume',
  },
  {
    id:          'assiduous',
    label:       'Assidu',
    description: '10 parties jouées toutes sessions confondues',
    icon:        '📅',
    category:    'Volume',
  },
  {
    id:          'veteran',
    label:       'Vétéran',
    description: '50 parties jouées toutes sessions confondues',
    icon:        '🏆',
    category:    'Volume',
  },

  // Performance Score Training
  {
    id:          'on_fire',
    label:       'En feu',
    description: 'Série de 10 bonnes réponses consécutives',
    icon:        '⚡',
    category:    'Score Training',
  },
  {
    id:          'perfect',
    label:       'Parfait',
    description: '100% de réussite sur une partie (min. 10 questions)',
    icon:        '🧠',
    category:    'Score Training',
  },

  // Performance Échauffement
  {
    id:          'precise',
    label:       'Précis',
    description: '80% de précision ou plus sur une session',
    icon:        '🎯',
    category:    'Échauffement',
  },
  {
    id:          'sniper',
    label:       'Sniper',
    description: '95% de précision ou plus sur une session',
    icon:        '💎',
    category:    'Échauffement',
  },
]

export function getBadge(id) {
  return BADGES.find(b => b.id === id)
}
