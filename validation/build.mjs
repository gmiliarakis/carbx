// Builds validation/VALIDATION.md from validation/products.json.
//
// The point of this file is that the recount below is written from the method
// as documented in the README, not by calling decompose(). Two independent
// transcriptions of the same procedure agreeing on twenty real labels is
// evidence the implementation matches its own description. Where they disagree
// the table says so rather than hiding it.
//
//   node validation/build.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { decompose, inferGroupWithReason, scanIngredients, r1 } from "../src/lib/exchange.js";

const data = JSON.parse(readFileSync(new URL("./products.json", import.meta.url), "utf8"));

const CARB = { starch: { c: 15, p: 3, f: 1 }, fruit: { c: 15, p: 0, f: 0 },
  milk: { c: 12, p: 8, f: 0 }, veg: { c: 5, p: 2, f: 0 }, sweet: { c: 15, p: 0, f: 0 } };

// Independent recount, from the README's three stages. Deliberately does not
// import decompose.
function recount(x, unit, group) {
  const f = x.portion / 100;
  let cho = (x.cho ?? 0) * f, pro = (x.pro ?? 0) * f, fat = (x.fat ?? 0) * f;
  const half = (v) => Math.round(v * 2) / 2;
  let carb = 0, protein = 0, plain = 0;
  const g = CARB[group];
  if (g && cho > 0.4) {
    const per = g.c * (unit / 15);
    const ex = cho / per;
    const fatPer = group === "milk" ? fat / ex : g.f;
    const dP = Math.min(pro, ex * g.p), dF = Math.min(fat, ex * fatPer);
    cho -= ex * per; pro -= dP; fat -= dF;
    carb = ex;
  }
  if (pro > 1.2 && group !== "fat-only" && group !== "sweet") {
    const ex = pro / 7;
    const dF = Math.min(fat, ex * (fat / ex));
    pro -= ex * 7; fat -= dF;
    protein = ex;
  }
  if (fat > 1.2) { plain = fat / 5; }
  return [half(carb), half(protein), half(plain)];
}

// The same three numbers, read off what the app actually returns.
function fromApp(dec) {
  let carb = 0, protein = 0, plain = 0;
  for (const o of dec.rounded) {
    if (o.ref.cho > 0) carb += o.ex;
    else if (o.ref.pro > 0) protein += o.ex;
    else plain += o.ex;
  }
  return [carb, protein, plain];
}

const UNIT = 15;
const VIA = { name: "name", composition: "figures", default: "no match" };

function row(x) {
  const per100 = { cho: x.cho ?? 0, pro: x.pro ?? 0, fat: x.fat ?? 0,
    sugars: x.sugars ?? null, fibre: x.fibre ?? null };
  const why = inferGroupWithReason(per100, x.name, { portionG: x.portion, unit: UNIT });
  const f = x.portion / 100;
  const pp = { cho: (x.cho ?? 0) * f, pro: (x.pro ?? 0) * f, fat: (x.fat ?? 0) * f,
    fibre: x.fibre == null ? null : x.fibre * f, sugars: (x.sugars ?? 0) * f,
    sfa: (x.sfa ?? 0) * f, salt: (x.salt ?? 0) * f,
    k: x.k == null ? null : x.k * f, p: x.p == null ? null : x.p * f,
    kcal: x.kcal == null ? ((x.cho ?? 0) * 4 + (x.pro ?? 0) * 4 + (x.fat ?? 0) * 9) * f : x.kcal * f };
  const dec = decompose(pp, UNIT, why.group, { proteinTiers: true });
  const app = fromApp(dec), hand = recount(x, UNIT, why.group);
  const agree = app.every((v, i) => Math.abs(v - hand[i]) < 1e-9);
  const kcalRebuilt = dec.rc * 4 + dec.rp * 4 + dec.rf * 9;
  const drift = pp.kcal > 0 ? ((kcalRebuilt - pp.kcal) / pp.kcal) * 100 : 0;
  const scans = scanIngredients(x.ing || "");
  return { x, why, dec, app, hand, agree, drift, scans,
    grouped: why.group === (x.expect ?? why.group) };
}

const fmt = (v) => (v === 0 ? "-" : String(v));
const exList = (dec) => dec.rounded.length
  ? dec.rounded.map((o) => `${o.ex} ${o.label.toLowerCase()}`).join(", ")
  : "none, under half an exchange";

