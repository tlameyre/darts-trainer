// Badge tile colour per category (matches the new design palette)
export const BADGE_CATEGORIES = [
  { name: 'Débuts',           color: '#C8001F' },
  { name: '501',              color: '#047857' },
  { name: 'Échauffement',     color: '#1D4ED8' },
  { name: 'Calcul',           color: '#EB6343' },
  { name: 'Checkout',         color: '#0891B2' },
  { name: 'Tournoi',          color: '#B45309' },
  { name: 'Régularité',       color: '#0F766E' },
  { name: 'Lancers spéciaux', color: '#7C3AED' },
]

const RAW_BADGES = [

  // ── Débuts ────────────────────────────────────────────────
  { id: 'first_game',       label: 'Première partie',       description: 'Jouer sa première session Calcul',                category: 'Débuts' },
  { id: 'first_warmup',     label: 'Premier échauffement',  description: 'Compléter son premier échauffement',              category: 'Débuts' },
  { id: 'profile_complete', label: 'Identité',              description: 'Renseigner son prénom, nom ou surnom',            category: 'Débuts' },
  { id: 'sessions_10',      label: 'Assidu',                description: '10 parties jouées toutes sessions confondues',    category: 'Débuts' },
  { id: 'sessions_50',      label: 'Vétéran',               description: '50 parties jouées toutes sessions confondues',    category: 'Débuts' },
  { id: 'sessions_100',     label: 'Légende',               description: '100 parties jouées toutes sessions confondues',   category: 'Débuts' },
  { id: 'total_darts_500',  label: '500 au total',          description: '500 fléchettes toutes sessions confondues',       category: 'Débuts' },
  { id: 'total_darts_1000', label: '1 000 au total',        description: '1 000 fléchettes toutes sessions confondues',     category: 'Débuts' },
  { id: 'total_darts_5000', label: '5 000 au total',        description: '5 000 fléchettes toutes sessions confondues',     category: 'Débuts' },

  // ── 501 ───────────────────────────────────────────────────
  { id: 'x01_sessions_10',  label: 'Lanceur',               description: '10 parties de X01 jouées',                        category: '501' },
  { id: 'x01_sessions_50',  label: 'Compétiteur',           description: '50 parties de X01 jouées',                        category: '501' },
  { id: 'x01_sessions_100', label: 'Cador',                 description: '100 parties de X01 jouées',                       category: '501' },
  { id: 'x01_darts_100',    label: '100 fléchettes 501',    description: '100 fléchettes lancées en 501',                   category: '501' },
  { id: 'x01_darts_1000',   label: '1 000 fléchettes 501',  description: '1 000 fléchettes lancées en 501',                 category: '501' },
  { id: 'x01_darts_5000',   label: '5 000 fléchettes 501',  description: '5 000 fléchettes lancées en 501',                 category: '501' },
  { id: 'x01_first_win',    label: 'Première victoire',     description: 'Gagner une partie X01 contre un bot ou des joueurs', category: '501' },
  { id: 'x01_wins_10',      label: 'Gagneur',               description: '10 victoires en X01',                             category: '501' },
  { id: 'x01_wins_50',      label: 'Dominateur',            description: '50 victoires en X01',                             category: '501' },
  { id: 'x01_avg_60',       label: 'Moyenne 60',            description: 'Moyenne de 60 ou plus par volée sur une partie (min. 10 fléchettes)', category: '501' },
  { id: 'x01_avg_80',       label: 'Moyenne 80',            description: 'Moyenne de 80 ou plus par volée sur une partie (min. 10 fléchettes)', category: '501' },
  { id: 'x01_avg_100',      label: 'Moyenne 100',           description: 'Moyenne de 100 ou plus par volée sur une partie (min. 10 fléchettes)', category: '501' },
  { id: 'x01_finish_100',   label: 'Gros finish',           description: 'Finir un leg avec 100 points ou plus',            category: '501' },
  { id: 'x01_nine_darter',  label: 'Neuf fléchettes',       description: 'Boucler un leg de 501 en 9 fléchettes',           category: '501' },

  // ── Échauffement ──────────────────────────────────────────
  { id: 'warmup_sessions_10',  label: 'En jambes',          description: '10 sessions d\'échauffement complétées',          category: 'Échauffement' },
  { id: 'warmup_sessions_50',  label: 'Routinier',          description: '50 sessions d\'échauffement complétées',          category: 'Échauffement' },
  { id: 'warmup_sessions_100', label: 'Machine',            description: '100 sessions d\'échauffement complétées',         category: 'Échauffement' },
  { id: 'darts_100',        label: 'Centurion',             description: '100 fléchettes lancées en échauffement',          category: 'Échauffement' },
  { id: 'darts_1000',       label: '1 000 échauffées',      description: '1 000 fléchettes lancées en échauffement',        category: 'Échauffement' },
  { id: 'darts_5000',       label: '5 000 échauffées',      description: '5 000 fléchettes lancées en échauffement',        category: 'Échauffement' },
  { id: 'precise',          label: 'Précis',                description: '80% de précision ou plus (min. 5 volées)',        category: 'Échauffement' },
  { id: 'sniper',           label: 'Sniper',                description: '95% de précision ou plus (min. 5 volées)',        category: 'Échauffement' },
  { id: 'perfect_warmup',   label: '100% de précision',     description: 'Aucun miss sur une session complète (min. 5 volées)', category: 'Échauffement' },
  { id: 'avg_80',           label: 'Régulier',              description: '80% de précision en moyenne sur 10 sessions',     category: 'Échauffement' },

  // ── Calcul ────────────────────────────────────────────────
  { id: 'game_sessions_10',  label: 'Élève',                description: '10 sessions Calcul complétées',                   category: 'Calcul' },
  { id: 'game_sessions_50',  label: 'Studieux',             description: '50 sessions Calcul complétées',                   category: 'Calcul' },
  { id: 'game_sessions_100', label: 'Pro du calcul',        description: '100 sessions Calcul complétées',                  category: 'Calcul' },
  { id: 'streak_10',        label: 'En feu',                description: 'Série de 10 bonnes réponses consécutives',        category: 'Calcul' },
  { id: 'streak_20',        label: 'Inarrêtable',           description: 'Série de 20 bonnes réponses consécutives',        category: 'Calcul' },
  { id: 'streak_50',        label: 'Inhumain',              description: 'Série de 50 bonnes réponses consécutives',        category: 'Calcul' },
  { id: 'perfect_game',     label: 'Parfait',               description: '100% de réussite sur une partie (min. 10 questions)', category: 'Calcul' },
  { id: 'correct_50',       label: '50 bonnes réponses',    description: '50 bonnes réponses au total',                     category: 'Calcul' },
  { id: 'correct_100',      label: '100 bonnes réponses',   description: '100 bonnes réponses au total',                    category: 'Calcul' },
  { id: 'correct_500',      label: '500 bonnes réponses',   description: '500 bonnes réponses au total',                    category: 'Calcul' },
  { id: 'correct_1000',     label: '1 000 bonnes réponses', description: '1 000 bonnes réponses au total',                  category: 'Calcul' },
  { id: 'questions_50',     label: '50 questions',          description: '50 questions Calcul répondues',                   category: 'Calcul' },
  { id: 'questions_100',    label: '100 questions',         description: '100 questions Calcul répondues',                  category: 'Calcul' },
  { id: 'questions_500',    label: '500 questions',         description: '500 questions Calcul répondues',                  category: 'Calcul' },
  { id: 'questions_1000',   label: 'Mille questions',       description: '1 000 questions Calcul répondues',                category: 'Calcul' },
  { id: 'questions_5000',   label: '5 000 questions',       description: '5 000 questions Calcul répondues',                category: 'Calcul' },
  { id: 'questions_10000',  label: '10 000 questions',      description: '10 000 questions Calcul répondues',               category: 'Calcul' },

  // ── Checkout ──────────────────────────────────────────────
  { id: 'checkout_sessions_10', label: 'Finisseur',         description: '10 sessions Checkout complétées',                 category: 'Checkout' },
  { id: 'checkout_sessions_50', label: 'Closer',            description: '50 sessions Checkout complétées',                 category: 'Checkout' },
  { id: 'checkout_perfect',     label: 'Sans faute',        description: '100% de réussite sur un quiz Checkout (min. 10 questions)', category: 'Checkout' },
  { id: 'checkout_optimal_50',  label: 'Chemin optimal',    description: '50 finishes optimaux au total',                   category: 'Checkout' },
  { id: 'checkout_170',         label: 'Sommet',            description: 'Trouver le checkout du 170 en quiz',              category: 'Checkout' },

  // ── Tournoi ───────────────────────────────────────────────
  { id: 'tournament_played',    label: 'Participant',       description: 'Terminer un tournoi',                            category: 'Tournoi' },
  { id: 'tournament_won',       label: 'Champion',          description: 'Gagner un tournoi',                               category: 'Tournoi' },
  { id: 'tournament_won_3',     label: 'Dynastie',          description: 'Gagner 3 tournois',                               category: 'Tournoi' },

  // ── Régularité ────────────────────────────────────────────
  { id: 'days_streak_3',        label: 'Trois jours',       description: 'Jouer 3 jours consécutifs',                       category: 'Régularité' },
  { id: 'days_streak_7',        label: 'Une semaine',       description: 'Jouer 7 jours consécutifs',                       category: 'Régularité' },
  { id: 'days_streak_30',       label: 'Un mois',           description: 'Jouer 30 jours consécutifs',                      category: 'Régularité' },
  { id: 'week_5_sessions',      label: 'Semaine chargée',   description: '5 sessions sur 7 jours glissants',                category: 'Régularité' },

  // ── Lancers spéciaux ──────────────────────────────────────
  { id: 'one_eighty',  label: '180 !',      description: 'Réussir un 180 (T20 + T20 + T20)',                                 category: 'Lancers spéciaux' },
  { id: 'hat_trick',   label: 'Hat Trick',  description: '3 bulls consécutifs dans une volée',                               category: 'Lancers spéciaux' },
  { id: 'white_horse', label: 'White Horse', description: '3 triples dans 3 secteurs différents dans une volée',             category: 'Lancers spéciaux' },
  { id: 'bullseye',    label: 'Bullseye',   description: 'Atteindre le double bull (50 pts)',                                category: 'Lancers spéciaux' },
  { id: 'big_fish',    label: 'Big Fish',   description: 'Réussir un 170 en une volée',                                      category: 'Lancers spéciaux' },
  { id: 'shanghai',    label: 'Shanghai',   description: 'Toucher le simple, la double et la triple du même secteur en une volée', category: 'Lancers spéciaux' },
]

