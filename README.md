# CarbX

Exchange-list calculator for the foods the printed lists do not cover. Enter a
nutrition label and CarbX works out which food group it belongs to and how many
exchanges the portion holds, for diabetes, kidney and weight loss diets, in five
languages.

### [carbx.gmiliarakis.com](https://carbx.gmiliarakis.com)

![An oat drink entered into CarbX. It is counted as 1 starch and 1.5 fat
exchanges, with the reason given as "it is a plant-based food; the US exchange
list relies on its carbohydrates rather than its milk-resembling
characteristics". The kidney diet switch is on, so the ingredient scan has
flagged the dipotassium phosphate in it as an additive phosphate
source.](docs/carbx.png)

✅ no account needed\
✅ no backend\
✅ no API keys\
✅ no data stored\
✅ no analytics

## What this is, and what it is not

CarbX is a teaching and self-management aid. It converts a nutrition
declaration into exchanges and flags what a diabetes or kidney diet watches.

It is not a medical device. It does not calculate insulin doses. It does not
replace assessment by a dietitian, and it holds no clinical
context: it knows nothing about the person eating the food, their renal
function, their insulin regimen or their targets. Every figure it shows is
derived from the label you gave it, so a mistyped or misread label produces a
confident wrong answer. Check parsed values against the pack before acting on
them.


## Usage

**1. Insert the nutritional values in four ways:**

i. **Manually**\
ii. **Paste the text** copied off a pack, a website or a
database entry in English, Dutch, German,
French and Greek.\
iii. **Read from photo** with local OCR\
iv. **Search Open Food Facts.** Look up by name in Dutch, Greek, Belgian, German and French databases.

**2. Set the portion size and convention.** Portion in grams, and 15 g or 10 g of carbohydrate per exchange.

**3. Read output**
   - exchanges per portion
   - grams of this food per exchange
   - flags on sodium, sugars, fibre, saturated fat, potassium and phosphorus, and on rounding drift

Macronutrients (carbohydrate, protein and fat) are the only required fields. Paste the ingredients list to scan for phosphate, potassium, sodium and sugar additives.

Each result says which group it was counted as and whether the name or the figures decided it. The assigned group can always be overridden. Where rounding to half exchanges costs more than a tenth of the energy, the portion is flagged as rough.

## Terminology

**Food group** is the list a food is counted from: starch, fruit, milk,
non-starchy vegetables, sweets and other carbohydrates, protein, fat.
**Exchange** is the countable unit drawn from it: "1.5 milk exchanges, 300 g
each".