function table(rows) {
  const head = "| Product | Barcode | Per 100 g<br>CHO / Pro / Fat | Portion | Group, and why | CarbX exchanges | Independent recount | Agree | Drift | Reviewer |\n"
    + "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";
  const body = rows.map((r) => {
    const x = r.x;
    const macros = `${r1(x.cho ?? 0)} / ${r1(x.pro ?? 0)} / ${r1(x.fat ?? 0)}`;
    const grp = `${x.expect === r.why.group ? "" : "**"}${r.why.group}${x.expect === r.why.group ? "" : "**"} (${VIA[r.why.via]})`;
    return `| ${x.name}${x.brand ? `<br><small>${x.brand}</small>` : ""} | \`${x.barcode}\` | ${macros} | ${x.portion} g | ${grp} | ${exList(r.dec)} | ${r.hand.map(fmt).join(" / ")} | ${r.agree ? "yes" : "**NO**"} | ${r.drift >= 0 ? "+" : ""}${r1(r.drift)}% |  |`;
  }).join("\n");
  return `${head}\n${body}`;
}

const everyday = data.everyday.map(row);
const edge = data.edge.map(row);
const all = [...everyday, ...edge];
const disagree = all.filter((r) => !r.agree);
const misgrouped = all.filter((r) => r.x.expect && r.x.expect !== r.why.group);
const highDrift = all.filter((r) => Math.abs(r.drift) > 10);

const md = `# Validation

CarbX's unit tests show the code does what it was told to do. They say nothing
about whether the exchanges it produces are the right ones. This file is the
other half: twenty real products, worked through against the exchange-list
method as written down, with every disagreement recorded rather than resolved
quietly.

**Source.** ${data.source}, records retrieved ${data.retrieved}. Every label
value in \`products.json\` is verbatim from the product record, including the
gaps and at least one figure that is plainly wrong. Barcodes are given so any
reviewer can pull the same record and check the input as well as the output.
Open Food Facts is crowd-sourced and unverified, which is the point: it is what
the app's database search actually returns.

**Convention.** 15 g of carbohydrate per exchange, total carbohydrate counted
with nothing netted off for fibre, tiered protein list. Portions are ordinary
serving sizes, not exchange-sized ones.

**Columns.** *Group, and why* is what \`inferGroupWithReason()\` decided and
whether a name or the figures decided it; a group in bold is one that differs
from what the fixture expected. *CarbX exchanges* is the app's output.
*Independent recount* is carbohydrate / protein / fat exchanges recomputed by
\`build.mjs\` from the three stages as documented in the README, without calling
\`decompose()\`. *Drift* is how much energy rounding to half exchanges cost.
*Reviewer* is deliberately blank, for a dietitian to sign off or object.

Regenerate with \`node validation/build.mjs\`.

## Everyday foods

${table(everyday)}

## Deliberate edge cases

These were chosen because they are the ones most likely to break a
classification rule. The reason each is here:

${data.edge.map((x) => `- **${x.name}** (\`${x.barcode}\`). ${x.why}`).join("\n")}

${table(edge)}

## What this run shows

- Independent recount agrees with the app on ${all.length - disagree.length} of ${all.length} products${disagree.length ? `. Disagreements: ${disagree.map((r) => r.x.name).join(", ")}` : ", with no disagreements."}
- Classification matched the expected group on ${all.length - misgrouped.length} of ${all.length}${misgrouped.length ? `. Differences: ${misgrouped.map((r) => `${r.x.name} came out ${r.why.group}, expected ${r.x.expect}`).join("; ")}` : "."}
- Rounding drift above 10% on ${highDrift.length} of ${all.length}${highDrift.length ? `: ${highDrift.map((r) => `${r.x.name} (${r1(r.drift)}%)`).join(", ")}. The app flags these and tells the user to count grams of carbohydrate instead.` : "."}
- Potassium or phosphorus declared on ${all.filter((r) => r.x.k != null || r.x.p != null).length} of ${all.length} labels. Neither is mandatory in the EU or the US, so the renal flags are unavailable on almost every real product and the ingredient scan carries that work instead.

## Ingredient scan results

${all.filter((r) => r.x.ing).map((r) => `- **${r.x.name}**: ${r.scans.length ? r.scans.map((s) => `${s.title} (${s.hits.join(", ")})`).join("; ") : "nothing matched"}`).join("\n")}

## Open questions for review

1. Sweets are assigned by name. A dessert the keyword lists do not know, in a
   language they do not cover, still reaches starch: same carbohydrate, wrong
   group. Composition alone cannot separate a cake from a starchy dish.
2. Jam counts as fruit, because the word fruit outranks jam in the name lists,
   even though sugar is 97% of its carbohydrate. Left deliberately.
3. The phosphorus flag fires above 12 mg per g of protein. Noori et al. treat
   12 to under 14 mg/g as the reference band, with risk rising at 14 and above,
   so 12 is the conservative end of the evidence rather than its centre.
`;

writeFileSync(new URL("./VALIDATION.md", import.meta.url), md);
console.log(`wrote VALIDATION.md: ${all.length} products, ${disagree.length} recount disagreements, ${misgrouped.length} group differences`);
