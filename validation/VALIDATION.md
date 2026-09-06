# Validation

CarbX's unit tests show the code does what it was told to do. They say nothing
about whether the exchanges it produces are the right ones. This file is the
other half: twenty real products, worked through against the exchange-list
method as written down, with every disagreement recorded rather than resolved
quietly.

**Source.** Open Food Facts, records retrieved 2026-09-06. Every label
value in `products.json` is verbatim from the product record, including the
gaps and at least one figure that is plainly wrong. Barcodes are given so any
reviewer can pull the same record and check the input as well as the output.
Open Food Facts is crowd-sourced and unverified, which is the point: it is what
the app's database search actually returns.

**Convention.** 15 g of carbohydrate per exchange, total carbohydrate counted
with nothing netted off for fibre, tiered protein list. Portions are ordinary
serving sizes, not exchange-sized ones.

**Columns.** *Group, and why* is what `inferGroupWithReason()` decided and
whether a name or the figures decided it; a group in bold is one that differs
from what the fixture expected. *CarbX exchanges* is the app's output.
*Independent recount* is carbohydrate / protein / fat exchanges recomputed by
`build.mjs` from the three stages as documented in the README, without calling
`decompose()`. *Drift* is how much energy rounding to half exchanges cost.
*Reviewer* is deliberately blank, for a dietitian to sign off or object.

Regenerate with `node validation/build.mjs`.

## Everyday foods

| Product | Barcode | Per 100 g<br>CHO / Pro / Fat | Portion | Group, and why | CarbX exchanges | Independent recount | Agree | Drift | Reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Αυθεντικό Στραγγιστό Γιαούρτι 2%<br><small>ΟΛΥΜΠΟΣ</small> | `5202178002199` | 4 / 9.5 / 2 | 200 g | milk (name) | 0.5 reduced-fat milk, 2 lean protein | 0.5 / 2 / - | yes | -14.6% |  |
| Γιαούρτι στραγγιστό<br><small>Κρι Κρι</small> | `5202234143088` | 4.5 / 9.8 / 2 | 150 g | milk (name) | 0.5 reduced-fat milk, 1.5 lean protein | 0.5 / 1.5 / - | yes | -5.8% |  |
| Feta<br><small>Casa Azzurra</small> | `3760056264937` | 0.7 / 16.5 / 24.5 | 30 g | protein-only (name) | 0.5 high-fat protein | - / 0.5 / - | yes | -29.9% |  |
| Κυπριακό χαλούμι<br><small>Νωμά</small> | `4056489434252` | 3 / 20 / 25 | 60 g | protein-only (name) | 1.5 high-fat protein | - / 1.5 / - | yes | -15.8% |  |
| Ντακάκι κρίθινο λαδιού | `5200113188045` | 54 / 12 / 15.4 | 35 g | starch (no match) | 1.5 starch, 1 fat | 1.5 / - / 1 | yes | +12.5% |  |
| Έξτρα παρθένο ελαιόλαδο<br><small>εύ</small> | `4056489125303` | 0 / 0 / 92 | 10 g | fat-only (name) | 2 fat | - / - / 2 | yes | +8.7% |  |
| Tijger volkorenbrood<br><small>Albert Heijn</small> | `8718907611725` | 37 / 11 / 1.8 | 35 g | starch (name) | 1 starch | 1 / - / - | yes | +3.8% |  |
| Goudse 48+ jong<br><small>Albert Heijn</small> | `8718907845069` | 0 / 23 / 30 | 20 g | protein-only (figures) | 0.5 high-fat protein | - / 0.5 / - | yes | -23.5% |  |
| Langlekker Halfvolle Melk<br><small>Campina</small> | `8712800147008` | 4.9 / 3.7 / 1.5 | 250 g | milk (name) | 1 reduced-fat milk | 1 / - / - | yes | -7.7% |  |
| Puur Hagelslag<br><small>Albert Heijn</small> | `8718906716223` | 67 / 5.2 / 16 | 15 g | starch (name) | 0.5 starch, 0.5 fat | 0.5 / - / 0.5 | yes | -5.8% |  |

## Deliberate edge cases

These were chosen because they are the ones most likely to break a
classification rule. The reason each is here:

- **Peanut Butter** (`5202535177010`). On the US and European exchange lists a nut butter is a fat, not a protein, despite carrying 24 g of protein. If the fat list did not win outright this would come out as three protein exchanges.
- **Μακεδονικό Ταχίνι με κακάο** (`5201049211210`). Sweetened tahini: a fat-list name carrying 32 g of carbohydrate, almost all of it added sugar. The fat gate has to hold on the energy share rather than on carbohydrate being absent.
- **Ταχίνι Κακάο** (`4056489603337`). Same food declaring 0 g fibre, which is implausible for ground sesame. Tests that a stated zero does not swing the classification.
- **Greek White panetto (vegan)** (`5202390020407`). Reads as a cheese, contains no protein at all: coconut oil and starch. The name must not be allowed to place it on the protein list.
- **Figues moelleuses** (`3245414088184`). Dried fruit sits above the composition rule's carbohydrate ceiling, so it depends entirely on the name list. If the name is missed it lands on starch.
- **Soft Figs** (`20534462`). Ingredients name a potassium salt that contributes no meaningful potassium. The additive scan must not flag potassium sorbate as a potassium source.
- **Merenda** (`7622201126131`). Chocolate spread. Mostly sugar with 28 g of fat, so it must not read as fruit on the sugar fraction, and the fat must come out as separate fat exchanges.
- **Coca-Cola Original** (`5449000214911`). Sugar water with no fibre declared and phosphoric acid in the ingredients. Tests that the fruit rule's fibre floor holds, that the drink reaches the sweets list rather than starch, and that the phosphate scan catches a French-worded acid. On starch it was charged 3 g of protein and 1 g of fat per exchange it does not have, which showed up as 46% energy drift.
- **Goudse kaas oud 48+** (`4056489105299`). A high-fat protein: 20 g carries 5.2 g of protein and 6.6 g of fat, so one exchange has to be named high-fat and charged the fat the label declares rather than the list's nominal 8 g.
- **Volkorenbrood** (`8719587044049`). The salt figure, 0.0024 g per 100 g, is not credible for bread and is almost certainly a crowd-sourced data error. Kept deliberately: it shows what an unverified database entry does to the sodium flag.

| Product | Barcode | Per 100 g<br>CHO / Pro / Fat | Portion | Group, and why | CarbX exchanges | Independent recount | Agree | Drift | Reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Peanut Butter<br><small>Healthy Habits</small> | `5202535177010` | 12.9 / 24.2 / 49.9 | 30 g | fat-only (name) | 3 fat | - / - / 3 | yes | -26.7% |  |
| Μακεδονικό Ταχίνι με κακάο<br><small>Μακεδονικό</small> | `5201049211210` | 32 / 18.1 / 38.7 | 20 g | fat-only (name) | 1.5 fat | - / - / 1.5 | yes | -40.2% |  |
| Ταχίνι Κακάο<br><small>Γλυκάνθη</small> | `4056489603337` | 32.4 / 15.4 / 42 | 20 g | fat-only (name) | 1.5 fat | - / - / 1.5 | yes | -40.8% |  |
| Greek White panetto (vegan)<br><small>Violife</small> | `5202390020407` | 11 / 0 / 29 | 30 g | fat-only (figures) | 1.5 fat | - / - / 1.5 | yes | -26.6% |  |
| Figues moelleuses<br><small>Carrefour Bio</small> | `3245414088184` | 48 / 2.8 / 2.4 | 40 g | fruit (name) | 1.5 fruit | 1.5 / - / - | yes | -8.5% |  |
| Soft Figs<br><small>Alesto</small> | `20534462` | 48.6 / 3.3 / 1.5 | 40 g | fruit (name) | 1.5 fruit | 1.5 / - / - | yes | -9.6% |  |
| Merenda<br><small>Merenda</small> | `7622201126131` | 64 / 3.6 / 28 | 20 g | starch (no match) | 1 starch, 1 fat | 1 / - / 1 | yes | +20% |  |
| Coca-Cola Original<br><small>Coca-Cola</small> | `5449000214911` | 10.6 / 0 / 0 | 330 g | sweet (name) | 2.5 sweets / other cho | 2.5 / - / - | yes | +8.2% |  |
| Goudse kaas oud 48+<br><small>Milbona</small> | `4056489105299` | 0 / 25.8 / 33.2 | 20 g | protein-only (name) | 0.5 high-fat protein | - / 0.5 / - | yes | -32.2% |  |
| Volkorenbrood<br><small>Albert Heijn</small> | `8719587044049` | 37.1 / 12 / 2 | 35 g | starch (name) | 1 starch | 1 / - / - | yes | +1.1% |  |

## What this run shows

- Independent recount agrees with the app on 20 of 20 products, with no disagreements.
- Classification matched the expected group on 20 of 20.
- Rounding drift above 10% on 11 of 20: Αυθεντικό Στραγγιστό Γιαούρτι 2% (-14.6%), Feta (-29.9%), Κυπριακό χαλούμι (-15.8%), Ντακάκι κρίθινο λαδιού (12.5%), Goudse 48+ jong (-23.5%), Peanut Butter (-26.7%), Μακεδονικό Ταχίνι με κακάο (-40.2%), Ταχίνι Κακάο (-40.8%), Greek White panetto (vegan) (-26.6%), Merenda (20%), Goudse kaas oud 48+ (-32.2%). The app flags these and tells the user to count grams of carbohydrate instead.
- Potassium or phosphorus declared on 2 of 20 labels. Neither is mandatory in the EU or the US, so the renal flags are unavailable on almost every real product and the ingredient scan carries that work instead.

## Ingredient scan results

- **Soft Figs**: nothing matched
- **Coca-Cola Original**: Phosphate additives (phosphorique)

## Open questions for review

1. Sweets are assigned by name. A dessert the keyword lists do not know, in a
   language they do not cover, still reaches starch: same carbohydrate, wrong
   group. Composition alone cannot separate a cake from a starchy dish.
2. Jam counts as fruit, because the word fruit outranks jam in the name lists,
   even though sugar is 97% of its carbohydrate. Left deliberately.
3. The phosphorus flag fires above 12 mg per g of protein. Noori et al. treat
   12 to under 14 mg/g as the reference band, with risk rising at 14 and above,
   so 12 is the conservative end of the evidence rather than its centre.
