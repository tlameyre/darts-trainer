// Génération pure d'un championnat (round robin en journées) et calcul du classement.
// Les matchs sont produits en seeds, au même format que generateBracket(), pour
// passer ensuite par resolveMatches().

const POINTS_PER_WIN = 2

// Méthode du cercle (tables de Berger) : le premier slot reste fixe, les autres
// tournent d'un cran à chaque journée. Un effectif impair reçoit un slot fantôme,
// son adversaire est exempt pour la journée. p1 lance en premier : chaque match le
// donne à celui qui a le moins commencé jusque-là ; le retour inverse l'aller.
export function generateLeagueSchedule({ participantCount, doubleRoundRobin }) {
  const slots = Array.from({ length: participantCount }, (_, i) => i + 1)
  if (slots.length % 2) slots.push(null)

  const size = slots.length
  const firstLeg = []
  const starts   = {}
  for (let r = 0; r < size - 1; r++) {
    const pairs = []
    for (let i = 0; i < size / 2; i++) {
      const a = slots[i]
      const b = slots[size - 1 - i]
      if (!a || !b) continue
      const [p1, p2] = (starts[b] ?? 0) < (starts[a] ?? 0) ? [b, a] : [a, b]
      starts[p1] = (starts[p1] ?? 0) + 1
      pairs.push([p1, p2])
    }
    firstLeg.push(pairs)
    slots.splice(1, 0, slots.pop())
  }

  const rounds = doubleRoundRobin
    ? [...firstLeg, ...firstLeg.map(pairs => pairs.map(([a, b]) => [b, a]))]
    : firstLeg

  return rounds.flatMap((pairs, r) => pairs.map(([p1, p2], i) => ({
    key:         `league-${r + 1}-${i + 1}`,
    bracketType: 'league',
    round:       r + 1,
    slotInRound: i + 1,
    player1Seed: p1,
    player2Seed: p2,
    status:      'ready',
    winnerSeed:  null,
  })))
}

export function leagueMatches(matches) {
  return matches.filter(m => m.bracket_type === 'league')
}

export function isLeagueComplete(matches) {
  const league = leagueMatches(matches)
  return league.length > 0 && league.every(m => m.status === 'completed')
}

// Tailles de playoffs possibles : puissances de 2, de la finale (2) jusqu'à l'effectif
export function playoffSizeOptions(participantCount) {
  const sizes = []
  for (let n = 2; n <= participantCount; n *= 2) sizes.push(n)
  return sizes
}

// Joueurs sans match lors de cette journée (effectif impair)
export function byesForMatchday(matches, participants, round) {
  const playing = new Set(
    leagueMatches(matches)
      .filter(m => m.round === round)
      .flatMap(m => [m.player1_participant_id, m.player2_participant_id])
  )
  return participants.filter(p => !playing.has(p.id))
}

// Miroir de la fonction SQL championship_standings() (supabase_schema.sql) : garder les deux synchrones.
// V = 2 pts, D = 0. Départage : points, diff. de manches, manches gagnées, points
// pris contre les joueurs à égalité sur ces trois critères, puis seed.
export function computeStandings(matches, participants) {
  const completed = leagueMatches(matches).filter(m => m.status === 'completed')
  const sides = completed.flatMap(m => [
    { pid: m.player1_participant_id, opp: m.player2_participant_id, lf: m.player1_legs ?? 0, la: m.player2_legs ?? 0, won: m.winner_participant_id === m.player1_participant_id },
    { pid: m.player2_participant_id, opp: m.player1_participant_id, lf: m.player2_legs ?? 0, la: m.player1_legs ?? 0, won: m.winner_participant_id === m.player2_participant_id },
  ])

  const rows = participants.map(p => {
    const own  = sides.filter(s => s.pid === p.id)
    const wins = own.filter(s => s.won).length
    return {
      participant: p,
      played:      own.length,
      wins,
      losses:      own.length - wins,
      legsFor:     own.reduce((sum, s) => sum + s.lf, 0),
      legsAgainst: own.reduce((sum, s) => sum + s.la, 0),
      points:      wins * POINTS_PER_WIN,
    }
  })
  const byId = Object.fromEntries(rows.map(r => [r.participant.id, r]))

  const tieKey = r => `${r.points}|${r.legsFor - r.legsAgainst}|${r.legsFor}`
  for (const r of rows) {
    const tiedWins = sides.filter(s =>
      s.pid === r.participant.id && s.won && byId[s.opp] && tieKey(byId[s.opp]) === tieKey(r)
    ).length
    r.headToHead = tiedWins * POINTS_PER_WIN
  }

  rows.sort((a, b) =>
    b.points - a.points
    || (b.legsFor - b.legsAgainst) - (a.legsFor - a.legsAgainst)
    || b.legsFor - a.legsFor
    || b.headToHead - a.headToHead
    || (a.participant.seed ?? Infinity) - (b.participant.seed ?? Infinity)
  )

  return rows.map((r, i) => ({ ...r, legDiff: r.legsFor - r.legsAgainst, rank: i + 1 }))
}
