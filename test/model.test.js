// Tests uit handover §4.4, §4.7, §4.8, §4.9 en §5. Draaien: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  segCount, split, searchAnywhere, parseSaved, fullExercise, dashed, isValid, search, count, exercise, randomSeq, parseSeq, formatSeq, swars,
} from '../model.js';

const digits = (s) => [...s].map(Number);
const nfc = (s) => s.normalize('NFC');

test('§4.4: aantal codes per segmentaantal en per lengte', () => {
  const bySegs = [0, 0, 0, 0], byLen = new Map();
  const u = [];
  const walk = (min) => {
    if (u.length && min === 0) { // laagste noot 0 = een echte code
      bySegs[segCount(u)]++;
      byLen.set(u.length, (byLen.get(u.length) || 0) + 1);
    }
    for (let v = 0; v <= 8; v++) {
      u.push(v);
      if (segCount(u) <= 3) walk(Math.min(min, v));
      u.pop();
    }
  };
  walk(9);
  assert.deepEqual(bySegs.slice(1), [33, 8365, 1568651]);
  [1, 17, 217, 2465, 26281, 269297, 202189].forEach((c, i) => assert.equal(byLen.get(i + 1), c, `lengte ${i + 1}`));
  assert.equal(Math.max(...byLen.keys()), 27);
  assert.equal(byLen.get(27), 8);
  for (let l = 1; l <= 6; l++) assert.equal(byLen.get(l), 9 ** l - 8 ** l); // elke rij met bereik <= 8 is geldig
});

test('§4.7 en §5: splitsing met streepjes (lesmateriaal)', () => {
  const rows = {
    '010': '01-0', '01210': '012-10', '01222210': '012-222-10', '012': '012', '02': '02',
    '01012': '01-012', '01010123': '01-01-0123', '01012321': '01-0123-21',
  };
  for (const [c, want] of Object.entries(rows)) {
    assert.equal(dashed(digits(c)), want, c);
    assert.ok(isValid(digits(c)), c);
  }
  // 4 segmenten: niet geldig
  assert.equal(dashed(digits('01210212')), '012-10-21-2');
  assert.equal(dashed(digits('10213243')), '10-21-32-43');
  for (const c of ['01210212', '10213243']) {
    assert.equal(segCount(digits(c)), 4, c);
    assert.equal(isValid(digits(c)), false, c);
    assert.equal(split(digits(c)).length, 4, c);
  }
});

const cases = [
  ['34', 296445, ['0:u', '01:b', '012:b', '01-1:b', '01-0:b', '01-3:b', '12-0:b', '01-4:b']],
  ['34345', 1461, ['01-0:u', '01-012:b', '01-0123:b', '01-012-2:b', '01-012-1:b', '01-012-0:b', '01-012-4:b', '01-012-5:b']],
  ['3545', 1460, ['02-12:b', '02-123:b', '02-12-2:b', '02-12-1:b', '02-12-0:b', '02-12-4:b', '02-12-5:b', '13-23-0:b']],
  ['a98', 254197, ['0:d', '210:b', '3210:b', '210-0:b', '210-1:b', '210-2:b', '432-0:b', '210-3:b']],
  ['3445', 1461, ['01:u', '01-12:b', '01-123:b', '01-12-2:b', '01-12-1:b', '01-12-0:b', '01-12-4:b', '01-12-5:b']],
  ['357', 4611, ['02-4:b', '02-44:b', '02-43:b', '02-45:b', '02-42:b', '02-46:b', '02-41:b', '02-47:b']],
  ['010101231', 1, ['01-01-0123:u']],
  ['3d0', 0, []],
];
for (const [s, total, first] of cases) {
  test(`§5: reeks ?s=${s}`, () => {
    const q = parseSeq(s);
    const got = search(q).map((r) => `${r.code}:${r.dirs.length === 2 ? 'b' : r.dirs[0] > 0 ? 'u' : 'd'}`);
    assert.deepEqual(got, first);
    assert.equal(count(q), total);
  });
}

