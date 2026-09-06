# CarbX

Web-based exchange-list calculator for diabetes, kidney and weight loss diets in 5 languages.

### [carbx.gmiliarakis.com](https://carbx.gmiliarakis.com)



✅ no account needed\
✅ no backend\
✅ no API keys\
✅ no data stored\
✅ no analytics

## What this is, and what it is not

CarbX is a teaching and self-management aid. It converts a nutrition
declaration into exchanges and flags what a diabetes or kidney diet watches.

It is not a medical device. It does not calculate insulin doses. It does not
replace assessment by a dietitian or physician, and it holds no clinical
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
   - flags on sodium, sugar, saturated fat, potassium and phosphorus

Macronutrients (carbohydrate, protein and fat) are the only required fields. Paste the ingredients list to scan for phosphate, potassium, sodium and sugar additives.

Each result says which group it was counted as and whether the name or the figures decided it. The assigned group can always be overridden. The ledger shows the unrounded working, and the drift figure shows how much energy the rounding cost.

## Reference

The table is the US reference, scaled by `unit / 15` to serve all three conventions.

| Group              | CHO g | Protein g | Fat g |
| ------------------ | ----- | --------- | ----- |
| Starch             | 15    | 3         | 1     |
| Fruit              | 15    | 0         | 0     |
| Milk               | 12    | 8         | 0     |
| Non-starchy veg    | 5     | 2         | 0     |
| Sweets / other CHO | 15    | 0         | 0     |

A protein exchange is 7 g of protein. The fat alongside it sets the tier: up to 3 g is lean (2 g fat), above 3 up to 7 is medium (5 g), above 7 is high (8 g). A
fat exchange is 5 g.

`decompose()` runs three stages, each on the residual the last one left:

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
| 1 | fat keyword, and either fat leads 60% of the energy or CHO and protein are both under 5 g | `fat-only` |
| 2 | dairy keyword, protein standing in a milk-like ratio to the carbohydrate, and either both above 2 g or the portion carrying a full milk exchange of protein | `milk` |
| 3 | protein, fruit, vegetable, sweets and starch keywords, ranked by longest match, each with its own gate | the first whose gate passes |
| 4 | over 70% of energy from fat, CHO and protein under 5 g | `fat-only` |
| 5 | over 75% of energy from fat, protein under 2 g, CHO under 15 g | `fat-only` |
| 6 | CHO 2 to 15 g, no fibre, sugars at least 70% of CHO, milk-like protein ratio | `milk` |
| 7 | over 40% of energy from protein, CHO under 5 g | `protein-only` |
| 8 | CHO at least 2 g, sugars at least 90% of CHO, protein and fat under 1 g, little or no fibre | `sweet` |
| 9 | CHO under 2 g, protein above 5 g | `protein-only` |
| 10 | CHO up to 8 g, fat under 3 g, vegetable-like protein ratio | `veg` |
| 11 | CHO 8 to 35 g, fat under 3 g, fibre at least 0.3 g, sugars at least 45% of CHO, almost no protein | `fruit` |
|  | nothing matched | `starch` |

Rule 11 catches fruit named in a language the keyword list does not cover. The
fibre floor keeps sugary drinks and honey out. Dried fruit exceeds the upper
bound and depends on the name list.

Rule 5 exists because of imitation cheeses: coconut oil and starch, no protein
at all, under a name that reads as dairy. Without it they reached the starch
default. Rule 3's ranking by longest keyword is what makes "aardappel" beat
"appel", "buttermilk" beat "butter" and "green bean" beat "bean".

The Dutch stems `ei` (egg) and `vis` (fish) match at a word start only, so
`protein` and `provisions` do not trigger the protein branch.

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
to `eng+nld+fra+ell` and selectable per language. Recognition is local, but
the library pulls its worker script, wasm core and language data from public
CDNs on first use, then caches them. Output goes through the same parser.

**Open Food Facts** queries `{cc}.openfoodfacts.org/cgi/search.pl` for up to 20
products across the world, Netherlands, Greece, Belgium, Germany and France
databases. Where salt is missing but sodium is present, salt is derived as
sodium × 2.5.

## Additive scan

`scanIngredients()` matches E-numbers on a word boundary and additive names by
regex, then deduplicates.

| Category    | E-numbers                                                          | Names in              |
| ----------- | ------------------------------------------------------------------ | --------------------- |
| Phosphate   | 338, 339, 340, 341, 343, 442, 450, 451, 452, 1410, 1412, 1413, 1414, 1442 | English, Dutch, Greek |
| Potassium   | 340, 501, 508, 515, 525, 536                                       | English, Dutch, Greek |
| Sodium      | 250, 251, 252, 262, 281, 500, 621, 627, 631                        | English, Dutch        |
| Added sugar | none, this category is name-only                                   | English, Dutch, Greek |

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
in `validation/build.mjs` is a separate transcription of the three stages and
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
