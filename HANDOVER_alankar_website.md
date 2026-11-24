# Handover: alankar-zoeker (website)

Deze handover is bedoeld voor Claude Code. Hij is zelfstandig leesbaar: alle regels, voorbeelden en testwaarden staan erin.

## 1. Doel

Een statische website voor bansuri-oefeningen. De gebruiker tikt een reeks swar (noten) aan en ziet direct maximaal 8 alankar die met die reeks beginnen, van simpel naar complex. De reeks staat in de URL, zodat iemand anders via de link exact hetzelfde ziet.

## 2. Begrippen

- **Swar**: de zeven noten S R G M P D N (Sa Re Ga Ma Pa Dha Ni). Alleen deze zeven; geen komal of tivra.
- **Saptak**: octaaf. Mandra (laag, punt onder de letter), madhya (midden, geen punt), taar (hoog, punt boven de letter).
- **Alankar**: een oefening waarin één korte figuur (de **eenheid**) herhaald wordt, elke keer één swar hoger of één swar lager. Voorbeeld: SRG RGM GMP MPD …
- **Aaroh / awroh**: de stijgende en de dalende helft van een oefening.

## 3. Wat de site moet doen

1. **Swar-knoppen.** Veertien knoppen, van mandra Pa t/m taar Ma, in deze volgorde:
   `Ṗ Ḍ Ṇ S R G M P D N Ṡ Ṙ Ġ Ṁ`
2. **Reeks opbouwen.** Elke klik voegt die swar toe aan het einde van de reeks. De reeks is zichtbaar boven de resultaten.
3. **Resultaten.** Onder de reeks staan maximaal 8 alankar die aan de reeks voldoen (regels in §4), gesorteerd van simpel naar complex. De lijst wordt na elke klik bijgewerkt.
4. **Wissen.** Een kruis wist de hele reeks.
5. **Random.** Een knop "Random" kiest een willekeurige reeks (regels in §4.8) en toont de resultaten daarvan.
6. **Delen.** De URL bevat altijd de huidige reeks. Wie de URL opent, ziet dezelfde reeks en dezelfde resultaten.

Lege reeks: toon geen resultaten, alleen een korte uitleg. Reeks zonder treffers: toon een melding dat er geen alankar met maximaal 3 segmenten bij past.

## 4. Het model

### 4.1 Posities

Elke swar heeft een positie 0 t/m 13:

| Positie | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Swar | Ṗ | Ḍ | Ṇ | S | R | G | M | P | D | N | Ṡ | Ṙ | Ġ | Ṁ |

Een stap van één swar is +1 of −1 in positie. Schrijfwijze: punt onder (U+0323) voor mandra, punt boven (U+0307) voor taar.

### 4.2 Eenheid en code

Een eenheid is een rij posities. De **code** van een eenheid is dezelfde rij, verschoven zodat de laagste noot 0 is, geschreven als cijfers. Voorbeelden: S R S R G → `01012`, G R S → `210`, S G R G → `0212`.

### 4.3 Basis-segmenten

Drie soorten. Een segment mag op elke hoogte staan (`12` is `01` één swar hoger).

| Soort | Regel | Voorbeelden |
|---|---|---|
| Tongslag | 1, 2 of 3 keer dezelfde noot | `0`, `00`, `000` |
| Paar | 2 verschillende noten, elke sprong | `01`, `02`, `08`, `10`, `80` |
| Loop | 3 of meer noten, steeds +1 of steeds −1 | `012`, `0123`, `210`, `876543210` |

### 4.4 Geldige eenheid

Een eenheid is geldig als:

- de code alleen cijfers 0 t/m 8 bevat (hoogste min laagste noot ≤ 8), en
- de rij te splitsen is in maximaal 3 opeenvolgende basis-segmenten (segmenten delen geen noten), en
- alle noten binnen positie 0 t/m 13 vallen.