Two synonyms are worth knowing, because the sources use them. The 2007 list
counts in "1 carbohydrate, 1 fat" in its tables but says *choice* in its prose
("1 fruit choice is equivalent to", "1 milk choice contains", "add an extra fat
choice"), and later editions dropped "exchange" from the title altogether.
Greek clinical practice says *ισοδύναμα*, literally "equivalents" rather than
"exchanges": English named the unit after swapping foods between lists, Greek
after their equal value. A Greek interface should use ισοδύναμα and never a
calque such as *ανταλλαγές*.

## Reference

The table is the US reference, scaled by `unit / 15` to serve all three conventions.

| Group              | CHO g | Protein g | Fat g |
| ------------------ | ----- | --------- | ----- |
| Starch             | 15    | 3         | 1     |
| Fruit              | 15    | 0         | 0     |
| Milk               | 12    | 8         | 0     |
| Non-starchy veg    | 5     | 2         | 0     |
| Sweets and other carbs | 15 | 0 | 0 |

A protein exchange is 7 g of protein. The fat alongside it sets the tier: up to 3 g is lean (2 g fat), above 3 up to 7 is medium (5 g), above 7 is high (8 g). A
fat exchange is 5 g.

`decompose()` runs two stages, the second on the residual the first left:

1. **Carbohydrate.** If >0.4 g available, draws `cho / group.cho` exchanges, consuming the carbohydrate exactly. The group's protein and fat net off too, capped at what the food holds. `protein-only` and `fat-only` are classifications rather than table entries, so their carbohydrate is skipped here and never enters an exchange. The protein stage is skipped for `fat-only` and for `sweet`: the exchange list writes both as carbohydrate or fat and never as protein, so a chocolate bar's few grams of protein must not become a protein exchange and absorb the food's fat with it.
2. **Protein, then fat.** Above 1.2 g residual protein, `protein / 7` exchanges at the tier its residual fat implies. Above 1.2 g residual fat, `fat / 5`.

Counts are computed unrounded, then rounded to the nearest half, ties up.
Anything rounding to 0 is dropped. `gramsPerExchange()` inverts one exchange
against the food's per-100 g composition, independent of portion, and returns
null when the food has none of that macro.

## Classification

`inferGroupWithReason()` returns the group together with how it reached it:
`name` when a keyword settled it, `composition` when the figures did, `default`
when neither matched. The app shows this, so a reader can see which of the two
produced the answer. `inferGroup()` returns the group alone.

A name is never trusted on its own. Each keyword branch carries a composition
gate, because a food word is often a flavour: apple pie, banana bread, milk
chocolate, olive bread.

| # | Test | Result |
| - | ---- | ------ |
| 1 | plant-dairy keyword, CHO at least 2 g | `starch` |
| 1b | plant-dairy keyword, CHO under 2 g, protein at least 2 g | `protein-only` |
| 2 | fat keyword, and either fat leads 60% of the energy or CHO and protein are both under 5 g | `fat-only` |
| 3 | dairy keyword, protein standing in a milk-like ratio to the carbohydrate, and either both above 2 g or the portion carrying a full milk exchange of protein | `milk` |
| 4 | protein, fruit, vegetable, sweets and starch keywords, ranked by longest match, each with its own gate | the first whose gate passes |
| 5 | over 70% of energy from fat, CHO and protein under 5 g | `fat-only` |
| 6 | over 75% of energy from fat, protein under 2 g, CHO under 15 g | `fat-only` |
| 7 | CHO 2 to 15 g, no fibre, sugars at least 70% of CHO, milk-like protein ratio | `milk` |
| 8 | over 40% of energy from protein, CHO under 5 g | `protein-only` |
| 9 | CHO at least 2 g, sugars at least 90% of CHO, protein and fat under 1 g, little or no fibre | `sweet` |
| 10 | CHO under 2 g, protein above 5 g | `protein-only` |
| 11 | CHO up to 8 g, fat under 3 g, vegetable-like protein ratio | `veg` |
| 12 | CHO 8 to 35 g, fat under 3 g, fibre at least 0.3 g, sugars at least 45% of CHO, almost no protein | `fruit` |
|  | nothing matched | `starch` |

Rule 12 catches fruit named in a language the keyword list does not cover. The
fibre floor keeps sugary drinks and honey out. Dried fruit exceeds the upper
bound and depends on the name list.

Rule 6 exists because of imitation cheeses: coconut oil and starch, no protein
at all, under a name that reads as dairy. Without it they reached the starch
default. Rule 4's ranking by longest keyword is what makes "aardappel" beat
"appel", "buttermilk" beat "butter" and "green bean" beat "bean".

The Dutch stems `ei` (egg) and `vis` (fish) match at a word start only, so
`protein` and `provisions` do not trigger the protein branch.

### Plant dairy

Rule 1 runs ahead of the fat and dairy rules, which both win outright, because
every plant-drink name contains one of their keywords: "almond" inside "almond
milk", "milk" inside "oat milk". Ordered the other way, a sweetened almond drink
matched the nut list and its carbohydrate went uncounted.

**No plant drink counts as a milk exchange, soy included.** The 2007 list
settles this in its Dairy-Like Foods section, which counts a cup of plain rice
drink as "1 carbohydrate" and a cup of plain soy milk as "1 carbohydrate and
1 fat". Where the list means a milk exchange it writes one, as it does two
entries above for chocolate milk: "1 fat-free milk and 1 carbohydrate". So a
plant drink is counted on the carbohydrate it carries, and its protein and fat
fall out in the later stages instead of being absorbed into a milk exchange.
An unsweetened soy drink therefore comes out as carbohydrate plus a protein
exchange, which is closer to what is in it than half a milk exchange would be.

This is worth knowing if you expected soy to behave as a dairy swap. It is a
substitute in the kitchen, and the exchange list still does not count it as one.

Two deliberate exclusions. `coconut milk` is not a plant-drink name, so canned
coconut milk at 21 g of fat stays on the fat list where it belongs; `coconut
drink` is. An unsweetened almond drink carries so little of anything that it
falls through to the composition rules and rounds away to a free food, which is
what it is.

Yoghurts and creams are in the same list as the drinks, since the 2007 list
treats the whole Dairy-Like Foods category the same way. One extra branch
handles them: a plain soy yoghurt carries about 1 g of carbohydrate against 4 g
of protein, which satisfies the vegetable rule, so without the name it was
counted as a vegetable. Under 2 g of carbohydrate with protein present, plant
dairy counts as protein.

Names are the full compound, `havermelk` rather than `haver`, so the
longest-match ranking keeps oats, rice and almonds themselves on their own
lists.

Other vegan foods do not need a rule of their own: tofu, tempeh and seitan are
on the protein list, falafel, hummus and edamame on the starch list beside the
other legumes, and coconut-oil cheese analogues are caught by rule 6 on
composition alone.

The sweets list used to live inside the starch keyword list, since both carry
15 g of carbohydrate. They are separate now, because they do not carry the same
protein and fat: a starch exchange is charged 3 g of protein and 1 g of fat,
which a soft drink or a spoon of honey plainly does not have. Membership
follows the 2007 list, so bread, pancakes, waffles and croissants stay on
starch while doughnuts, muffins and sweet rolls do not. Known gap: sweets are
reached by name, so a dessert worded outside the keyword lists still falls to
starch.

## Label parser

`parseNutritionText()` finds a keyword in one of five languages, then takes the
first number within 15 non-digit characters after it, accepting comma or point
decimals. English, Dutch, German, French and Greek, including both `fibre` and
`fiber`. Ingredients run from the first ingredients heading to the next blank
line, whitespace-collapsed, truncated at 800 characters.

Basis detection reports `100ml`, `100g` or `serving`, preferring per-100 ml, and
defaults to `100g`. It reports only and never converts, so a per-serving label
needs converting by hand.

Each field takes the first match in the document, so a two-column label printing
per-100 g beside per-serving can take the wrong column.

**OCR** is [tesseract.js](https://github.com/naptha/tesseract.js) 7, defaulting
to `eng+nld+deu+fra+ell` and selectable per language. Recognition is local, but
the library pulls its worker script, wasm core and language data from public
CDNs on first use, then caches them. Output goes through the same parser.

**Open Food Facts** queries `{cc}.openfoodfacts.org/cgi/search.pl` for up to 20
products across the world, Netherlands, Greece, Belgium, Germany and France
databases. Where salt is missing but sodium is present, salt is derived as
sodium × 2.5.

## Additive scan

`scanIngredients()` matches E-numbers on a word boundary and additive names by
regex, then deduplicates.

| Category    | E-numbers                                                                |
| ----------- | ------------------------------------------------------------------------ |
| Phosphate   | 338, 339, 340, 341, 343, 442, 450, 451, 452, 1410, 1412, 1413, 1414, 1442 |
| Potassium   | 340, 501, 508, 515, 525, 536                                             |
| Sodium      | 250, 251, 252, 262, 281, 500, 621, 627, 631                              |
| Added sugar | none, this category is name-only                                         |

Additive names are matched in all five languages the parser reads. E-numbers
carry no language, so they match wherever they appear.

`E4500` does not match `E450`, and a bare number without an `E` prefix does not
match at all.

## Flags


| Item          | Warning                   | Alert        |
| ------------- | ------------------------- | ------------ |
| Sodium        | above 250 mg              | above 500 mg |
| Sugars        | above 15 g                |              |
| Fibre         | under 3 g, and only when the label declared it and the portion carries at least 8 g of carbohydrate | |
| Saturated fat | above 5 g                 |              |
| Potassium     | above 200 mg              |              |
| Phosphorus    | above 12 mg per g protein |              |
| Energy drift  | above 10% either way      |              |

Potassium and phosphorus, and the phosphate and potassium additive scans, are
behind a **Kidney diet** switch that is off by default. Those two minerals are
what a renal diet turns on and are noise to everyone else; sodium and added
sugar are scanned either way.

A blank field is unknown, not zero. Potassium, phosphorus and fibre all report
`n/s` when the label omits them, and no flag fires on a value that was never
declared. This is why olive oil is not reported as low in fibre.

Sodium comes from salt at 400 mg/g. Sugars are total, not free, because that
is what the declaration gives. Potassium carries the renal tiers: low below 100 mg, medium 100 to 200,
high above. Phosphorus is shown per g of protein, since the ratio rather than
the absolute figure is what marks a food carrying additive phosphorus.

## Limitations

- **Potassium and phosphorus when the label omits them.** Neither is mandatory
  in the EU or US. CarbX reports `n/s` and does not estimate. Absence says
  nothing about additive load, which is what the ingredient scan is for.
- **Additives worded outside its lists.** Coverage is the regexes in `SCANS`.
- **Anything it has not been given.** No food database, no intake tracking, no
  history.

OCR accuracy varies with photo quality, and Open Food Facts is crowd-sourced and
unverified. Check parsed figures against the pack.

## Validation

Unit tests show the code does what it was told to do. They say nothing about
whether the exchanges are the right ones. [validation/VALIDATION.md](validation/VALIDATION.md)
is the other half: twenty real supermarket products, Greek and Dutch, with
barcodes, worked through against the method as written down here. The recount
in `validation/build.mjs` is a separate transcription of those stages and
does not call `decompose()`, so the two agreeing is evidence the implementation
matches its own description.

The first run of it found two classification failures, both now fixed and both
covered by tests: halloumi was in the keyword list in Latin script only, so a
pack labelled `χαλούμι` fell through to starch, and a coconut-oil imitation
cheese reached the starch default because the fat rule required under 5 g of
carbohydrate. Regenerate with `node validation/build.mjs`.

## References

The reference table and the thresholds come from the following. Where CarbX
departs from a source, or where a source is contested, it says so.

**Exchange lists.** *Choose Your Foods: Exchange Lists for Diabetes*, American
Diabetes Association and American Dietetic Association, Chicago and Alexandria
VA, 2007. Its food-list table is what CarbX implements, value for value:

| List | CHO g | Protein g | Fat g | kcal |
| --- | --- | --- | --- | --- |
| Starch | 15 | 0-3 | 0-1 | 80 |
| Fruits | 15 | - | - | 60 |
| Milk, fat-free or 1% | 12 | 8 | 0-3 | 100 |
| Milk, reduced fat 2% | 12 | 8 | 5 | 130 |
| Milk, whole | 12 | 8 | 8 | 150 |
| Sweets, desserts, other carbohydrates | 15 | varies | varies | varies |
| Nonstarchy vegetables | 5 | 2 | - | 25 |
| Meat, lean | - | 7 | 0-3 | 45 |
| Meat, medium fat | - | 7 | 4-7 | 75 |
| Meat, high fat | - | 7 | 8 or more | 100 |
| Fats | - | - | 5 | 45 |

Two things follow from the ranges. Where the list gives one, CarbX takes the
upper bound as the exchange's nominal figure: a starch exchange is charged 3 g
of protein and 1 g of fat. And the protein tiers are the list's own fat bands,
0-3 g lean, 4-7 g medium, 8 g or more high, applied to the fat per exchange the
label actually declares rather than to the list's nominal figure. The milk
variants work the same way.

A later edition exists, retitled *Choose Your Foods: Food Lists for Diabetes*,
5th edition, 2019. CarbX follows the 2007 table above; a reader working from
the newer edition should check the two agree before relying on the output.

**Carbohydrate conventions.** The 15 g unit is the US convention above, 10 g
the Dutch koolhydraateenheid. Only the carbohydrate column scales, by
`unit / 15`; a milk exchange carries 8 g of protein under every convention.

**Fibre.** Total carbohydrate is what gets counted. Nothing is netted off for
fibre. The 2007 exchange list contains no fibre-subtraction rule, its only
fibre marker flagging a food as a good source at more than 3 g per serving, and
the American Diabetes Association states that terms like "net carbs" are not
defined by the FDA and that it does not recommend their use. An earlier version
of CarbX subtracted fibre above 5 g per portion; it was removed because nothing
supported it.

**Sodium.** CarbX warns above 250 mg and alerts above 500 mg of sodium per
portion. For comparison, the 2007 list marks a food as high in sodium at 480 mg
or more per serving.

**Salt and sodium.** Sodium is derived from declared salt at 400 mg per gram,
the inverse of the EU conversion factor: salt equivalent = sodium × 2.5,
Regulation (EU) No 1169/2011, Annex I. Where Open Food Facts gives sodium but
no salt, salt is derived the same way.

**Phosphorus.** Phosphorus is reported per gram of protein because the ratio,
not the absolute figure, marks a food carrying additive phosphorus.
Kalantar-Zadeh K, Gutekunst L, Mehrotra R, et al. Understanding sources of
dietary phosphorus in the treatment of patients with chronic kidney disease.
*Clin J Am Soc Nephrol* 2010;5:519-530, gives the absorption figures the app
cites: around 90% for inorganic additive phosphorus against 40 to 60% for
organic phosphorus in whole foods. Noori N, Kalantar-Zadeh K, Kovesdy CP, et al.
Association of dietary phosphorus intake and phosphorus to protein ratio with
mortality in hemodialysis patients. *Clin J Am Soc Nephrol* 2010;5(4):683-692,
found mortality rising at ratios of 14 mg/g and above, against a reference band
of 12 to under 14. CarbX flags above 12 mg/g, which is the conservative end of
that evidence rather than its centre.

**Open Food Facts.** Every nutriment field ending in `_100g` is returned in
grams, energy excepted: "fields that end with `_100g` correspond to the amount
of a nutriment (in g, or kJ for energy) for 100 g or 100 ml of product"
([data-fields.txt](https://world.openfoodfacts.org/data/data-fields.txt)).
Potassium and phosphorus are converted to milligrams on import; salt is already
in grams. The database is crowd-sourced and unverified.

## Interface languages

English and Greek, switched by the `en ελ` links in the header. The choice is
remembered in the browser and, on a first visit, taken from the browser's own
language.

`src/i18n.js` holds both dictionaries. Nothing in the interface holds a literal
string: every label, help note, flag sentence and classification reason is
looked up by key, and `src/lib/i18n.test.js` fails when a key exists in one
language and not the other, when a placeholder such as `{n}` appears in one
language and not the other, or when the classifier starts producing an id the
dictionary has never heard of. A half-translated release cannot ship.

The label parser is unaffected: it reads five languages whichever language the
interface is in. The switch changes what CarbX says, not what it can read.

The Greek was drafted alongside the English and has not been reviewed by a
second Greek dietitian. The classification sentences are the ones to read
first, since they explain clinical reasoning rather than naming a control. An
exchange is *ισοδύναμο*, never a calque such as *ανταλλαγή*; a food group is
*ομάδα τροφίμων*.

## Typography

Source Sans 3 and Source Code Pro, both SIL Open Font License, self-hosted in
`public/fonts`. Self-hosted rather than loaded from a font CDN for two reasons:
the page renders identically on every device instead of falling back to whatever
the visitor's operating system supplies, and no visitor's IP address reaches a
third party, which a tool advertising no analytics has to mean literally.

Latin, Latin Extended and Greek are shipped; Cyrillic and Vietnamese are not,
since the label parser reads English, Dutch, German, French and Greek. The faces
are split by `unicode-range`, so a browser fetches the Greek file only when Greek
is actually on the page: 188 KB on disk, around 40 KB on a typical first load.

`npm run fonts` copies the WOFF2 files out of the fontsource packages and
regenerates `src/fonts.css` from those packages' own `unicode-range`
declarations, so the ranges cannot drift from the files they describe.

## Development

```
npm install
npm run dev
```

`npm test` runs 267 vitest cases\
 `npm run lint` runs oxlint\
 `npm run build`
writes a static site to `dist/`.

`src/lib/exchange.js` holds the logic. 
`src/App.jsx` is the interfaces and styles.

React 19, Vite 6, tesseract.js 7, vitest 3, oxlint.

Pushing to `main` lints, tests, builds and publishes the site to GitHub Pages.

## License

MIT, see [LICENSE](LICENSE).

Built with the help of Claude (Anthropic).