// Icon symbols are defined in AppIconDefs.vue. New badges reuse existing symbols until their own icons are designed.
const ICONS = {
  first_game: 'badge-first-game', first_warmup: 'badge-first-warmup', profile_complete: 'badge-profile-complete',
  sessions_10: 'badge-sessions-10', sessions_50: 'badge-sessions-50', sessions_100: 'badge-sessions-100',
  total_darts_500: 'badge-first-game', total_darts_1000: 'badge-total-darts-1000', total_darts_5000: 'badge-total-darts-5000',

  x01_sessions_10: 'badge-first-game', x01_sessions_50: 'badge-x01-sessions-50', x01_sessions_100: 'badge-sessions-50',
  x01_darts_100: 'badge-total-darts-1000', x01_darts_1000: 'badge-x01-darts-1000', x01_darts_5000: 'badge-total-darts-5000',
  x01_first_win: 'badge-sessions-50', x01_wins_10: 'badge-sessions-50', x01_wins_50: 'badge-sessions-100',
  x01_avg_60: 'badge-avg-80', x01_avg_80: 'badge-avg-80', x01_avg_100: 'badge-avg-80',
  x01_finish_100: 'badge-bullseye', x01_nine_darter: 'badge-sniper',

  warmup_sessions_10: 'badge-first-warmup', warmup_sessions_50: 'badge-first-game', warmup_sessions_100: 'badge-warmup-sessions-100',
  darts_100: 'badge-total-darts-1000', darts_1000: 'badge-x01-darts-1000', darts_5000: 'badge-total-darts-5000',
  precise: 'badge-precise', sniper: 'badge-sniper', perfect_warmup: 'badge-perfect-warmup', avg_80: 'badge-avg-80',

  game_sessions_10: 'badge-game-sessions-10', game_sessions_50: 'badge-game-sessions-10', game_sessions_100: 'badge-game-sessions-100',
  streak_10: 'badge-first-warmup', streak_20: 'badge-total-darts-5000', streak_50: 'badge-streak-50',
  perfect_game: 'badge-streak-50',
  correct_50: 'badge-perfect-warmup', correct_100: 'badge-correct-100', correct_500: 'badge-avg-80', correct_1000: 'badge-correct-1000',
  questions_50: 'badge-questions-50', questions_100: 'badge-questions-50', questions_500: 'badge-avg-80',
  questions_1000: 'badge-correct-100', questions_5000: 'badge-correct-1000', questions_10000: 'badge-sessions-50',

  checkout_sessions_10: 'badge-game-sessions-10', checkout_sessions_50: 'badge-game-sessions-100',
  checkout_perfect: 'badge-perfect-warmup', checkout_optimal_50: 'badge-correct-100', checkout_170: 'badge-big-fish',

  tournament_played: 'badge-sessions-10', tournament_won: 'badge-sessions-50', tournament_won_3: 'badge-sessions-100',

  days_streak_3: 'badge-sessions-10', days_streak_7: 'badge-first-warmup', days_streak_30: 'badge-total-darts-5000',
  week_5_sessions: 'badge-warmup-sessions-100',

  one_eighty: 'badge-total-darts-1000', hat_trick: 'badge-x01-darts-1000', white_horse: 'badge-white-horse',
  bullseye: 'badge-bullseye', big_fish: 'badge-big-fish', shanghai: 'badge-perfect-warmup',
}

export const BADGES = RAW_BADGES.map(b => ({ ...b, icon: ICONS[b.id] }))

export function getBadge(id) {
  return BADGES.find(b => b.id === id)
}
