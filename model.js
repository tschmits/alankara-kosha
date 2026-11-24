// Alankar-model (handover §4). Pure functies, geen DOM: wordt door de browser én door node --test gebruikt.
// Posities 0..13 = Ṗ Ḍ Ṇ S R G M P D N Ṡ Ṙ Ġ Ṁ.

export const MAX_POS = 13;
export const TOP = 10; // oefeningen vanaf Ṗ eindigen op de taar Sa (Ṡ)
export const MAX_LEN = 32; // maximale reekslengte (§4.9)
const MAX_RANGE = 8; // hoogste min laagste binnen een eenheid
const MAX_SEGS = 3;
const MAX_RESULTS = 8;

// Mandra = punt onder (U+0323), taar = punt boven (U+0307). NFC: waar mogelijk één teken.
// (De handover gebruikt voor mandra-Pa per ongeluk Ṗ met punt boven; P met punt onder heeft geen eigen teken.)
const NAMES = [...'PDN'].map((c) => (c + '̣').normalize('NFC'))
  .concat([...'SRGMPDN'], [...'SRGM'].map((c) => (c + '̇').normalize('NFC')));
export const swar = (p) => NAMES[p];
export const swars = (u) => u.map(swar).join('');

// ---- segmenten (§4.3) ----

// u[i..j) is een basis-segment: tongslag (1-3x dezelfde noot), paar (2 noten) of loop (>=3 noten, steeds +1 of -1).
function isSeg(u, i, j) {
  const l = j - i;
  if (l <= 2) return true;
  const d = u[i + 1] - u[i];
  if (Math.abs(d) > 1 || (d === 0 && l > 3)) return false;
  for (let k = i + 1; k < j - 1; k++) if (u[k + 1] - u[k] !== d) return false;
  return true;
}

// Minimaal aantal segmenten. Snelle voorwaartse DP met lopende ketens; hergebruikt buffers (niet reentrant).
const f = new Int8Array(40), up = new Int8Array(40), dn = new Int8Array(40), eq = new Int8Array(40);
export function segCount(u) {
  const n = u.length;
  f[0] = 0;
  for (let k = 0; k < n; k++) {
    const same = k > 0 && u[k] === u[k - 1], step = k > 0 ? u[k] - u[k - 1] : 0;
    eq[k] = same ? eq[k - 1] + 1 : 1;
    up[k] = step === 1 ? up[k - 1] + 1 : 1;
    dn[k] = step === -1 ? dn[k - 1] + 1 : 1;
    let best = 99;
    const maxL = Math.min(k + 1, Math.max(3, up[k], dn[k]));
    for (let l = 1; l <= maxL; l++) {
      if (l <= 2 || (l === 3 && eq[k] >= 3) || up[k] >= l || dn[k] >= l) best = Math.min(best, f[k + 1 - l] + 1);
    }
    f[k + 1] = best;
  }
  return f[n];
}

// Splitsing met het minste aantal segmenten; bij gelijke stand langste eerste, dan langste tweede (§4.7).
export function split(u) {
  const n = u.length, g = Array(n + 1).fill(Infinity);
  g[n] = 0;
  for (let i = n - 1; i >= 0; i--) for (let j = i + 1; j <= n; j++) if (isSeg(u, i, j)) g[i] = Math.min(g[i], 1 + g[j]);
  const parts = [];
  for (let i = 0; i < n;) {
    let j = n;
    while (!(isSeg(u, i, j) && 1 + g[j] === g[i])) j--;
    parts.push(u.slice(i, j));
    i = j;
  }
  return parts;
}

// ---- eenheid (§4.2, §4.4) ----

export const code = (u) => { const m = Math.min(...u); return u.map((x) => x - m).join(''); };
export const dashed = (u) => { const m = Math.min(...u); return split(u).map((p) => p.map((x) => x - m).join('')).join('-'); };
export const isValid = (u) => Math.max(...u) - Math.min(...u) <= MAX_RANGE && segCount(u) <= MAX_SEGS;
const extend = (u) => Array.from({ length: MAX_POS + 1 }, (_, v) => [...u, v]).filter(isValid);

// ---- rangorde (§4.6): hier draaien als de volgorde moet veranderen ----

export function rank(u) {
  let max = 0, sum = 0;
  for (let i = 1; i < u.length; i++) { const d = Math.abs(u[i] - u[i - 1]); max = Math.max(max, d); sum += d; }
  return [u.length, segCount(u), max, sum, code(u)];
}
export function compareRank(a, b) {
  for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a[4] < b[4] ? -1 : a[4] > b[4] ? 1 : 0;
}

