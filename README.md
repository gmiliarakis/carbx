# CarbX

Food exchange calculator for the foods omitted in the exchange lists.
CarbX determines the food group and the number of exchanges in the
portion, for diabetes mellitus, chronic kidney disease and weight loss diets.

### [carbx.gmiliarakis.com](https://carbx.gmiliarakis.com)

![An oat drink entered into CarbX. It is counted as 1 starch and 1.5 fat
exchanges, with the reason given as "it is a plant-based food; the US exchange
list relies on its carbohydrates rather than its milk-resembling
characteristics". The CKD diet switch is on, so the ingredient scan has
flagged the dipotassium phosphate in it as an additive phosphate
source.](docs/carbx.png)

- **Rule-based.** Every group and every exchange comes from a published
  exchange list and a rule written out in the source. Nothing is inferred by a
  model, and every result names the rule that produced it.
- **Five label languages.** Labels typed, pasted or photographed are read in
  English, Dutch, German, French and Greek.
- **Two UI languages.** English and Greek.
- **Two carbohydrate conventions.** 15 g of carbohydrate per
  exchange for the US convention, 10 g for the Dutch koolhydraateenheid.
- **CKD diet flags.** One switch adds potassium (K) and phosphorus (P), reports
  P per g of protein, and scans the ingredients for phosphate and K additives
  (off by default).
- **Simple or detailed view.** View customisation for individuals or dietitians.
- **Light and fast.** A static site with no backend. Results are instant and
  photo recognition runs on your own device.
- **Free and open source.** (MIT license)

✅ No account needed\
✅ No backend\
✅ No API keys\
✅ No data stored\
✅ No analytics

## Contents