**Testwaarden.** Het aantal verschillende codes (zonder de derde voorwaarde) is exact:

| Minimaal aantal segmenten | Codes |
|---|---|
| 1 | 33 |
| 2 | 8.365 |
| 3 | 1.568.651 |
| Totaal | 1.577.049 |

Per lengte: 1 noot: 1, 2 noten: 17, 3: 217, 4: 2.465, 5: 26.281, 6: 269.297, 7: 202.189. De langste code heeft 27 noten; daarvan zijn er 8. Tot en met 6 noten is elke rij met bereik ≤ 8 geldig.

### 4.5 Wanneer voldoet een alankar aan de reeks

Een kandidaat is een eenheid `u` (lengte n) plus een schuifrichting `r` (+1 = omhoog, −1 = omlaag). De notenstroom daarvan is:

```
t[i] = u[i mod n] + r · floor(i / n)
```

De kandidaat voldoet aan reeks `q` (lengte L) als `t[i] = q[i]` voor alle i < L, en `u` een geldige eenheid is.

Gevolgen:

- De eerste noot van de eenheid is altijd de eerste aangetikte swar.
- Is de eenheid minstens zo lang als de reeks, dan begint de eenheid met de reeks en voldoen beide richtingen.
- Is de eenheid korter, dan moet de rest van de reeks kloppen met de verschoven herhaling. S R S R G voldoet zo aan eenheid S R S omhoog (SRS RGR …).

### 4.6 Rangorde (simpel → complex)

Sorteer eenheden op, in deze volgorde:

1. aantal noten in de eenheid (minder eerst)
2. minimaal aantal segmenten (minder eerst)
3. grootste sprong binnen de eenheid (kleiner eerst)
4. som van alle sprongen binnen de eenheid, absoluut (kleiner eerst)
5. de code als tekst, oplopend

Toon de eerste 8 **eenheden**. Voldoen beide richtingen, dan is dat één resultaat met twee varianten (omhoog en omlaag), niet twee resultaten. De rangorde moet volledig vastliggen, anders zien twee mensen met dezelfde URL niet hetzelfde.

Zet de rangorde in één losse functie; de eigenaar wil hier mogelijk nog aan draaien (zie §8).

### 4.7 Wat een resultaat toont

- De **code met streepjes** tussen de segmenten, bijvoorbeeld `01-012`. Kies de splitsing met het minste aantal segmenten; bij gelijke stand het langste eerste segment, daarna het langste tweede.
  Voorbeelden: `010` → `01-0`, `01210` → `012-10`, `01222210` → `012-222-10`, `10213243` → `10-21-32-43`.
- De **eenheid in swar**.
- Per variant (omhoog / omlaag) de **uitgeschreven oefening** in twee regels:
  - **Heen**: de eenheid, dan telkens één swar verder in de schuifrichting. Stop na de eenheid die een octaaf (7 swar) verder begint, of eerder als de volgende eenheid buiten positie 0–13 valt. Maximaal 8 eenheden dus.
  - **Terug**: de eenheden van de heen-regel in omgekeerde volgorde, elk gespiegeld binnen zijn eigen noten: `noot → laagste + hoogste − noot`.
- Markeer in de heen-regel de noten die de gebruiker heeft aangetikt.

Uitgewerkt voorbeeld, eenheid S R S R G omhoog:

```
heen:  SRSRG RGRGM GMGMP MPMPD PDPDN DNDNṠ NṠNṠṘ ṠṘṠṘĠ
terug: ĠṘĠṘṠ ṘṠṘṠN ṠNṠND NDNDP DPDPM PMPMG MGMGR GRGRS
```

Eenheid Ṡ N D omlaag:

```
heen:  ṠND NDP DPM PMG MGR GRS RSṆ SṆḌ
terug: ḌṆS ṆSR SRG RGM GMP MPD PDN DNṠ
```

