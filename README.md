# CarbX

Web-based exchange-list calculator for diabetes, kidney and weight loss diets in 5 languages.

### [carbx.gmiliarakis.com](https://carbx.gmiliarakis.com)



✅ no account needed\
✅ no backend\
✅ no API keys\
✅ no data stored\
✅ no analytics

## Usage

**1. Insert the nutritional values in four ways:**

i. **Manually**\
ii. **Paste the text** copied off a pack, a website or a
database entry in English, Dutch, German,
French and Greek.\
iii. **Read from photo** with local OCR\
v. **Search Open Food Facts.** Look up by name in Dutch, Greek, Belgian, German and French databases.

**2. Set the portion size and convention.** Portion in grams, and 15 g, 12 g or 10 g of carbohydrate per exchange.

**3. Read output**
   - exchanges per portion
   - grams of this food per exchange
   - flags on sodium, sugar, saturated fat, potassium and phosphorus

Macronutrients (carbohydrate, protein and fat) are the only required fields. Paste the ingredients list to scan for phosphate, potassium, sodium and sugar additives.

The assigned group can always be overriden. The ledger shows the unrounded working, and the drift figure shows how much energy the rounding cost. If above 10% drift, count the food in grams of carbohydrate instead.

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

1. **Fibre.**  If >5 g/portion, fibre is subtracted from available carbohydrate and floored at 0. 
2. **Carbohydrate.** If >0.4 g available, draws `cho / group.cho` exchanges, consuming the carbohydrate exactly. The group's protein and fat net off too, capped at what the food holds. `protein-only` and `fat-only` are classifications rather than table entries, so their carbohydrate is skipped here and never enters an exchange.
3. **Protein, then fat.** Above 1.2 g residual protein, `protein / 7` exchanges at the tier its residual fat implies. Above 1.2 g residual fat, `fat / 5`.

Counts are computed unrounded, then rounded to the nearest half, ties up.
Anything rounding to 0 is dropped. `gramsPerExchange()` inverts one exchange
against the food's per-100 g composition, independent of portion, and returns
null when the food has none of that macro.

## Classification

`inferGroup()` tries the name first, then composition, in order:

| # | Test                                                            | Result |
| - | --------------------------------------------------------------- | ------ |
| 1 | oil or butter keyword, CHO and protein under 5 g                 | `fat-only` |
| 2 | milk, yoghurt or kefir keyword, CHO and protein above 2 g        | `milk` |
| 3 | cheese, meat, fish, egg, tofu or nut keyword                     | `protein-only` under 5 g CHO, else `starch` |
| 4 | fruit name list, five languages                                  | `fruit` |
| 5 | CHO 2 to 35 g, protein and fat under 3 g, fibre 0.3 g or more, sugars at least 45% of CHO | `fruit` |
| 6 | over 70% of kcal from fat, CHO and protein under 5 g             | `fat-only` |
| 7 | over 40% from protein, CHO under 5 g                             | `protein-only` |
| 8 | over 45% from carbohydrate                                       | `starch` above 12 g CHO, else `veg` |
| 9 | CHO under 2 g, protein above 5 g                                 | `protein-only` |
|   | nothing matched                                                  | `starch` |

Rule 5 catches fruit named in a language the list cannot cover. The fibre floor
keeps sugary drinks and honey out. Dried fruit exceeds the upper CHO bound and
depends on the name list.

The Dutch stems `ei` (egg) and `vis` (fish) match at a word start only, so
`protein` and `provisions` do not trigger rule 3.

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
| Saturated fat | above 5 g                 |              |
| Potassium     | above 200 mg              |              |
| Phosphorus    | above 12 mg per g protein |              |
| Energy drift  | above 10% either way      |              |

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
