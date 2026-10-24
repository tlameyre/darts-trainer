const AVATAR_COLORS = ['#047857', '#1D4ED8', '#7C3AED', '#B45309', '#0891B2', '#C8001F']

// Stable colour for a person's avatar, derived from a string (id or name)
export function avatarColor(seed = '') {
  let hash = 0
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
