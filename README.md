# Alankara Kosha

अलङ्कारकोशः — a small web app for bansuri (and other Indian classical) players to find and collect **alankar**, the repeated-pattern exercises used in practice.

Tap a few swar and Alankara Kosha shows up to 8 exercises that contain your sequence, simplest first. Save the ones you like to a personal collection and print it on a slip of paper.

**Live:** <https://www.uplinkwebdev.nl/alankarakosha/>

## Features

- **Swar keys** for fourteen notes, from mandra Pa to taar Ma (Ṗ Ḍ Ṇ S R G M P D N Ṡ Ṙ Ġ Ṁ).
- **Search anywhere in the exercise.** Every result is written out as *aaroh* (up) and *awroh* (down), starting on the lowest Ṗ and ending on the upper Ṡ (the last unit ends on Ṡ). Your sequence is highlighted where it occurs.
- **Ordering:** results where your sequence is exactly one segment of the alankar come first, then those inside a segment, then those spanning several segments. Within a group, shorter and simpler alankar come first.
- **Share by link.** The sequence is in the URL (`?s=34345` is S R S R G), so the same link shows the same results on any device.
- **Collection.** Save results with ☆, remove them one by one or clear everything. The collection lives in your browser's `localStorage`; nothing is sent anywhere.
- **Print.** The collection prints compactly, in the site's colours, and stays readable in black and white.
- **Mobile first**, no build step, no backend, no tracking.

## How an alankar is described

An alankar is a short figure (the *unit*) repeated one swar higher each time, e.g. S R G, R G M, G M P …. A unit is written as a **code**: the notes shifted so the lowest is 0, e.g. `01012` for S R S R G.

A unit is valid when it has at most **3 segments** and spans at most 9 swar. Segments are:

| Kind | Rule | Example |
|---|---|---|
| Repeat | the same note 1–3 times | `0`, `00`, `000` |
| Pair | two different notes | `02`, `10` |
| Run | 3+ notes, each one step up (or down) | `012`, `3210` |

The code is shown with dashes between the segments, e.g. `01-012`. There are 1,577,049 valid codes; the search enumerates them on demand, so no precomputed table is needed.

## Run it locally

It is plain HTML, CSS and ES modules, so any static file server works:

```sh
python3 -m http.server 8080
# then open http://localhost:8080
```

(Opening `index.html` directly from disk does not work, because browsers block ES modules on `file://`.)

## Tests

The model is pure JavaScript with no dependencies, tested with Node's built-in test runner (Node 18+):

```sh
npm test
```

The tests check the exact code counts per segment count and length (33 / 8,365 / 1,568,651), the reference ranking for several sequences, the written-out exercises, the URL format and the stored collection.

## Files

| File | Purpose |
|---|---|
| `model.js` | Pure model: segments, validity, ranking, search, exercises, URL and storage parsing |
| `app.js` | UI: keys, results, collection, tabs, print |
| `index.html`, `style.css` | Markup and styles (including the print stylesheet) |
| `test/model.test.js` | Tests |

## Notes

- All UI strings are in the `T` object at the top of `app.js`, so translating is a one-place change.
- The search has a fixed work budget, so a sequence that fits nowhere returns quickly and every device gets the same result.

## License

[MIT](LICENSE)