Eenheid Ṡ Ṙ Ṡ Ṙ Ġ omhoog (loopt tegen de bovengrens):

```
heen:  ṠṘṠṘĠ ṘĠṘĠṀ
terug: ṀĠṀĠṘ ĠṘĠṘṠ
```

### 4.8 Random

Kies een lengte van 3 t/m 6 swar. Kies de swar willekeurig binnen positie 0–13, zo dat hoogste min laagste ≤ 8 blijft. Zo'n reeks heeft altijd minstens één treffer (zie §4.4). Na "Random" staat de nieuwe reeks ook in de URL.

### 4.9 URL

- Parameter `s`: één hexadecimaal cijfer per swar, de positie uit §4.1. S R S R G → `?s=34345`, Ṡ N D → `?s=a98`.
- Lege reeks: geen parameter.
- Werk de URL bij na elke wijziging (`history.replaceState`). Lees hem bij het laden. Negeer ongeldige tekens.
- Maximale reekslengte: 32 swar. Daarna doen de knoppen niets meer.
- De resultaten volgen volledig uit de reeks; er is geen andere toestand.

## 5. Testgevallen

Verwachte eerste 8 resultaten met de rangorde uit §4.6. "Aantal" is het totale aantal eenheden dat voldoet.

| Reeks | `s` | Aantal | Eerste 8 (code, eenheid, varianten) |
|---|---|---|---|
| S R | `34` | 296.445 | `0` S (omhoog), `01` SR (beide), `012` SRG (beide), `01-1` SRR (beide), `01-0` SRS (beide), `01-3` SRM (beide), `12-0` SRṆ (beide), `01-4` SRP (beide) |
| S R S R G | `34345` | 1.461 | `01-0` SRS (omhoog), `01-012` SRSRG (beide), `01-0123` SRSRGM (beide), `01-012-2` SRSRGG (beide), `01-012-1` SRSRGR (beide), `01-012-0` SRSRGS (beide), `01-012-4` SRSRGP (beide), `01-012-5` SRSRGD (beide) |
| S G R G | `3545` | 1.460 | `02-12` SGRG (beide), `02-123` SGRGM (beide), `02-12-2` SGRGG (beide), `02-12-1` SGRGR (beide), `02-12-0` SGRGS (beide), `02-12-4` SGRGP (beide), `02-12-5` SGRGD (beide), `13-23-0` SGRGṆ (beide) |
| Ṡ N D | `a98` | 254.197 | `0` Ṡ (omlaag), `210` ṠND (beide), `3210` ṠNDP (beide), `210-0` ṠNDD (beide), `210-1` ṠNDN (beide), `210-2` ṠNDṠ (beide), `432-0` ṠNDM (beide), `210-3` ṠNDṘ (beide) |
| S R R G | `3445` | 1.461 | `01` SR (omhoog), `01-12` SRRG (beide), `01-123` SRRGM (beide), `01-12-2` SRRGG (beide), `01-12-1` SRRGR (beide), `01-12-0` SRRGS (beide), `01-12-4` SRRGP (beide), `01-12-5` SRRGD (beide) |
| S G P | `357` | 4.611 | `02-4` SGP (beide), `02-44` SGPP (beide), `02-43` SGPM (beide), `02-45` SGPD (beide), `02-42` SGPG (beide), `02-46` SGPN (beide), `02-41` SGPR (beide), `02-47` SGPṠ (beide) |
| Ṗ Ḍ Ṗ Ḍ Ṗ Ḍ Ṇ S Ḍ | `010101231` | 1 | `01-01-0123` ṖḌṖḌṖḌṆS (omhoog) |
| S Ṁ Ṗ | `3d0` | 0 | geen |

Bekende oefeningen uit het lesmateriaal, als extra controle op code en splitsing:

