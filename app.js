import { MAX_LEN, swar, searchAnywhere, randomSeq, fullExercise, dashed, parseSeq, formatSeq, parseSaved } from './model.js';

// De punt is een CSS-element: bij combinatietekens zit hij te dicht op de letter en is hij niet te verschuiven.
const sw = (p) => (p < 3 || p > 9 ? `<i class="${p < 3 ? 'lo' : 'hi'}">${swar(p).normalize('NFD')[0]}</i>` : swar(p));
const sws = (u) => u.map(sw).join('');

// Alle teksten bij elkaar: taal wisselen (handover §8.6) = alleen dit object aanpassen.
const T = {
  hint: 'Tap swar to build a sequence',
  none: 'No alankar with at most 3 segments fits this sequence.',
  out: 'Aaroh', back: 'Awroh',
  save: 'Save to collection', unsave: 'Remove from collection', remove: 'Remove',
  emptyColl: 'Your collection is empty. Tap ☆ on a result to save it.',
};

const $ = (id) => document.getElementById(id);
const NAMES = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'];
const KEY = 'alankara-kosha';
let q = parseSeq(new URLSearchParams(location.search).get('s'));

// Verzameling: lijst codes (cijfers) in localStorage; blijft alleen op dit apparaat. Zonder opslag werkt de site nog, maar bewaart niets.
let saved = [];
try { saved = parseSaved(localStorage.getItem(KEY)); } catch { /* opslag geblokkeerd */ }
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* idem */ } };
const svg = (d, size = 16, fill = false) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const TRASH = svg('M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14M10 10v6M14 10v6');
const starSvg = (on) => svg('M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.2l-5.6 3.1 1.2-6.3L3 9.6l6.3-.8z', 16, on);
const PRINTER = svg('M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z');
const toUnit = (c) => [...c].map(Number);

// Toetsen: positie 0..13 in twee rijen van 7.
$('keys').innerHTML = Array.from({ length: 14 }, (_, p) => {
  const oct = p < 3 ? 'mandra' : p > 9 ? 'taar' : 'madhya';
  return `<button type="button" data-p="${p}" class="${oct}" aria-label="${NAMES[(p + 4) % 7]} ${oct}">${sw(p)}</button>`;
}).join('');
$('seq').dataset.hint = T.hint;
$('print').insertAdjacentHTML('afterbegin', PRINTER);
$('clear-all').insertAdjacentHTML('afterbegin', TRASH);

// Markeert de noten [from, from+len) van de regel: de reeks die de gebruiker heeft aangetikt.
function line(units, from = 0, len = 0) {
  let i = 0;
  return units.map((v) => `<span class="u">${v.map((p) => (i++ >= from && i <= from + len ? `<mark>${sw(p)}</mark>` : sw(p))).join('')}</span>`).join(' ');
}

// Eén kaart: oefening vanaf Ṗ tot de rand; [at, at+len) = waar de ingevoerde reeks in de heen-regel staat (len 0 = niets markeren).
function card(unit, act, at = 0, len = 0) {
  const { heen, terug } = fullExercise(unit);
  // --w: geschatte breedte van de regel in em; het print-lettertype krimpt daarmee zodat heen en terug op één regel passen.
  const w = Math.ceil(0.8 * (heen.flat().length + heen.length - 1));
  return `<li class="card"><header><span class="code">${dashed(unit)}</span><span class="unit">${sws(unit)}</span>${act}</header>
    <p class="line" style="--w:${w}"><b>${T.out}</b>${line(heen, at, len)}</p>
    <p class="line" style="--w:${w}"><b>${T.back}</b>${line(terug)}</p></li>`;
}

const star = (c) => {
  const on = saved.includes(c);
  return `<button type="button" class="act star" data-save="${c}" aria-pressed="${on}" aria-label="${on ? T.unsave : T.save}">${starSvg(on)}</button>`;
};

// De URL bewaart de reeks (?s=…) en het actieve tabblad (#collection), zodat verversen op dezelfde plek blijft.
let view = location.hash === '#collection' ? 'coll' : 'search';
const syncUrl = () => history.replaceState(null, '', (q.length ? `?s=${formatSeq(q)}` : location.pathname) + (view === 'coll' ? '#collection' : ''));

function render() {
  $('seq').innerHTML = sws(q);
  syncUrl();
  const found = q.length ? searchAnywhere(q) : [];
  $('results').innerHTML = !q.length ? ''
    : !found.length ? `<p class="note">${T.none}</p>`
    : `<ol>${found.map((r) => card(r.unit, star(r.unit.join('')), r.at, q.length)).join('')}</ol>`;
}

function renderCollection() {
  $('count').textContent = saved.length ? `(${saved.length})` : '';
  $('coll-list').innerHTML = saved.length
    ? saved.map((c) => card(toUnit(c), `<button type="button" class="act" data-remove="${c}" aria-label="${T.remove}">${TRASH}</button>`)).join('')
    : `<p class="note">${T.emptyColl}</p>`;
  $('coll-tools').hidden = !saved.length;
}

function show(v) {
  view = v;
  syncUrl();
  $('search-view').hidden = v !== 'search';
  $('coll-view').hidden = v !== 'coll';
  document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === v));
  if (v === 'coll') renderCollection();
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.p !== undefined) {
    if (q.length < MAX_LEN) { q.push(Number(b.dataset.p)); render(); }
  } else if (b.dataset.save) {
    const c = b.dataset.save, on = saved.includes(c);
    saved = on ? saved.filter((x) => x !== c) : [...saved, c];
    persist();
    b.outerHTML = star(c);
    renderCollection();
  } else if (b.dataset.remove) {
    saved = saved.filter((x) => x !== b.dataset.remove);
    persist();
    renderCollection();
  } else if (b.dataset.view) show(b.dataset.view);
  else if (b.id === 'guru') { const l = $('guru-links'); l.hidden = !l.hidden; b.setAttribute('aria-expanded', !l.hidden); }
  else if (b.id === 'clear') { q = []; render(); }
  else if (b.id === 'random') { q = randomSeq(); render(); }
  else if (b.id === 'print') window.print();
  else if (b.id === 'clear-all') { saved = []; persist(); renderCollection(); }
});

render();
renderCollection();
show(view);
