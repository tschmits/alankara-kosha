import { MAX_LEN, swar, swars, search, exercise, randomSeq, parseSeq, formatSeq } from './model.js';

// Alle teksten bij elkaar: taal wisselen (handover §8.6) = alleen dit object aanpassen.
const T = {
  hint: 'Tap swar to build a sequence',
  empty: 'Tap the swar above. You get up to 8 alankar that start with your sequence, simplest first. The link always holds your sequence, so you can share it.',
  none: 'No alankar with at most 3 segments fits this sequence.',
  up: 'Shifting up', down: 'Shifting down', out: 'Out', back: 'Back',
};

const $ = (id) => document.getElementById(id);
const NAMES = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'];
let q = parseSeq(new URLSearchParams(location.search).get('s'));

// Toetsen: positie 0..13 in twee rijen van 7.
$('keys').innerHTML = Array.from({ length: 14 }, (_, p) => {
  const oct = p < 3 ? 'mandra' : p > 9 ? 'taar' : 'madhya';
  return `<button type="button" data-p="${p}" class="${oct}" aria-label="${NAMES[(p + 4) % 7]} ${oct}">${swar(p)}</button>`;
}).join('');
$('seq').dataset.hint = T.hint;

// `marks` = aantal noten vooraan dat de gebruiker heeft aangetikt (gemarkeerd).
function line(units, marks) {
  let i = 0;
  return units.map((v) => `<span class="u">${v.map((p) => (i++ < marks ? `<mark>${swar(p)}</mark>` : swar(p))).join('')}</span>`).join(' ');
}

function variant(unit, dir) {
  const { heen, terug } = exercise(unit, dir);
  return `<div class="variant"><h3>${dir > 0 ? T.up : T.down}</h3>
    <p class="line"><b>${T.out}</b>${line(heen, q.length)}</p>
    <p class="line"><b>${T.back}</b>${line(terug, 0)}</p></div>`;
}

function render() {
  $('seq').textContent = q.map(swar).join('');
  history.replaceState(null, '', q.length ? `?s=${formatSeq(q)}` : location.pathname);
  const found = q.length ? search(q) : [];
  $('results').innerHTML = !q.length ? `<p class="note">${T.empty}</p>`
    : !found.length ? `<p class="note">${T.none}</p>`
    : `<ol>${found.map((r) => `<li class="card"><header><span class="code">${r.code}</span><span class="unit">${swars(r.unit)}</span></header>${r.dirs.map((d) => variant(r.unit, d)).join('')}</li>`).join('')}</ol>`;
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
