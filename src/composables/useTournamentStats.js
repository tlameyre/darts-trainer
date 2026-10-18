import { checkoutPct } from './useX01MatchStats.js'

// Each session belongs to one player and holds their stats for one match:
// match_stats.match[i] where match_stats.players[i].isMe.
function ownStats(session) {
  const idx = session.match_stats?.players?.findIndex(p => p.isMe) ?? -1
  return idx === -1 ? null : session.match_stats.match[idx]
}

function max(values) {
  const nums = values.filter(v => v != null)
  return nums.length ? Math.max(...nums) : null
}

function min(values) {
  const nums = values.filter(v => v != null)
  return nums.length ? Math.min(...nums) : null
}

const round2 = v => Math.round(v * 100) / 100

// Cumul des stats X01 de chaque participant sur tous ses matchs du tournoi.
// Moyenne pondérée par les fléchettes, 9 premières par le nombre de manches.
export function aggregatePlayerStats(sessions, participants) {
  return participants.map(participant => {
    const own = sessions
      .filter(s => participant.user_id && s.user_id === participant.user_id)
      .map(s => ({ session: s, stats: ownStats(s) }))
      .filter(o => o.stats)

    const darts  = own.reduce((sum, o) => sum + (o.stats.darts ?? 0), 0)
    const points = own.reduce((sum, o) => sum + ((o.stats.average ?? 0) * (o.stats.darts ?? 0)) / 3, 0)

    const first9 = own.filter(o => o.stats.first9Average != null)
    const legs   = o => o.session.legs_played || o.session.match_stats.legs?.length || 1
    const first9Legs = first9.reduce((sum, o) => sum + legs(o), 0)

    const tracked = own.filter(o => o.stats.checkoutAttempts != null)

    return {
      participant,
      matches:       own.length,
      average:       darts ? round2((points / darts) * 3) : null,
      first9Average: first9Legs ? round2(first9.reduce((sum, o) => sum + o.stats.first9Average * legs(o), 0) / first9Legs) : null,
      checkoutPct:   tracked.length
        ? checkoutPct({
          checkoutHits:     tracked.reduce((sum, o) => sum + (o.stats.checkoutHits ?? 0), 0),
          checkoutAttempts: tracked.reduce((sum, o) => sum + o.stats.checkoutAttempts, 0),
        })
        : null,
      highestFinish: max(own.map(o => o.stats.highestFinish)),
      bestLeg:       min(own.map(o => o.stats.bestLeg)),
      highestVolley: max(own.map(o => o.session.highest_volley)),
    }
  })
}
