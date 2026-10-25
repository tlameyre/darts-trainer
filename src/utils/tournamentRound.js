// Human label of a tournament match round, from fetchTournamentMatchLabel()
export function roundLabel({ bracketType, round, lastRound }) {
  if (bracketType === 'league') return `Journée ${round}`
  if (bracketType === 'grand_final') return 'Grande finale'
  if (bracketType === 'loser') return `Perdants · Tour ${round}`
  const fromEnd = lastRound - round
  if (fromEnd === 0) return 'Finale'
  if (fromEnd === 1) return 'Demi-finale'
  if (fromEnd === 2) return 'Quart de finale'
  return `Tour ${round}`
}
