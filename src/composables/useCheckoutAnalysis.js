import { getCheckout, allRoutes, formatRoute } from "./useCheckouts.js";

/**
 * Analyse des cibles visées en zone de finish (≤ 170) — revue coup par coup
 * façon échecs. Chaque fléchette visée reçoit une note :
 *   best        → 1re fléchette de la route recommandée
 *   good        → 1re fléchette d'une route alternative reconnue
 *   inaccuracy  → reste jouable mais sous-optimal
 *   mistake     → casse le finish, risque de bust ou laisse un reste injouable
 *
 * Modèle déterministe : suppose que la cible est touchée (ne pondère pas les
 * ratés) — la table de checkouts encode déjà ce jugement pour les finishes.
 */

export const MAX_CHECKOUT = 170;

export const GRADES = ["best", "good", "inaccuracy", "mistake"];

// Scores ≤ 170 impossibles à finir en 3 fléchettes.
const BOGEYS = new Set([169, 168, 166, 165, 163, 162, 159]);

// Doubles favoris (pts), du plus au moins confortable.
const PREFERRED_DOUBLES = [40, 32, 36, 24, 16, 20, 50, 8];

export const ALL_SEGMENTS = [
  ...Array.from({ length: 20 }, (_, i) => i + 1).flatMap((n) => [
    { type: "single", sector: n, pts: n, label: String(n) },
    { type: "double", sector: n, pts: n * 2, label: `D${n}` },
    { type: "triple", sector: n, pts: n * 3, label: `T${n}` },
  ]),
  { type: "bull", sector: null, pts: 25, label: "Outer" },
  { type: "bull", sector: null, pts: 50, label: "Bull" },
];

const isFinisher = (d) => d.type === "double" || (d.type === "bull" && d.pts === 50);
const FINISHER_PTS = new Set(ALL_SEGMENTS.filter(isFinisher).map((d) => d.pts));

export function sameDart(a, b) {
  return !!a && !!b && a.type === b.type && (a.sector ?? null) === (b.sector ?? null) && a.pts === b.pts;
}

const _finishMemo = new Map();
/** Vrai si `rem` peut se finir en `n` fléchettes ou moins. */
export function canFinish(rem, n) {
  if (n <= 0 || rem < 2) return false;
  const key = `${rem}:${n}`;
  if (_finishMemo.has(key)) return _finishMemo.get(key);
  const ok = FINISHER_PTS.has(rem)
    || (n > 1 && ALL_SEGMENTS.some((s) => rem - s.pts >= 2 && canFinish(rem - s.pts, n - 1)));
  _finishMemo.set(key, ok);
  return ok;
}

// Preferred ring for a setup dart, all else equal.
const SETUP_RANK = { single: 0, bull: 1, triple: 2, double: 3 };

const doubleRank = (pts) => {
  const i = PREFERRED_DOUBLES.indexOf(pts);
  return i === -1 ? PREFERRED_DOUBLES.length : i;
};

/** Route de secours quand la table n'a rien qui tienne en `n` fléchettes (n ≤ 2). */
function solverRoute(rem, n) {
  const direct = ALL_SEGMENTS.filter((s) => isFinisher(s) && s.pts === rem);
  if (direct.length) return [direct[direct.length - 1]];
  if (n < 2) return null;
  const candidates = ALL_SEGMENTS
    .map((s) => ({ s, fin: ALL_SEGMENTS.find((f) => isFinisher(f) && f.pts === rem - s.pts) }))
    .filter(({ fin }) => fin)
    .sort((a, b) => doubleRank(a.fin.pts) - doubleRank(b.fin.pts) || SETUP_RANK[a.s.type] - SETUP_RANK[b.s.type]);
  return candidates.length ? [candidates[0].s, candidates[0].fin] : null;
}

/** Routes de finish connues pour `rem`, limitées à `n` fléchettes ; la 1re est la recommandée. */
function finishRoutes(rem, n) {
  const fitting = allRoutes(rem).filter((r) => r.length <= n);
  if (fitting.length) return fitting;
  const route = solverRoute(rem, n);
  return route ? [route] : [];
}

/** Qualité du reste laissé pour la volée suivante (0 = bust … 5 = double favori). */
function leaveQuality(rem) {
  if (rem < 2) return 0;
  if (rem > MAX_CHECKOUT || BOGEYS.has(rem) || !canFinish(rem, 3)) return 1;
  const primary = getCheckout(rem)?.primary;
  if (!primary) return 1;
  if (primary.length === 1) return doubleRank(primary[0].pts) < 6 ? 5 : 4;
  return primary.length === 2 ? 3 : 2;
}