// ---- zoeken (§4.5) ----

// Welke schuifrichtingen (+1 omhoog, -1 omlaag) geven een notenstroom die met q begint?
export const matchDirs = (q, u) =>
  [1, -1].filter((r) => q.every((x, i) => x === u[i % u.length] + r * Math.floor(i / u.length)));

// Eerste `limit` eenheden voor reeks q, simpel -> complex. Zoekt per lengte, dus nooit de hele ruimte.
// Eenheden korter dan q zijn een prefix van q; langere beginnen met q (prefix van een geldige eenheid is geldig).
export function search(q, limit = MAX_RESULTS) {
  const out = [];
  let frontier;
  for (let n = 1; q.length && out.length < limit; n++) {
    let cands;
    if (n < q.length) {
      const u = q.slice(0, n);
      if (!isValid(u)) break;
      const dirs = matchDirs(q, u);
      cands = dirs.length ? [{ u, dirs }] : [];
    } else {
      frontier = n === q.length ? (isValid(q) ? [q] : []) : frontier.flatMap(extend);
      if (!frontier.length) break;
      cands = frontier.map((u) => ({ u, dirs: [1, -1] }));
    }
    cands.forEach((c) => { c.key = rank(c.u); });
    cands.sort((a, b) => compareRank(a.key, b.key));
    for (const c of cands.slice(0, limit - out.length)) out.push({ unit: c.u, code: dashed(c.u), dirs: c.dirs });
  }
  return out;
}

// ---- zoeken overal in de heen-regel, vanaf Ṗ (uitbreiding op §4.5 en §4.7, gekozen door de eigenaar) ----
// Elke oefening begint met haar laagste noot op Ṗ en loopt omhoog tot de rand van het bereik.
// Een reeks past als hij ergens in die heen-regel staat; de ingevoerde hoogte bepaalt dus niet waar de oefening begint.

const WORK_BUDGET = 100000; // shortcut: vast aantal knopen (geen tijd) houdt de uitkomst voor iedereen gelijk; verhogen als treffers ontbreken
const EDGE = TOP + 1; // aantal herhalingen waarna de heen-regel zeker stopt
// De volledige oefening vanaf Ṗ tot en met Ṡ.
export const fullExercise = (u) => exercise(u, 1, EDGE, TOP);
const heenFlat = (u) => fullExercise(u).heen.flat();
const allAt = (s, q) => { const r = []; for (let i = 0; i + q.length <= s.length; i++) if (q.every((x, j) => s[i + j] === x)) r.push(i); return r; };
const LOW = Array.from({ length: MAX_RANGE + 1 }, (_, p) => p);

// Alle geldige eenheden van lengte n (posities 0..8) met op de vaste plekken in `fixed` die waarde (null = vrij).
function fill(fixed, n, st, emit) {
  const u = [];
  const go = (i) => {
    if (i === n) { emit(u.slice()); return; }
    for (const v of fixed[i] === null ? LOW : [fixed[i]]) {
      if (st.budget-- <= 0) return;
      u.push(v);
      if (isValid(u)) go(i + 1);
      u.pop();
    }
  };
  go(0);
}

// Hoe ligt q (len noten, vanaf index `at` in de heen-regel) ten opzichte van de segmenten `parts` van een eenheid met n noten?
// 0 = q is precies één segment, 1 = q zit binnen één segment, 2 = q loopt over meerdere segmenten of over de herhaling heen.
function tierOf(parts, n, at, len) {
  const i0 = at % n, i1 = (at + len - 1) % n;
  if (Math.floor(at / n) !== Math.floor((at + len - 1) / n)) return 2;
  let start = 0;
  for (const p of parts) {
    const end = start + p.length;
    if (i0 < end) return i1 >= end ? 2 : i0 === start && len === p.length ? 0 : 1;
    start = end;
  }
}

