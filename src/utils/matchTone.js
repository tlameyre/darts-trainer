// Tournament wins over online: an online tournament match is still a tournament match
export function matchTone({ online = false, tournament = false } = {}) {
  if (tournament) return 'tournament'
  return online ? 'online' : 'green'
}

export function matchColorVar(tone) {
  return tone === 'green' ? null : `var(--color-${tone})`
}