const _setupMemo = new Map();
/** Meilleure qualité de reste atteignable en lançant `k` fléchettes de préparation. */
function setupValue(rem, k) {
  if (rem < 2) return 0;
  if (k === 0) return leaveQuality(rem);
  const key = `${rem}:${k}`;
  if (_setupMemo.has(key)) return _setupMemo.get(key);
  const best = Math.max(...ALL_SEGMENTS.map((s) => targetSetupValue(rem, k, s)));
  _setupMemo.set(key, best);
  return best;
}

function targetSetupValue(rem, k, target) {
  const left = rem - target.pts;
  return left < 2 ? 0 : setupValue(left, k - 1);
}

function bestSetupTargets(rem, k) {
  const max = setupValue(rem, k);
  return ALL_SEGMENTS.filter((s) => targetSetupValue(rem, k, s) === max);
}

/** Chemin de préparation recommandé, ex. "T20 20 → reste 40". */
function setupLine(rem, k) {
  const path = [];
  let r = rem;
  for (let i = 0; i < k && r >= 2; i++) {
    // Last setup dart: leave the most comfortable double; otherwise score heavy.
    const lastDart = i === k - 1;
    const [t] = bestSetupTargets(r, k - i).sort((a, b) =>
      (lastDart ? doubleRank(r - a.pts) - doubleRank(r - b.pts) : 0) || b.pts - a.pts || SETUP_RANK[a.type] - SETUP_RANK[b.type]);
    path.push(t);
    r -= t.pts;
  }
  return `${formatRoute(path)} → reste ${r}`;
}

/**
 * Note la cible `target` visée avec `remaining` restant et `dartsLeft`
 * fléchettes dans la volée. Retourne { grade, recommended }.
 */
export function gradeTarget(remaining, dartsLeft, target) {
  const left = remaining - target.pts;
  const busts = left < 0 || left === 1 || (left === 0 && !isFinisher(target));

  if (canFinish(remaining, dartsLeft)) {
    const routes = finishRoutes(remaining, dartsLeft);
    const recommended = formatRoute(routes[0]);
    if (busts) return { grade: "mistake", recommended };
    if (sameDart(target, routes[0][0])) return { grade: "best", recommended };
    if (routes.some((r) => sameDart(target, r[0]))) return { grade: "good", recommended };
    const stillOn = left === 0 || canFinish(left, dartsLeft - 1);
    return { grade: stillOn ? "inaccuracy" : "mistake", recommended };
  }

  const recommended = setupLine(remaining, dartsLeft);
  if (busts) return { grade: "mistake", recommended };
  const max = setupValue(remaining, dartsLeft);
  const value = targetSetupValue(remaining, dartsLeft, target);
  if (value === max) return { grade: "best", recommended };
  if (value >= max - 1 && value >= 3) return { grade: "good", recommended };
  return { grade: value >= 2 ? "inaccuracy" : "mistake", recommended };
}

/**
 * Analyse les fléchettes visées d'une suite de manches.
 * @param {Array<{ volleys: Array<{ darts: Array, bust: boolean, score: number }> }>} legs
 * @param {number} startScore
 */
export function analyzeLegs(legs, startScore) {
  const moves = [];
  legs.forEach((leg, legIdx) => {
    let legRem = startScore;
    for (const volley of leg.volleys) {
      let rem = legRem;
      volley.darts.forEach((dart, i) => {
        if (dart.target) {
          const dartsLeft = 3 - i;
          moves.push({
            leg: legIdx + 1,
            remaining: rem,
            dartsLeft,
            target: dart.target,
            hit: dart,
            ...gradeTarget(rem, dartsLeft, dart.target),
          });
        }
        rem -= dart.pts;
      });
      if (!volley.bust) legRem -= volley.score;
    }
  });

  const counts = Object.fromEntries(GRADES.map((g) => [g, 0]));
  for (const m of moves) counts[m.grade]++;
  const pct = (n) => (moves.length ? Math.round((n / moves.length) * 100) : null);

  return {
    moves,
    counts,
    placementPct: pct(counts.best + counts.good),
    executionPct: pct(moves.filter((m) => sameDart(m.hit, m.target)).length),
  };
}
