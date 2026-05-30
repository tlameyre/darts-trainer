export const BADGES = [

  // ── Débuts ────────────────────────────────────────────────
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
  {
    id:          'profile_complete',
    label:       'Identité',
    description: 'Renseigner son prénom, nom ou surnom',
    icon:        '👤',
    category:    'Débuts',
  },

  // ── Volume ────────────────────────────────────────────────
  {
    id:          'sessions_10',
    label:       'Assidu',
    description: '10 parties jouées toutes sessions confondues',
    icon:        '📅',
    category:    'Volume',
  },
  {
    id:          'sessions_50',
    label:       'Vétéran',
    description: '50 parties jouées toutes sessions confondues',
    icon:        '🏆',
    category:    'Volume',
  },
  {
    id:          'sessions_100',
    label:       'Légende',
    description: '100 parties jouées toutes sessions confondues',
    icon:        '👑',
    category:    'Volume',
  },
  {
    id:          'darts_100',
    label:       'Centurion',
    description: '100 fléchettes lancées en échauffement',
    icon:        '💯',
    category:    'Volume',
  },
  {
    id:          'darts_1000',
    label:       '1 000 fléchettes',
    description: '1 000 fléchettes lancées en échauffement',
    icon:        '🎳',
    category:    'Volume',
  },
  {
    id:          'darts_10000',
    label:       '10 000 fléchettes',
    description: '10 000 fléchettes lancées en échauffement',
    icon:        '⚡',
    category:    'Volume',
  },

  // ── Score Training ────────────────────────────────────────
  {
    id:          'streak_10',
    label:       'En feu',
    description: 'Série de 10 bonnes réponses consécutives',
    icon:        '🔟',
    category:    'Score Training',
  },
  {
    id:          'streak_20',
    label:       'Inarrêtable',
    description: 'Série de 20 bonnes réponses consécutives',
    icon:        '💥',
    category:    'Score Training',
  },
  {
    id:          'streak_50',
    label:       'Inhumain',
    description: 'Série de 50 bonnes réponses consécutives',
    icon:        '🤖',
    category:    'Score Training',
  },
  {
    id:          'perfect_game',
    label:       'Parfait',
    description: '100% de réussite sur une partie (min. 10 questions)',
    icon:        '🧠',
    category:    'Score Training',
  },
  {
    id:          'correct_500',
    label:       '500 bonnes réponses',
    description: '500 bonnes réponses au total',
    icon:        '📈',
    category:    'Score Training',
  },
  {
    id:          'correct_2000',
    label:       '2 000 bonnes réponses',
    description: '2 000 bonnes réponses au total',
    icon:        '🎓',
    category:    'Score Training',
  },

  // ── Échauffement ──────────────────────────────────────────
  {
    id:          'precise',
    label:       'Précis',
    description: '80% de précision ou plus (min. 5 volées)',
    icon:        '🎯',
    category:    'Échauffement',
  },
  {
    id:          'sniper',
    label:       'Sniper',
    description: '95% de précision ou plus (min. 5 volées)',
    icon:        '💎',
    category:    'Échauffement',
  },
  {
    id:          'perfect_warmup',
    label:       '100% de précision',
    description: 'Aucun miss sur une session complète (min. 5 volées)',
    icon:        '✨',
    category:    'Échauffement',
  },
  {
    id:          'avg_80',
    label:       'Régulier',
    description: '80% de précision en moyenne sur 10 sessions',
    icon:        '📊',
    category:    'Échauffement',
  },

  // ── Lancers spéciaux ──────────────────────────────────────
  {
    id:          'one_eighty',
    label:       '180 !',
    description: 'Réussir un 180 (T20 + T20 + T20) en échauffement',
    icon:        '💯',
    category:    'Lancers spéciaux',
  },
  {
    id:          'hat_trick',
    label:       'Hat Trick',
    description: '3 bulls consécutifs dans une volée',
    icon:        '🐂',
    category:    'Lancers spéciaux',
  },
  {
    id:          'white_horse',
    label:       'White Horse',
    description: '3 triples dans 3 secteurs différents dans une volée',
    icon:        '🐴',
    category:    'Lancers spéciaux',
  },
  {
    id:          'bullseye',
    label:       'Bullseye',
    description: 'Atteindre le double bull (50 pts)',
    icon:        '🎪',
    category:    'Lancers spéciaux',
  },
]

export function getBadge(id) {
  return BADGES.find(b => b.id === id)
}