| Eenheid | Code |
|---|---|
| S R G | `012` |
| S G | `02` |
| S R S R G | `01-012` |
| S R S R S R G M | `01-01-0123` |
| S R G G G G R S | `012-222-10` |
| S R S R G M G R | `01-0123-21` |
| S R G R S G R G | `012-10-21-2` (4 segmenten: niet geldig) |
| S Ṇ R S G R M G | `10-21-32-43` (4 segmenten: niet geldig) |

## 6. Techniek

Voorstel; wijk af als de eigenaar een andere voorkeur heeft.

- **Statische site, geen backend.** Alle toestand zit in de URL. Geen accounts, geen tracking.
- **TypeScript + Vite + Vitest.** Houd het model (§4) in een losse module met pure functies en test die los van de UI.
- **Zoeken.** Er zijn 1.577.049 codes; dat is te doen in de browser, maar vraagt een bewuste aanpak. Twee werkbare routes:
  1. Maak de volledige lijst één keer, gesorteerd op rangorde, in compacte arrays (bijvoorbeeld één `Uint8Array` met alle cijfers plus een array met startposities; samen ruwweg 20 MB). Per klik: lineair doorlopen en stoppen na 8 eenheden. Bouw de lijst tijdens de build of in een Web Worker. Let op geheugen bij het ontdubbelen (verschillende splitsingen geven dezelfde code).
  2. Zoek gericht: eenheden korter dan de reeks zijn hooguit L−1 kandidaten per richting; langere eenheden beginnen met de reeks, dus alleen de aanvulling hoeft doorzocht te worden, in volgorde van lengte. Een prefix van een geldige eenheid is zelf geldig, dus snoeien kan vroeg.
- **Snelheid.** Resultaten binnen 100 ms na een klik, ook op een telefoon. De eerste resultaten binnen 1 seconde na het laden.
- **Mobiel eerst.** De site wordt gebruikt met een fluit in de hand: grote knoppen, goed leesbare swar, geen hover-afhankelijke bediening.
- **Lettertype.** Controleer dat de combinatietekens (punt boven en onder) goed renderen op iOS, Android en desktop.

## 7. Klaar wanneer

- Alle zes punten uit §3 werken.
- De telwaarden uit §4.4 en alle rijen uit §5 zijn geautomatiseerde tests en slagen.
- Dezelfde URL geeft op twee apparaten dezelfde reeks en dezelfde 8 resultaten.
- "Random" geeft nooit een reeks zonder treffers.
- De site werkt op een telefoon in staande stand.

## 8. Open keuzes

Deze punten zijn door de schrijver van de handover ingevuld en nog niet door de eigenaar bevestigd. Bouw ze zo dat ze makkelijk te wijzigen zijn, en vraag bij twijfel na.

1. **"Voldoen aan de reeks"** is uitgelegd als: de oefening begint met precies deze swar (§4.5).
2. **Rangorde** (§4.6): lengte eerst, dan aantal segmenten. Het alternatief is aantal segmenten eerst; dat geeft vooral steeds langere loopjes.
3. **Omhoog en omlaag** tellen samen als één resultaat (§4.6).
4. **Einde van de oefening**: een octaaf verder of de rand van het bereik (§4.7).
5. **Terug-regel**: gespiegeld per eenheid (§4.7). In het lesmateriaal komen ook andere varianten voor.
6. **Taal van de site**: Engels, met de Hindi-termen uit de lessen.
7. **Extra's die niet gevraagd zijn**: laatste swar wissen, knop "kopieer link", geluid. Niet bouwen zonder overleg.
8. **Naam, hosting en repository** zijn nog niet gekozen.

## 9. Achtergrond

Niet nodig om te bouwen, wel nuttig als context. In `/Users/tschmits/Documents/bansuri/`:

- `Jatil_alankar_cijfercode.md`: de oefeningen van de leraar in cijfercode.
- `alankar_codes_max3.csv`: alle 1.577.049 codes (220 MB). Niet in de site opnemen; de lijst volgt uit de regels in §4.