test('§4.7: uitgeschreven oefening', () => {
  const show = (u, d) => {
    const e = exercise(u, d), f = (l) => l.map(swars).join(' ');
    return [f(e.heen), f(e.terug)].map(nfc);
  };
  assert.deepEqual(show(parseSeq('34345'), 1), [
    'SRSRG RGRGM GMGMP MPMPD PDPDN DNDNṠ NṠNṠṘ ṠṘṠṘĠ',
    'ĠṘĠṘṠ ṘṠṘṠN ṠNṠND NDNDP DPDPM PMPMG MGMGR GRGRS'].map(nfc));
  assert.deepEqual(show(parseSeq('a98'), -1), [
    'ṠND NDP DPM PMG MGR GRS RSṆ SṆḌ',
    'ḌṆS ṆSR SRG RGM GMP MPD PDN DNṠ'].map(nfc));
  assert.deepEqual(show([10, 11, 10, 11, 12], 1), ['ṠṘṠṘĠ ṘĠṘĠṀ', 'ṀĠṀĠṘ ĠṘĠṘṠ'].map(nfc));
});

test('§4.8: random geeft nooit een reeks zonder treffers', () => {
  for (let i = 0; i < 2000; i++) {
    const q = randomSeq();
    assert.ok(q.length >= 3 && q.length <= 6);
    assert.ok(search(q).length >= 1, q.join());
  }
});

test('§4.9: URL', () => {
  assert.deepEqual(parseSeq('34345'), [3, 4, 3, 4, 5]);
  assert.deepEqual(parseSeq('3x4!e5Z'), [3, 4, 5]); // ongeldige tekens genegeerd
  assert.equal(parseSeq('a'.repeat(40)).length, 32);
  assert.equal(formatSeq([10, 9, 8]), 'a98');
  assert.equal(formatSeq([]), '');
});

test('overal in de heen-regel vanaf Ṗ', () => {
  for (const s of ['010101231', '3d0', '34', '3545', '5a', '0000', '7773', 'd0', '9', 'd', '431360']) {
    const q = parseSeq(s), res = searchAnywhere(q);
    assert.equal(new Set(res.map((r) => r.code)).size, res.length, s);
    assert.ok(res.length <= 8);
    for (const r of res) {
      assert.equal(Math.min(...r.unit), 0, `${s} ${r.code}: begint op Ṗ`);
      const flat = fullExercise(r.unit).heen.flat();
      assert.deepEqual(flat.slice(r.at, r.at + q.length), q, `${s} ${r.code}`);
    }
  }
  // q = SRG is precies één segment (loop 012): die resultaten staan bovenaan, daarna pas de rest
  const srg = searchAnywhere(parseSeq('345'));
  assert.equal(srg[0].code, '012');
  assert.deepEqual(srg.map((r) => r.tier), [...srg.map((r) => r.tier)].sort());
  assert.ok(srg.slice(0, 4).every((r) => r.tier === 0));
  assert.ok(searchAnywhere(parseSeq('3434')).every((r) => r.tier === 2)); // geen segment: alles over meerdere segmenten
  // de eenheid die precies de reeks is staat bovenaan, ook als kortere eenheden dezelfde noten geven (DPNDSN: `10` geeft ze ook)
  assert.equal(searchAnywhere(parseSeq('102132'))[0].code, '10-21-32');
  assert.equal(searchAnywhere(parseSeq('546576'))[0].code, '10-21-32'); // zelfde patroon op andere hoogte
  assert.deepEqual(searchAnywhere(parseSeq('d')), []); // boven Ṡ komt geen oefening
  assert.deepEqual(fullExercise([0]).heen.at(-1), [10]); // eindigt op de taar Sa
  assert.deepEqual(searchAnywhere(parseSeq('3d0')), []); // sprong > 9 past nergens
  assert.equal(searchAnywhere(parseSeq('9'))[0].code, '0'); // N invoeren: resultaat 0 begint toch op Ṗ
  assert.equal(searchAnywhere(parseSeq('9'))[0].unit[0], 0);
  const t = Date.now();
  for (let i = 0; i < 200; i++) assert.ok(searchAnywhere(randomSeq()).length >= 1);
  assert.ok(Date.now() - t < 5000);
});

test('verzameling: alleen geldige codes uit opslag', () => {
  assert.deepEqual(parseSaved('["012","012","01-1","9","0123456789","1","<b>","01210212",5]'), ['012']);
  assert.deepEqual(parseSaved('["0","01012"]'), ['0', '01012']);
  assert.deepEqual(parseSaved('kapot'), []);
  assert.deepEqual(parseSaved(null), []);
  assert.deepEqual(parseSaved('{"a":1}'), []);
});