[Intended use](#intended-use) \
[Usage](#usage) \
[Terms](#terms) \
[Reasoning](#reasoning) \
[Classification](#classification) \
[Label parser](#label-parser) \
[Additive scan](#additive-scan) \
[Flags](#flags) \
[Limitations](#limitations) \
[Validation](#validation) \
[Sources](#sources) \
[Development](#development) \
[References](#references)

Read the first three sections to use CarbX. The rest documents how it decides
what it decides, and why, so a dietitian can check it or disagree with it.

## Intended use

CarbX is a teaching and self-management tool. It converts a nutrition declaration
into exchanges and flags monitored in diabetes mellitus (DM) and chronic kidney disease (CKD).

It is not a medical device. It does not calculate insulin doses. It does not
replace assessment by a dietitian. It knows no clinical context for the person
eating the food.

Every figure it displays derives from the label submitted. A mistyped or misread
label therefore yields a confident wrong calculation. Verify the parsed values against
the pack before acting on them.

## Usage

**1. Insert the nutritional values.**

i. **By hand.**\
ii. **Paste the text** from a pack, a website or a database entry, in English,
Dutch, German, French or Greek.\
iii. **Take photo of the label.** Recognition is local to your device.\
iv. **Search Open Food Facts** by name, across the world, Dutch, Greek, Belgian,
German and French databases.

**2. Portion and convention.** Enter portion in grams, and select the carbohydrate unit: 15 g
per exchange for the US convention, 10 g for the Dutch koolhydraateenheid.

**3. Output**

  - exchanges in the portion
  - grams of food per exchange
  - flags on sodium, sugars, fibre, saturated fat, K and P, and on rounding
    drift

Carbohydrate, protein and fat are the only required fields. If you provide the ingredients
list as well, CarbX scans it for phosphate, K, sodium and sugar additives.

Every result names the group the food was counted from and states whether its name
or its figures determined that. The group is always overridable. Where rounding to
half exchanges costs more than a tenth of the energy, the portion is marked as
approximate.

## Terms

**Food group** is the list a food is counted from: starch, fruit, milk,
non-starchy vegetables, sweets and other carbohydrates, protein, fat.\
**Exchange** is the countable unit drawn from that list. A result reads "1.5 milk
exchanges, 300 g each".\
**CHO** is the standard clinical shorthand for carbohydrate. The letters are the elements it contains: carbon, hydrogen and oxygen.

## Reasoning

CarbX implements the nutrient chart of the 2019 US food lists [1], value for
value. Only the carbohydrate column scales, by `unit / 15`, so one table serves
both conventions.

| List | Carbohydrate g | Protein g | Fat g | kcal |
| --- | --- | --- | --- | --- |
| Starch | 15 | 3 | 1 | 80 |
| Fruits | 15 | - | - | 60 |
| Milk, fat-free or low-fat 1% | 12 | 8 | 0-3 | 100 |
| Milk, reduced fat 2% | 12 | 8 | 5 | 120 |
| Milk, whole | 12 | 8 | 8 | 160 |
| Nonstarchy vegetables | 5 | 2 | - | 25 |
| Sweets, desserts and other carbohydrates | 15 | varies | varies | varies |
| Protein, lean | - | 7 | 2 | 45 |
| Protein, medium fat | - | 7 | 5 | 75 |
| Protein, high fat | - | 7 | 8 | 100 |
| Protein, plant-based | varies | 7 | varies | varies |
| Fats | - | - | 5 | 45 |

`decompose()` proceeds in two stages, the second operating on the residue of the
first.

1. **Carbohydrate.** Above 0.4 g, the function draws `cho / group.cho` exchanges
   and consumes the carbohydrate exactly. The group's protein and fat are deducted
   as well, limited to the quantities the food actually contains.
   `protein-only` and `fat-only` are classifications rather than rows in the
   table, so their carbohydrate is excluded here and never becomes an exchange.
   The protein stage is also skipped for `fat-only` and `sweet`, since the list
   records both as carbohydrate or fat and never as protein. Without that
   exception, a chocolate bar's few grams of protein would become a protein
   exchange and absorb the bar's fat along with them.
2. **Protein, then fat.** Above 1.2 g of residual protein, `protein / 7` exchanges
   at the tier its residual fat implies. Above 1.2 g of residual fat, `fat / 5`.

Counts are computed unrounded, then rounded to the nearest half, ties upward.
Anything that rounds to zero is discarded. `gramsPerExchange()` inverts one
exchange against the food's composition per 100 g, independent of the portion, and
returns null where the food contains none of that macronutrient.

## Classification

The food is classified based on a set of rules (see table below).
`inferGroupWithReason()` returns the group together with the route to it: `name`
where a keyword decided it, `composition` where the figures did, `default` where
neither matched. The interface displays this, so a reader can see the reasoning behind the decision. `inferGroup()` returns the group without explanation.

| # | Rule | Decision |
| - | ---- | ------ |
| 1 | plant-based keyword, CHO at least 2 g | `starch` |
| 1b | plant-based keyword, CHO under 2 g, protein at least 2 g | `protein-only` |
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

Rule 6 exists because of imitation cheeses: coconut oil and starch, no protein
whatever, under a name that reads as dairy. Without it they reached the starch
default. Rule 4's ranking by longest keyword is what allows "aardappel" to beat
"appel", "buttermilk" to beat "butter" and "green bean" to beat "bean".

Rule 12 captures fruit named in a language the keyword list does not cover. The
fibre floor excludes sugary drinks and honey. Dried fruit exceeds the upper bound
and therefore still depends on the name list.

The Dutch stems `ei` (egg) and `vis` (fish) match at a word start only, so
`protein` and `provisions` do not trigger the protein rules.

### Plant-based drinks and products

Rule 1 precedes the fat and dairy rules, either of which would otherwise win
outright, since every plant-based drink name contains one of their keywords:
"almond" within "almond milk", "milk" within "oat milk". In the reverse order, a
sweetened almond drink matched the nut list and its carbohydrate went uncounted.

**No plant-based drink counts as a milk exchange.** The 2019 list
places these products within Milk and Milk Substitutes and counts them in carb and
fat choices. CarbX implements the same decision. A plant-based drink is counted on the
carbohydrate it contains, and its protein and fat remain for the later stages
rather than absorbed into a milk exchange. An unsweetened soy drink therefore
yields carbohydrate plus a protein exchange.

Two names are excluded deliberately. `coconut milk` is not a plant-based drink for these purposes, so tinned coconut milk at 21 g of fat remains on the fat list;
`coconut drink` is one. An unsweetened almond drink carries too little
carbohydrate to satisfy rule 1 and too little protein for rule 1b, so it falls
through to the composition rules and is counted on fat alone: at 1.1 g of fat per
100 ml, a 250 ml glass gives half a fat exchange and no carbohydrate.

**Plant-based yoghurts and creams** occupy the same list as the drinks and receive the
same treatment, with one additional exchange. A plain soy yoghurt contains roughly
1 g of carbohydrate against 4 g of protein, which satisfies the vegetable rule;
without its name it was classified as a vegetable. Below 2 g of carbohydrate with
protein present, a plant-based product counts as protein.

Names are the full compound, `havermelk` rather than `haver`, so that the
longest-match ranking retains oats, rice and almonds on their own lists.

**Plant-based protein sources.** Tofu, tempeh, seitan, falafel, hummus, edamame and the beans belong to the 2019 Plant-Based Protein list, which counts them as a carb choice plus a protein choice. The two stages of `decompose()` produce the same result. Coconut-oil cheese analogues are captured by rule 6 on composition alone.

**Sweets.** A starch exchange contains 3 g of protein and 1 g of fat. Neither is present in a soft drink or a spoonful of honey.
Bread, pancakes, waffles and cornbread remain on starch; brownies, cake, cookies and pie do not. Sweets are reached by name,
so a dessert worded outside the keyword lists is still classified as starch.

## Label parser

`parseNutritionText()` locates a keyword in one of five languages and then takes
the first number within 15 non-digit characters after it. Comma and point decimals
are both accepted. English, Dutch, German, French and Greek, including both
`fibre` and `fiber`. The ingredients run from the first ingredients heading to the
next blank line, whitespace collapsed, truncated at 800 characters.

Basis detection reports `100ml`, `100g` or `serving`, preferring per 100 ml, and
defaults to `100g`. It reports and never converts, so a per-serving label requires
manual conversion.

Each field takes the first match in the document. A two-column label printing per
100 g beside per serving may therefore take the wrong column.

**OCR** is [tesseract.js](https://github.com/naptha/tesseract.js) 7, defaulting to
`eng+nld+deu+fra+ell` and selectable per language. Recognition is local, though
the library retrieves its worker script, wasm core and language data from public
CDNs on first use and caches them thereafter. Its output is read by the same
parser.

**Open Food Facts** queries `{cc}.openfoodfacts.org/cgi/search.pl` for up to 20
products, across the world, Netherlands, Greece, Belgium, Germany and France
databases. Where salt is absent but sodium present, salt is derived as
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

Additive names are matched in all five languages the parser reads. E-numbers carry
no language and match wherever they appear.

`E4500` does not match `E450`, and a bare number without an `E` prefix does not
match at all.

## Flags

| Item          | Warning                   | Alert        |
| ------------- | ------------------------- | ------------ |
| Sodium        | above 250 mg              | above 500 mg |
| Sugars        | above 15 g                |              |
| Fibre         | under 3 g, and only when the label declared it and the portion contains at least 8 g of carbohydrate | |
| Saturated fat | above 5 g                 |              |
| Potassium     | above 200 mg              |              |
| Phosphorus    | above 12 mg per g protein |              |
| Energy drift  | above 10% either way      |              |

K and P, together with the phosphate and K additive scans, are governed by a
**CKD diet** switch that is off by default. Those two minerals are the concern
of a renal diet and noise to everyone else. Sodium and
added sugar are scanned regardless.

The fibre flag is confined to the detail view.
The simple view shows only the flags that alter a decision.

A blank field means unknown, not zero. K, P and fibre report
`n/s` where the label omits them, and no flag fires on a value that was never
declared. Olive oil is consequently not reported as low in fibre.

Sugars are total rather than free, since total is what the declaration provides.
K has tiers in the CKD view: low below 100 mg, medium 100 to 200, high above
that.

## Limitations

- K and P are often missing from labels. CarbX does not estimate them.
- Additives worded outside its lists will not be recognised. Coverage is the regular expressions (regex) in `SCANS`.
- OCR accuracy varies with photograph quality.
- Open Food Facts is crowd-sourced and unverified.

Verify the figures against the pack.

## Validation

Unit tests establish that the code implements its specification. They do not
establish that the specification produces the right exchanges.
[validation/VALIDATION.md](validation/VALIDATION.md) addresses this.
Twenty Greek and Dutch supermarket products, each run through
`decompose()` and, independently, through `validation/build.mjs`, which
reimplements the stages documented above and never calls `decompose()`.
Agreement between the two is evidence that the implementation matches this
README. Per product the file records the classification and its route, both
outputs, and the energy cost of rounding to half exchanges. Regenerate with
`node validation/build.mjs`.

The first run surfaced two classification defects, both since fixed and now under
test: halloumi was listed in Latin script only, so a pack labelled `χαλούμι`
reached the starch default, and a coconut-oil cheese analogue reached it too
because the fat rule required carbohydrate under 5 g.

## Sources

The exchange table and every threshold derive from the works listed under
[References](#references). Departures are stated.

**Food lists.** The chart under [Reasoning](#reasoning) is that of the 2019
Academy of Nutrition and Dietetics and American Diabetes Association food lists
[1]. The nominal fat per protein exchange is the list's own 2, 5 and 8 g. The cut
points selecting between the three tiers, 3 g and 7 g of declared fat, are
CarbX's own and correspond to the bands published in the earlier edition. They
are applied to the fat the label declares rather than to the nominal figure, and
the milk variants are treated identically. A sweets exchange is 15 g of
carbohydrate at about 70 kcal; the list specifies neither protein nor fat for it
[1], so CarbX charges neither.

**Carbohydrate unit.** 15 g is the US convention [1]; 10 g is the Dutch
koolhydraateenheid.

**Fibre.** Total carbohydrate is counted, with no deduction for fibre. The list
prescribes dividing declared total carbohydrate by 15 and notes that the total
already includes starches, sugars, sugar alcohols and dietary fibre [1]; its
fibre marker identifies a good source at about 3 g per choice and an excellent
source at 5 g or more. The American Diabetes Association holds that "net carbs"
has no legal definition, is not used by the FDA and is not recognised by the
association [2]. An earlier version of CarbX deducted fibre above 5 g per portion;
it was removed for want of a source supporting it.

**Sodium.** The list marks a food high in sodium at 480 mg or more per choice
and a combination main dish at more than 600 mg [1]; the thresholds under
[Flags](#flags) sit below both. Sodium is derived from declared salt at
400 mg/g, the inverse of the EU conversion factor salt = sodium x 2.5 [3].

**Phosphorus.** Reported per gram of protein, since the ratio rather than the
absolute figure identifies a food carrying additive P. Absorption is around 90%
for inorganic additive P against 40 to 60% for organic P in whole foods [4]. In
haemodialysis patients, mortality rises at P-to-protein ratios of 14 mg/g and
above, against a reference band of 12
to under 14 [5]. CarbX flags above 12 mg/g, the conservative boundary of that evidence
rather than its centre.

**Word lists.** The group keywords in `src/lib/keywords.js` follow the group
definitions of the exchange table [1]. Product names were taken from the
national food composition and exchange tables: NEVO for Dutch [7], the German
Austauschtabellen [8] and Ciqual for French [9]. The Greek terms come from the
Greek Diabetic Association's exchange guide, food groups 1 to 6 [10], and the
German terms were additionally checked against Open Food Facts category names
[11].

**Additive scan.** The E-numbers listed under [Additive scan](#additive-scan)
are those of the EU list of authorised food additives [12].

**Open Food Facts.** Nutriment fields ending in `_100g` give the amount per 100 g
or 100 ml, in grams except energy [6]. K and P are converted to
milligrams on import; salt already arrives in grams.

## Development

```
npm install
npm run dev
```

`npm test` runs 353 vitest cases\
`npm run lint` runs oxlint\
`npm run build` writes a static site to `dist/`.

`src/lib/exchange.js` holds the logic, `src/lib/keywords.js` the word lists,
`src/i18n.js` the dictionaries and `src/App.jsx` the interface and its styles.

React 19, Vite 6, tesseract.js 7, vitest 3, oxlint.

Pushing to `main` lints, tests, builds and publishes the site to GitHub Pages.

## References

1. Academy of Nutrition and Dietetics, American Diabetes Association. *Choose
   Your Foods: Food Lists for Weight Management*. Chicago: Academy of Nutrition
   and Dietetics; 2019. ISBN 978-1-58040-739-7.
2. American Diabetes Association. Get to know carbs.
   <https://diabetes.org/food-nutrition/understanding-carbs/get-to-know-carbs>
3. Regulation (EU) No 1169/2011 of the European Parliament and of the Council of
   25 October 2011 on the provision of food information to consumers, Annex I.
   *Official Journal of the European Union* 2011;L304:18-63.
4. Kalantar-Zadeh K, Gutekunst L, Mehrotra R, et al. Understanding sources of
   dietary phosphorus in the treatment of patients with chronic kidney disease.
   *Clin J Am Soc Nephrol* 2010;5(3):519-530.
5. Noori N, Kalantar-Zadeh K, Kovesdy CP, et al. Association of dietary
   phosphorus intake and phosphorus to protein ratio with mortality in
   hemodialysis patients. *Clin J Am Soc Nephrol* 2010;5(4):683-692.
6. Open Food Facts. Data fields.
   <https://world.openfoodfacts.org/data/data-fields.txt>
7. Rijksinstituut voor Volksgezondheid en Milieu. *NEVO-online versie 2025/9.0*,
   Nederlands Voedingsstoffenbestand. Bilthoven: RIVM; 2025.
   <https://www.rivm.nl/documenten/nevo-online-versie>
8. Verband der Diabetes-Beratungs- und Schulungsberufe Deutschland.
   *Kohlenhydrat-Austauschtabelle*; 2017. Standl E, Mehnert H.
   *Fett-Austauschtabelle*, in *Das große TRIAS-Handbuch für Diabetiker*.
   Both published by diabetesDE at
   <https://www.diabetesde.org/austauschtabellen>
9. Ciqual. *Ciqual French food composition table 2025*, version 1 [dataset].
   Maisons-Alfort: Anses; 2025. <https://doi.org/10.5281/zenodo.17550133>
10. Ελληνική Διαβητολογική Εταιρεία (Greek Diabetic Association). *Οδηγός
    διατροφής για τη ρύθμιση του διαβήτη*: ισοδύναμα τροφών, ομάδες 1-6.
11. Open Food Facts. Kategorien. <https://de.openfoodfacts.org/kategorien>
12. Regulation (EC) No 1333/2008 of the European Parliament and of the Council of
    16 December 2008 on food additives, Annex II. *Official Journal of the
    European Union* 2008;L354:16-33.

## License

MIT, see [LICENSE](LICENSE).

Built with the help of Claude (Anthropic).