// Eerste `limit` oefeningen (laagste noot op Ṗ) waarvan de heen-regel q bevat.
// Volgorde: eerst hoe q in de segmenten ligt (tier, zie tierOf), dan simpel -> complex (rank).
// `at` = index van q in de uitgeschreven heen-regel (bij meerdere plekken de beste tier, dan de eerste).
export function searchAnywhere(q, limit = MAX_RESULTS) {
  // Opeenvolgende noten in een heen-regel liggen tussen 8 lager en 9 hoger.
  if (!q.length || q.some((x, i) => x > TOP || (i && (x - q[i - 1] > 9 || q[i - 1] - x > 8)))) return [];
  const st = { budget: WORK_BUDGET }, pool = [];
  // Is q zelf één segment, dan kan tier 0 bestaan: zoek door tot er genoeg zijn. Anders is alles tier 2 en telt alleen de lengte.
  const wantTier = segCount(q) === 1 ? 0 : 2;
  const enough = () => pool.filter((c) => c.tier <= wantTier).length >= limit;
  for (let n = 1; n <= 27 && !enough() && st.budget > 0; n++) {
    const level = new Map();
    for (let o = 0; o + q.length <= EDGE * n; o++) {
      const fixed = Array(n).fill(null);
      const ok = q.every((x, j) => {
        const idx = (o + j) % n, v = x - Math.floor((o + j) / n);
        if (v < 0 || v > MAX_RANGE || (fixed[idx] !== null && fixed[idx] !== v)) return false;
        fixed[idx] = v;
        return true;
      });
      if (ok) fill(fixed, n, st, (u) => { if (Math.min(...u) === 0) level.set(u.join(), u); });
    }
    for (const u of level.values()) {
      const parts = split(u);
      const hits = allAt(heenFlat(u), q).map((at) => ({ at, tier: tierOf(parts, n, at, q.length) }));
      if (!hits.length) continue;
      const best = hits.reduce((a, h) => (h.tier < a.tier ? h : a));
      pool.push({ unit: u, code: dashed(u), key: rank(u), at: best.at, tier: best.tier });
    }
  }
  pool.sort((a, b) => a.tier - b.tier || compareRank(a.key, b.key));
  return pool.slice(0, limit).map(({ unit, code, at, tier }) => ({ unit, code, at, tier }));
}

// Totaal aantal passende eenheden (alleen voor tests; loopt de hele boom door).
export function count(q) {
  let total = 0;
  for (let n = 1; n < q.length; n++) {
    const u = q.slice(0, n);
    if (!isValid(u)) return total;
    if (matchDirs(q, u).length) total++;
  }
  const walk = (u) => { total++; extend(u).forEach(walk); };
  if (q.length && isValid(q)) walk(q);
  return total;
}

// ---- uitgeschreven oefening (§4.7) ----

// heen: eenheid + telkens één swar verder (max `cap` eenheden, stop bij de rand); terug: omgekeerd, per eenheid gespiegeld.
export function exercise(u, dir, cap = 8, top = MAX_POS) {
  const heen = [];
  for (let k = 0; k < cap; k++) {
    const v = u.map((x) => x + dir * k);
    if (Math.min(...v) < 0 || Math.max(...v) > top) break;
    heen.push(v);
  }
  const terug = heen.map((v) => { const m = Math.min(...v) + Math.max(...v); return v.map((x) => m - x); }).reverse();
  return { heen, terug };
}

// ---- random (§4.8) en URL (§4.9) ----

export function randomSeq(rnd = Math.random) {
  const len = 3 + Math.floor(rnd() * 4), q = [];
  while (q.length < len) {
    const lo = q.length ? Math.min(...q) : 0, hi = q.length ? Math.max(...q) : 0;
    const ok = Array.from({ length: TOP + 1 }, (_, p) => p).filter((p) => Math.max(hi, p) - Math.min(lo, p) <= MAX_RANGE);
    q.push(ok[Math.floor(rnd() * ok.length)]);
  }
  return q;
}

// ?s=34345: één hexcijfer per swar; ongeldige tekens genegeerd, maximaal MAX_LEN.
export const parseSeq = (s) => [...(s || '').toLowerCase()].filter((c) => /[0-9a-d]/.test(c)).slice(0, MAX_LEN).map((c) => parseInt(c, 16));
export const formatSeq = (q) => q.map((p) => p.toString(16)).join('');

// Opgeslagen verzameling: lijst codes (cijfers, laagste noot 0 = oefening vanaf Ṗ). Alles wat geen geldige code is, valt weg.
export function parseSaved(json) {
  let a;
  try { a = JSON.parse(json); } catch { return []; }
  const ok = (c) => typeof c === 'string' && /^[0-8]{1,27}$/.test(c) && isValid([...c].map(Number)) && c.includes('0');
  return Array.isArray(a) ? [...new Set(a.filter(ok))] : [];
}
