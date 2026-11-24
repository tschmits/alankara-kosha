import { MAX_LEN, swar, searchAnywhere, randomSeq, fullExercise, parseSeq, formatSeq } from './model.js';

// De punt is een CSS-element: bij combinatietekens zit hij te dicht op de letter en is hij niet te verschuiven.
const sw = (p) => (p < 3 || p > 9 ? `<i class="${p < 3 ? 'lo' : 'hi'}">${swar(p).normalize('NFD')[0]}</i>` : swar(p));
const sws = (u) => u.map(sw).join('');

// Alle teksten bij elkaar: taal wisselen (handover §8.6) = alleen dit object aanpassen.
const T = {
  hint: 'Tap swar to build a sequence',
  empty: 'Tap the swar above. You get up to 8 alankar that contain your sequence, simplest first. Every exercise starts on the lowest Ṗ and runs up to the upper Ṡ; your sequence is marked where it occurs. The link always holds your sequence, so you can share it.',
  none: 'No alankar with at most 3 segments fits this sequence.',
  out: 'Out', back: 'Back',
};

const $ = (id) => document.getElementById(id);
const NAMES = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'];
let q = parseSeq(new URLSearchParams(location.search).get('s'));

// Toetsen: positie 0..13 in twee rijen van 7.
$('keys').innerHTML = Array.from({ length: 14 }, (_, p) => {
  const oct = p < 3 ? 'mandra' : p > 9 ? 'taar' : 'madhya';
  return `<button type="button" data-p="${p}" class="${oct}" aria-label="${NAMES[(p + 4) % 7]} ${oct}">${sw(p)}</button>`;
}).join('');
$('seq').dataset.hint = T.hint;

// Markeert de noten [from, from+len) van de regel: de reeks die de gebruiker heeft aangetikt.
function line(units, from = 0, len = 0) {
  let i = 0;
  return units.map((v) => `<span class="u">${v.map((p) => (i++ >= from && i <= from + len ? `<mark>${sw(p)}</mark>` : sw(p))).join('')}</span>`).join(' ');
}

// Oefening vanaf Ṗ tot de rand; `at` = waar de ingevoerde reeks in de heen-regel staat.
function variant(unit, at) {
  const { heen, terug } = fullExercise(unit);
  return `<div class="variant">
    <p class="line"><b>${T.out}</b>${line(heen, at, q.length)}</p>
    <p class="line"><b>${T.back}</b>${line(terug)}</p></div>`;
}

function render() {
  $('seq').innerHTML = sws(q);
  history.replaceState(null, '', q.length ? `?s=${formatSeq(q)}` : location.pathname);
  const found = q.length ? searchAnywhere(q) : [];
  $('results').innerHTML = !q.length ? `<p class="note">${T.empty}</p>`
    : !found.length ? `<p class="note">${T.none}</p>`
    : `<ol>${found.map((r) => `<li class="card"><header><span class="code">${r.code}</span><span class="unit">${sws(r.unit)}</span></header>${variant(r.unit, r.at)}</li>`).join('')}</ol>`;
}

$('keys').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || q.length >= MAX_LEN) return;
  q.push(Number(b.dataset.p));
  render();
});
$('clear').addEventListener('click', () => { q = []; render(); });
$('random').addEventListener('click', () => { q = randomSeq(); render(); });

render();
