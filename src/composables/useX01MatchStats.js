/**
 * End-of-match X01 statistics (Scolia-like): one stats object per player for the
 * whole match, plus the same stats for each leg.
 *
 * Leg input: { volleys, won?, checkoutScore? } where a volley is
 * { score, bust, darts: Array|number, dartsToFinish?, doublesThrown?, doublesAttempted? }
 */

const SCORING_THRESHOLD = 170
const BUCKETS = [180, 140, 100, 80, 60]

// Darts actually thrown in a volley (not the number of entries in v.darts)
export function volleyDarts(v) {
  if (v.dartsToFinish != null) return v.dartsToFinish
  if (typeof v.darts === 'number') return v.darts
  // Volley-total mode (and its Bust button) stores a single synthetic dart for 3 thrown
  const [first] = v.darts
  if (v.darts.length === 1 && (first.type === 'volley' || first.label === 'Bust')) return 3
  return v.darts.length
}

function volleyPoints(v) {
  return v.bust ? 0 : v.score
}

export function threeDartAverage(volleys) {
  const darts = volleys.reduce((s, v) => s + volleyDarts(v), 0)
  if (!darts) return null
  const points = volleys.reduce((s, v) => s + volleyPoints(v), 0)
  return Math.round((points / darts) * 3 * 100) / 100
}

// Volleys started while the remaining score was above the checkout range
function scoringVolleys(leg, startScore) {
  let remaining = startScore
  const result = []
  for (const v of leg.volleys) {
    if (remaining > SCORING_THRESHOLD) result.push(v)
    remaining -= volleyPoints(v)
  }
  return result
}

export function computePlayerStats(legs, startScore, { trackDoubles = true } = {}) {
  const volleys = legs.flatMap(l => l.volleys)
  const wonLegs = legs.filter(l => l.won)

  const buckets = Object.fromEntries(BUCKETS.map(b => [b, 0]))
  for (const v of volleys) {
    const bucket = BUCKETS.find(b => volleyPoints(v) >= b)
    if (bucket) buckets[bucket]++
  }

  const legDarts = wonLegs.map(l => l.volleys.reduce((s, v) => s + volleyDarts(v), 0))

  return {
    legsWon:          wonLegs.length,
    average:          threeDartAverage(volleys),
    scoringAverage:   threeDartAverage(legs.flatMap(l => scoringVolleys(l, startScore))),
    first9Average:    threeDartAverage(legs.flatMap(l => l.volleys.slice(0, 3))),
    checkoutHits:     wonLegs.length,
    checkoutAttempts: trackDoubles
      ? volleys.reduce((s, v) => s + (v.doublesThrown ?? v.doublesAttempted ?? 0), 0)
      : null,
    highestFinish:    wonLegs.length ? Math.max(...wonLegs.map(l => l.checkoutScore ?? 0)) : null,
    darts:            volleys.reduce((s, v) => s + volleyDarts(v), 0),
    bestLeg:          legDarts.length ? Math.min(...legDarts) : null,
    buckets,
  }
}

/**
 * @param {{ players: Array<{ name, isMe?, isAI? }>, legsByPlayer: Array<Array>, startScore: number }} input
 *   legsByPlayer[i] = legs of players[i] in chronological order (same leg index across players)
 */
export function buildMatchStats({ players, legsByPlayer, startScore }) {
  const options = players.map(p => ({ trackDoubles: !p.isAI }))
  const legCount = Math.max(0, ...legsByPlayer.map(l => l.length))

  const legs = []
  for (let n = 0; n < legCount; n++) {
    const playerLegs = legsByPlayer.map(l => l[n] ?? { volleys: [] })
    if (playerLegs.every(l => !l.volleys.length)) continue
    legs.push({
      number:      legs.length + 1,
      winnerIndex: playerLegs.findIndex(l => l.won),
      players:     playerLegs.map((l, i) => computePlayerStats([l], startScore, options[i])),
    })
  }

  return {
    players: players.map(p => ({ name: p.name, isMe: !!p.isMe, isAI: !!p.isAI })),
    match:   legsByPlayer.map((l, i) => computePlayerStats(l, startScore, options[i])),
    legs,
  }
}
