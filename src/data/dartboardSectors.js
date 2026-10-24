// Shared dartboard geometry, drawn in a 340-unit square (the warm-up zone board).
// Every board of the app renders from these cells so they all look the same.

export const BOARD_SIZE = 340
export const BOARD_CENTER = BOARD_SIZE / 2

export const SECTOR_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]

// Sectors whose double/triple are red and singles black
export const RED_SECTORS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

// Regulation board scaled to a 150 double radius (170mm): 25 = 15.9mm, 50 = 6.35mm
export const RING_RADII = {
  double: [140, 150],
  'single-outer': [92, 140],
  triple: [82, 92],
  'single-inner': [14, 82],
  'bull-outer': [5.6, 14],
  'bull-inner': [0, 5.6],
}

const LABEL_RADIUS = 160

// Angle of a sector centre, clockwise from 12 o'clock, in degrees
export const sectorAngle = (sector) => SECTOR_ORDER.indexOf(sector) * 18

export function polar(r, deg) {
  const rad = (deg * Math.PI) / 180
  return { x: BOARD_CENTER + r * Math.sin(rad), y: BOARD_CENTER - r * Math.cos(rad) }
}

const fmt = (p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`

/** Outline of a ring band, a whole disc for the bulls (`sector` null). */
export function bandPath(sector, ring) {
  const [inner, outer] = RING_RADII[ring]
  if (sector == null) {
    const r = outer
    return `M${BOARD_CENTER - r} ${BOARD_CENTER}A${r} ${r} 0 1 0 ${BOARD_CENTER + r} ${BOARD_CENTER}`
      + `A${r} ${r} 0 1 0 ${BOARD_CENTER - r} ${BOARD_CENTER}Z`
  }
  const mid = sectorAngle(sector)
  return `M${fmt(polar(outer, mid - 9))}A${outer} ${outer} 0 0 1 ${fmt(polar(outer, mid + 9))}`
    + `L${fmt(polar(inner, mid + 9))}A${inner} ${inner} 0 0 0 ${fmt(polar(inner, mid - 9))}Z`
}

/** Centre of a band, where route badges sit. */
export function bandCenter(sector, ring) {
  if (sector == null) return { x: BOARD_CENTER, y: BOARD_CENTER }
  const [inner, outer] = RING_RADII[ring]
  return polar((inner + outer) / 2, sectorAngle(sector))
}

function toneOf(sector, ring) {
  if (ring === 'bull-outer') return 'green'
  if (ring === 'bull-inner') return 'red'
  const red = RED_SECTORS.has(sector)
  if (ring === 'double' || ring === 'triple') return red ? 'red' : 'green'
  return red ? 'black' : 'cream'
}

const SECTOR_RINGS = ['double', 'single-outer', 'triple', 'single-inner']

// One entry per scoring cell, bulls drawn last so they sit on top
export const BOARD_CELLS = [
  ...SECTOR_ORDER.flatMap((sector) => SECTOR_RINGS.map((ring) => ({
    key: `${ring}-${sector}`, ring, sector, tone: toneOf(sector, ring), d: bandPath(sector, ring),
  }))),
  ...['bull-outer', 'bull-inner'].map((ring) => ({
    key: ring, ring, sector: null, tone: toneOf(null, ring), d: bandPath(null, ring),
  })),
]

export const BOARD_LABELS = SECTOR_ORDER.map((n) => ({ n, ...polar(LABEL_RADIUS, sectorAngle(n)) }))

/** Cell under a point of the board space, or null outside the scoring area. */
export function cellAt(x, y) {
  const dx = x - BOARD_CENTER
  const dy = y - BOARD_CENTER
  const r = Math.hypot(dx, dy)
  const ring = Object.keys(RING_RADII).reverse().find((k) => r <= RING_RADII[k][1])
  if (!ring) return null
  if (ring.startsWith('bull')) return BOARD_CELLS.find((c) => c.ring === ring)
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI
  if (deg < 0) deg += 360
  const sector = SECTOR_ORDER[Math.round(deg / 18) % 20]
  return BOARD_CELLS.find((c) => c.ring === ring && c.sector === sector)
}
