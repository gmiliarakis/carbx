import { KEYWORDS } from "./keywords.js";

// Exchange logic. No DOM, no React, no network: every function here is a
// plain function of its arguments.

// An exchange list groups foods by how much carbohydrate, protein and fat one
// exchange of a group carries. The convention in use (15 g US, 10 g Dutch)
// redefines the carbohydrate unit and nothing else, so only the cho column
// scales. A milk exchange carries 8 g of protein in every
// system. TIERS covers the protein side: the fat that comes with 7 g of protein
// decides lean, medium or high fat.
export function groups(unit) {
  const k = unit / 15;
  return {
    starch: { id: "starch", label: "Starch", cho: 15 * k, pro: 3, fat: 1 },
    fruit:  { id: "fruit",  label: "Fruit",  cho: 15 * k, pro: 0, fat: 0 },
    milk:   { id: "milk",   label: "Milk",   cho: 12 * k, pro: 8, fat: 0 },
    veg:    { id: "veg",    label: "Non-starchy veg", cho: 5 * k, pro: 2, fat: 0 },
    sweet:  { id: "sweet",  label: "Sweets / other CHO", cho: 15 * k, pro: 0, fat: 0 },
  };
}
export const TIERS = [
  { label: "Lean protein", fat: 2, max: 3 },
  { label: "Medium-fat protein", fat: 5, max: 7 },
  { label: "High-fat protein", fat: 8, max: 1e9 },
];

// The milk list has three fat variants sharing 12 g of carbohydrate and 8 g of
// protein, separated by the fat one exchange carries: 0 to 3 g inclusive is
// fat-free, 4 to 7 is reduced-fat, 8 or more is whole. `fat` here is the list's
// nominal figure for the variant, used for reference only. The exchange itself
// is charged the fat actually on the label, so a fat-free yoghurt declaring
// 1.6 g is a fat-free milk exchange carrying 1.6 g, not 0.
export const MILK_TIERS = [
  { label: "Fat-free milk", fat: 0, max: 3 },
  { label: "Reduced-fat milk", fat: 5, max: 7 },
  { label: "Whole milk", fat: 8, max: 1e9 },
];

// The protein and fat exchanges, kept here with the rest of the reference
// values so no rule writes a group's macro grams out by hand. Neither carries
// carbohydrate, so the carbohydrate convention does not scale them: only the
// fat on a protein exchange varies, and TIERS decides that.
export const PROTEIN_EXCHANGE = { cho: 0, pro: 7, fat: 0 };
export const FAT_EXCHANGE = { cho: 0, pro: 0, fat: 5 };

// Additive classes worth flagging on a renal or cardiovascular diet.
// Phosphate and potassium additives are absorbed far more completely than
// the same minerals occurring naturally in food. Each entry matches an
// E-number, which carries no language, or the additive name in the same five
// languages the label parser reads. German and Dutch mostly differ by a
// trailing vowel, so one stem plus \w* usually covers both.
export const SCANS = [
  { id: "phos", cls: "a", title: "Phosphate additives",
    e: /\b[eE]\s?-?(338|339|340|341|343|442|450|451|452|1410|1412|1413|1414|1442)\b/g,
    words: /(phosph\w*|fosfa\w*|fosfor\w*|φωσφορ\w*)/gi },
  { id: "pot", cls: "w", title: "Potassium additives",
    e: /\b[eE]\s?-?(340|501|508|515|525|536)\b/g,
    words: /(potassium\s+(chloride|lactate|citrate|carbonate)|kalium(chlorid|lactaat|lactat|citrat|carbonat)\w*|(chlorure|lactate|citrate|carbonate)\s+de\s+potassium|χλωριούχο\s+κάλιο|salt\s+substitute|zoutvervanger|kaliumzout)/gi },
  { id: "sug", cls: "w", title: "Added sugar sources",
    e: null,
    words: /(glucose[-\s]?fructose\s?syrup|fructose[-\s]?glucose\s?syrup|glucose\s?syrup|corn\s?syrup|maltodextrin\w*|dextrose|invert\s?sugar|glucosestroop|fructose-?glucosestroop|invertsuiker|glu[ck]ose[-\s]?fru[ck]tose[-\s]?sirup|glu[ck]osesirup|invertzucker|sirop\s+de\s+glucose([-\s]?fructose)?|sucre\s+inverti|σιρόπι\s+γλυκόζης|μαλτοδεξτρίνη|honey|honing|honig|\bmiel\b|μέλι|concentrated\s+fruit\s+juice|molasses)/gi },
  { id: "na", cls: "w", title: "Sodium-bearing additives",
    e: /\b[eE]\s?-?(250|251|252|262|281|500|621|627|631)\b/g,
    words: /(monosodium\s+glutamate|mononatriumglutamat\w*|glutamate\s+monosodique|sodium\s+(nitrite|nitrate|benzoate|bicarbonate)|natrium(nitriet|nitrit|nitraat|nitrat|benzoaat|benzoat|bicarbonaat|bicarbonat|hydrogencarbonat)\w*|(nitrite|nitrate|benzoate|bicarbonate)\s+de\s+sodium|(νιτρώδες|νιτρικό|βενζοϊκό|γλουταμινικό|ανθρακικό|διττανθρακικό)\s+νάτριο)/gi },
];
export function scanIngredients(text) {
  if (!text || text.trim().length < 3) return [];
  return SCANS.map((s) => {
    const hits = new Set();
    if (s.e) for (const m of text.matchAll(s.e)) hits.add("E" + m[1]);
    for (const m of text.matchAll(s.words)) hits.add(m[0].trim().toLowerCase());
    return { ...s, hits: [...hits] };
  }).filter((s) => s.hits.length);
}

// Offline label reader for pasted text and OCR output: find a keyword in
// one of five languages, take the nearest number after it. It only knows
// common label wording, so the values it fills in need checking.
export function firstNum(re, text) {
  const m = text.match(re);
  if (!m) return null;
  return parseFloat(m[1].replace(",", "."));
}
export function parseNutritionText(text) {
  const t = (text || "").replace(/\r/g, " ").replace(/\u00a0/g, " ");
  const basis = /100\s*m\s?l/i.test(t) ? "100ml"
    : /100\s*g/i.test(t) ? "100g"
    : /(\bper|\bpro|\bpar|\bje|ανά)\s*(portion|portie|serving|part|deel|μερίδ)/i.test(t) ? "serving"
    : "100g";

  const kcal   = firstNum(/(\d+(?:[.,]\d+)?)\s*kcal/i, t);
  const fat    = firstNum(/(?:vet(?:ten)?|fats?|mati[eè]res?\s*grasses?|fette?|λιπαρ\w*)\D{0,15}?(\d+(?:[.,]\d+)?)\s*g/i, t);
  const sfa    = firstNum(/(?:waarvan\s*verzadigd\w*|of\s*which\s*saturates?|saturated\s*fat\w*|dont\s*(?:acides\s*gras\s*)?satur\w*|davon\s*ges[aä]ttigte\w*|κορεσμ\w*)\D{0,15}?(\d+(?:[.,]\d+)?)\s*g/i, t);
  const cho    = firstNum(/(?:koolhydrat\w*|carbohydrate\w*|glucides?|kohlenhydrate\w*|υδατάνθρακ\w*)\D{0,15}?(\d+(?:[.,]\d+)?)\s*g/i, t);
  const sugars = firstNum(/(?:waarvan\s*suikers|of\s*which\s*sugars?|sugars?|dont\s*sucres?|davon\s*zucker|σάκχαρ\w*)\D{0,15}?(\d+(?:[.,]\d+)?)\s*g/i, t);
  const fibre  = firstNum(/(?:vezels?|fibre\w*|fiber\w*|fibres?|ballaststoffe\w*|φυτικ[εέ]ς?\s*ίνες|ίνες)\D{0,15}?(\d+(?:[.,]\d+)?)\s*g/i, t);
  const pro    = firstNum(/(?:eiwitten|protein\w*|prot[ée]ines?|eiwei[sß]e?|πρωτεΐν\w*)\D{0,15}?(\d+(?:[.,]\d+)?)\s*g/i, t);
  const salt   = firstNum(/(?:zout|salt|sel|salz|αλάτι)\D{0,15}?(\d+(?:[.,]\d+)?)\s*g/i, t);
  const k      = firstNum(/(?:kalium|potassium|κάλιο)\D{0,15}?(\d+(?:[.,]\d+)?)\s*mg/i, t);
  const p      = firstNum(/(?:fosfor|phosphorus|phosphore|phosphor|φώσφορος)\D{0,15}?(\d+(?:[.,]\d+)?)\s*mg/i, t);

  const ingMatch = t.match(/(?:ingredi[eë]nten|ingredients?|ingr[ée]dients?|zutaten|συστατικά)\s*[:-]?\s*([\s\S]+)/i);
  const ing = ingMatch ? ingMatch[1].split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim().slice(0, 800) : "";

  return { cho, pro, fat, fibre, sugars, sfa, salt, k, p, kcal, ing, basis };
}

export const r1 = (x) => Math.round(x * 10) / 10;
export const r0 = (x) => Math.round(x);
export const half = (x) => Math.round(x * 2) / 2;
export const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Name matching for inferGroup(). Each group's keywords live in keywords.js;
// this turns them into a "how well does this name match" score, which is the
// length of the longest keyword found in the name, or 0 for no match.
//
// Length is what resolves a name that matches two groups, and it resolves them
// the way a person would: the more specific word wins. "aardappel" beats
// "appel", "green bean" beats "bean", "cornichon" beats "corn", "buttermilk"
// beats "butter", "pepperoni" beats "pepper". Without it every one of those
// lands in the wrong group.
// Greek moves its accent when a word inflects or joins a compound: μελιτζάνα
// becomes μελιτζανοσαλάτα, ντομάτα is also written τομάτα. Folding the accents
// off both sides means a stem written either way still matches, and it folds
// the final sigma too. Latin letters are left alone, because German needs its
// umlauts kept apart: "Öl" is not "ol".
const GREEK_FOLD = { "ά": "α", "έ": "ε", "ή": "η", "ί": "ι", "ό": "ο", "ύ": "υ",
  "ώ": "ω", "ϊ": "ι", "ϋ": "υ", "ΐ": "ι", "ΰ": "υ", "ς": "σ" };
const fold = (s) => s.replace(/[άέήίόύώϊϋΐΰς]/g, (c) => GREEK_FOLD[c]);

function keywordScore(group, name) {
  const t = fold(name);
  const k = KEYWORDS[group];
  let best = 0;
  for (const term of k.any || []) {
    if (term.length > best && t.includes(fold(term))) best = term.length;
  }
  // A stem too short to be safe as a substring, anchored to a word start.
  // The entry is a regex fragment, so it can carry an exclusion of its own.
  for (const term of k.start || []) {
    if (new RegExp(`(^|[^\\p{L}\\p{N}])${term}`, "u").test(t)) {
      best = Math.max(best, term.replace(/\(\?![^)]*\)/g, "").length);
    }
  }
  // German compounds suffix the noun, so "öl" has to sit at a word end to
  // catch "Olivenöl" without also matching "Röllchen".
  for (const term of k.end || []) {
    if (new RegExp(`${term}(?![\\p{L}\\p{N}])`, "u").test(t)) {
      best = Math.max(best, term.length);
    }
  }
  return best;
}

// p is per 100 g. opts.portionG is the portion actually being eaten and
// opts.unit the carbohydrate convention, both used only by the dairy rule: a
// dairy-named food carrying a full milk exchange of protein in the portion is a
// milk portion however dilute it is per 100 g. The threshold is read from the
// group table rather than written out, so it cannot drift from it. The defaults
// make the rule read per 100 g at the 15 g convention.
//
// Returns the group together with how it was reached. `via` is "name" when a
// keyword settled it, "composition" when the macros did, and "default" when
// neither matched. The app shows this, so a reader can see which of the two
// produced the answer instead of taking the label on trust.
export function inferGroupWithReason(p, name = "", opts = {}) {
  const { portionG = 100, unit = 15 } = opts;
  const t = name.toLowerCase();
  const kcal = p.cho * 4 + p.pro * 4 + p.fat * 9 || 1;
  const fatPct = (p.fat * 9) / kcal, proPct = (p.pro * 4) / kcal;
  // Derived once, because the name branches need them too: a word in a name is
  // only worth acting on when the composition agrees with it.
  const G = groups(15);
  const sugars = num(p.sugars) ?? 0, fibre = num(p.fibre) ?? 0;
  const proPerCho = p.cho > 0 ? p.pro / p.cho : Infinity;
  const sugarFrac = p.cho > 0 ? sugars / p.cho : 0;
  // A field left blank is unknown, not zero. Missing data must never be read as
  // evidence against a food, only stated data can rule something out.
  const fibreStated = num(p.fibre) != null;
  const score = (g) => keywordScore(g, t);
  const byName = (group, rule) => ({ group, via: "name", rule });
  const byMacros = (group, rule) => ({ group, via: "composition", rule });

  // Fat first, and it wins outright over a longer name from another group,
  // because a fat name plus fat-dominant macros is not ambiguous: "cream
  // cheese" is a fat exchange even though "cheese" is protein. Nuts, seeds and
  // nut butters live in this list, following the US and EDE lists, so the gate
  // is that fat dominates the energy rather than that protein is absent. It is
  // what keeps "olive bread" and "peanut butter cookies" out.
  if (score("fat") > 0 && (fatPct >= 0.6 || (p.cho < 5 && p.pro < 5)))
    return byName("fat-only", "the name matched the fat list and the macros agree");

  const portionPro = p.pro * (portionG / 100);
  // A dairy word is only dairy when the food carries protein against its
  // carbohydrate and is not mostly fat. Sweetening a yoghurt dilutes the ratio,
  // so the floor is low, but milk chocolate sits below it and is 30 g of fat
  // besides, and "milk roll" and "milk chocolate" are both rejected. Dairy also
  // wins outright, so "chocolate milk" is milk while "milk chocolate", failing
  // the gate, falls through to the sweets in the starch list.
  // Fat alone cannot rule dairy out: strained yoghurt and whole milk powder
  // both carry more than 12 g. What separates them from milk chocolate is that
  // their protein still stands in a milk-like ratio to their carbohydrate.
  const milkRatio = G.milk.pro / G.milk.cho;
  const dairyLike = proPerCho >= milkRatio * 0.3
    && (p.fat < 12 || proPerCho >= milkRatio * 0.75);
  if (score("milk") > 0 && dairyLike
      && ((p.cho > 2 && p.pro > 2) || portionPro >= groups(unit).milk.pro))
    return byName("milk", "the name matched the dairy list and the protein stands in a milk-like ratio to the carbohydrate");

  // A fruit word is often a flavour rather than the food: apple pie, banana
  // bread, strawberry yoghurt, lemonade, cherry cola, fruit squash. The name is
  // still good evidence, so it is only overruled when the composition
  // positively contradicts it. Fat or protein a fruit would not carry does
  // that. So does a declared absence of fibre, which whole fruit always has,
  // unless the food is a juice, the one fruit that has none.
  const isJuice = /juice|saft|jus de|χυμ|(^|[^\p{L}])sap/u.test(fold(t));
  const contradictsFruit = p.fat >= 3
    || proPerCho >= (G.starch.pro / G.starch.cho) * 0.5
    || (fibreStated && fibre < 0.3 && !isJuice);

  // The remaining four groups are settled together, by the longest keyword,
  // so the most specific name wins wherever two lists overlap. Each still has
  // to satisfy its own composition gate; a group whose gate fails drops out
  // and the next-longest match is considered instead.
  const gates = {
    // A protein-named food is a protein until it carries a starch exchange's
    // worth of carbohydrate, which is what a breadcrumb coating or a cracker
    // does. Feta at 6.7 g and a soft cheese at 5.3 g are still protein.
    protein: () => (p.cho < 12
      ? byName("protein-only", "the name matched the protein list")
      : byName("starch", "the name matched the protein list, but the food carries a starch exchange of carbohydrate")),
    fruit: () => (contradictsFruit
      ? null
      : byName("fruit", "the name matched the fruit list and nothing in the macros contradicts it")),
    // A vegetable exchange is 5 g of carbohydrate, so a vegetable name on a
    // food carrying more than about two of them is a dish, not a vegetable.
    // Fat is deliberately not part of the gate: roasted vegetables are still
    // vegetables, and decompose turns the oil into fat exchanges by itself.
    veg: () => (p.cho <= 12
      ? byName("veg", "the name matched the vegetable list and the carbohydrate is low enough for one")
      : null),
    // The sweets list carries 15 g of carbohydrate and nothing else, which is
    // what separates it from starch. The gate is that the food actually carries
    // the carbohydrate: a sugar-free version of the same product does not.
    sweet: () => (p.cho >= 8
      ? byName("sweet", "the name matched the sweets list and the food carries carbohydrate")
      : null),
    // The gate is only that the food actually carries carbohydrate: a
    // "cauliflower rice" does not.
    starch: () => (p.cho >= 8
      ? byName("starch", "the name matched the starch list and the food carries carbohydrate")
      : null),
  };
  const ranked = Object.keys(gates)
    .map((g) => [g, score(g)])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  for (const [g] of ranked) {
    const decided = gates[g]();
    if (decided) return decided;
  }

  // Composition fallback, for a food whose name says nothing useful. The
  // carbohydrate groups are told apart the way their definitions differ: by how
  // much protein rides with the carbohydrate, and by how much carbohydrate there
  // is at all. The ratios are read off the group table, not written out here.
  // Barely any fat-free carbohydrate: a fat, not a carbohydrate food.
  if (fatPct > 0.7 && p.cho < 5 && p.pro < 5)
    return byMacros("fat-only", "over 70% of the energy is fat, with little carbohydrate or protein");

  // A food whose energy is almost entirely fat and which carries no protein at
  // all is a fat exchange even when it declares some carbohydrate. Coconut-oil
  // and starch imitation cheeses sit here: 29 g of fat, 11 g of starch, no
  // protein, and a name that reads as cheese. The protein floor is what keeps
  // real foods carrying both out of this branch.
  if (fatPct > 0.75 && p.pro < 2 && p.cho < 15)
    return byMacros("fat-only", "the energy is almost all fat, with no protein to speak of and little carbohydrate");

  // Milk is checked before the protein rules. Dairy carries a lot of protein
  // against little carbohydrate, so a plain yoghurt would otherwise read as a
  // pure protein, when its carbohydrate is lactose and belongs on the milk
  // list. 12 g of carbohydrate against 8 g of protein, all of it sugar, no
  // fibre. The protein ratio is what keeps a watery vegetable out.
  if (p.cho >= 2 && p.cho <= 15 && fibre < 1 && sugarFrac >= 0.7
      && proPerCho >= (G.milk.pro / G.milk.cho) * 0.75)
    return byMacros("milk", "sugar carbohydrate with no fibre, carrying protein in a milk-like ratio");

  // Carbohydrate that is essentially all sugar, with nothing else in it: a soft
  // drink, a squash, a syrup, honey. This is the sweets list. It is not starch,
  // which would charge it 3 g of protein and 1 g of fat per exchange it plainly
  // does not have, and it is not fruit: a fruit or juice name reaches the fruit
  // rules above, so anything arriving here was never named as one.
  if (p.cho >= 2 && sugarFrac >= 0.9 && p.pro < 1 && p.fat < 1
      && (!fibreStated || fibre < 0.5))
    return byMacros("sweet", "the carbohydrate is almost entirely sugar, with no protein, fat or fibre alongside it");

  // Otherwise, barely any carbohydrate means a protein.
  if (proPct > 0.4 && p.cho < 5)
    return byMacros("protein-only", "over 40% of the energy is protein, with under 5 g of carbohydrate");
  if (p.cho < 2 && p.pro > 5)
    return byMacros("protein-only", "almost no carbohydrate, with protein present");

  // Nonstarchy vegetable: 5 g of carbohydrate against 2 g of protein, so little
  // carbohydrate with protein alongside it. That protein is what separates a
  // vegetable from a sugary drink carrying the same carbohydrate.
  if (p.cho <= 8 && p.fat < 3 && proPerCho >= (G.veg.pro / G.veg.cho) * 0.4)
    return byMacros("veg", "little carbohydrate with vegetable-like protein alongside it");

  // Fruit: 15 g of carbohydrate and no protein, mostly sugar, with some fibre.
  // Carrying next to no protein is what separates it from starch and milk, and
  // the fibre floor keeps sugar-water out. Rule 5 catches fruit the name list
  // does not cover; dried fruit is too concentrated to fit and relies on names.
  if (p.cho >= 8 && p.cho <= 35 && p.fat < 3 && fibre >= 0.3 && sugarFrac >= 0.45
      && proPerCho < (G.starch.pro / G.starch.cho) * 0.5)
    return byMacros("fruit", "mostly-sugar carbohydrate with some fibre and almost no protein or fat");

  return { group: "starch", via: "default",
    rule: "neither the name nor the composition matched a group, so it falls to starch" };
}

export function inferGroup(p, name = "", opts = {}) {
  return inferGroupWithReason(p, name, opts).group;
}

// Draws a food's macros down to whole exchanges, one group at a time. Total
// carbohydrate is what gets counted; nothing is netted off for fibre, because
// no exchange list instructs it and the American Diabetes Association does not
// recommend counting "net carbs".
// Carbohydrate first against the chosen group, then the protein left over
// (7 g per exchange, fat tier set by the fat that comes with it), then the
// fat still left (5 g per exchange). Each stage works on the residual from
// the stage before, so order matters. Fractions round to the nearest half.
// opts.proteinTiers says which protein list the person was given, and so only
// affects what an exchange is called: the tiered meat list names it lean,
// medium-fat or high-fat, a single protein category just calls it protein.
// Either way the exchange carries the fat the label declares. A tier is a range,
// and the tier is picked because the food's fat falls inside it, so a food with
// 3 g of fat per exchange is lean carrying 3 g. Nothing spills into a separate
// fat exchange on account of a nominal figure.
export function decompose(p, unit, groupId, opts = {}) {
  const { proteinTiers = true } = opts;
  const G = groups(unit);
  const steps = [], out = [];
  let cho = p.cho, pro = p.pro, fat = p.fat;
  steps.push({ kind: "start", label: "Portion as eaten", cho, pro, fat });

  if (G[groupId] && cho > 0.4) {
    let g = G[groupId];
    const ex = cho / g.cho;
    // Milk carries a fat variant, picked by the fat that comes with one exchange
    // of it. The variant names the food; it does not restate its fat. The
    // exchange is charged fatPer, the label's own figure, so nothing measured is
    // replaced by the list's nominal value.
    if (g.id === "milk") {
      const fatPer = fat / ex;
      const tier = MILK_TIERS.find((t) => fatPer <= t.max) || MILK_TIERS[2];
      g = { ...g, label: tier.label, fat: fatPer };
    }
    const dP = Math.min(pro, ex * g.pro), dF = Math.min(fat, ex * g.fat);
    cho -= ex * g.cho; pro -= dP; fat -= dF;
    out.push({ label: g.label, ex, ref: g });
    steps.push({ kind: "draw", label: `${r1(ex)} × ${g.label}`, cho: -(ex * g.cho), pro: -dP, fat: -dF });
    steps.push({ kind: "res", label: "residual", cho, pro, fat });
  }
  // A food on the fat list counts as fat exchanges and nothing else. That is
  // what makes nuts work: 30 g of almonds is fat, and the protein riding
  // along with it is not a separate exchange in either the US or the EDE list.
  // The sweets list is skipped for the same reason: its entries are written as
  // carbohydrate plus fat and never as protein, so the couple of grams of
  // protein in a chocolate bar or a slice of cake must not become a protein
  // exchange and swallow the food's fat with it.
  if (pro > 1.2 && groupId !== "fat-only" && groupId !== "sweet") {
    const ex = pro / PROTEIN_EXCHANGE.pro, fatPer = fat / ex;
    const tier = TIERS.find((t) => fatPer <= t.max) || TIERS[2];
    const label = proteinTiers ? tier.label : "Protein";
    const refFat = fatPer;
    const dF = Math.min(fat, ex * refFat);
    pro -= ex * PROTEIN_EXCHANGE.pro; fat -= dF;
    out.push({ label, ex, ref: { ...PROTEIN_EXCHANGE, fat: refFat } });
    steps.push({ kind: "draw", label: `${r1(ex)} × ${label}`, cho: 0, pro: -(ex * PROTEIN_EXCHANGE.pro), fat: -dF });
    steps.push({ kind: "res", label: "residual", cho, pro, fat });
  }
  if (fat > 1.2) {
    const ex = fat / FAT_EXCHANGE.fat; fat -= ex * FAT_EXCHANGE.fat;
    out.push({ label: "Fat", ex, ref: FAT_EXCHANGE });
    steps.push({ kind: "draw", label: `${r1(ex)} × Fat`, cho: 0, pro: 0, fat: -(ex * FAT_EXCHANGE.fat) });
    steps.push({ kind: "res", label: "residual", cho, pro, fat });
  }
  const rounded = out.map((o) => ({ ...o, ex: half(o.ex) })).filter((o) => o.ex > 0);
  let rc = 0, rp = 0, rf = 0;
  for (const o of rounded) { rc += o.ex * o.ref.cho; rp += o.ex * o.ref.pro; rf += o.ex * o.ref.fat; }
  return { steps, rounded, rc, rp, rf };
}

// Converts one exchange back into grams of this food. It ignores portion
// size: "1 starch exchange of this cracker = 47 g" is a property of the
// food's composition and stays true whatever portion was entered.
export function gramsPerExchange(ref, per100) {
  if (ref.cho > 0) return per100.cho > 0 ? (100 * ref.cho) / per100.cho : null;
  if (ref.pro > 0) return per100.pro > 0 ? (100 * ref.pro) / per100.pro : null;
  if (ref.fat > 0) return per100.fat > 0 ? (100 * ref.fat) / per100.fat : null;
  return null;
}

// Open Food Facts returns every nutriment field ending in _100g in grams,
// energy excepted: "fields that end with _100g correspond to the amount of a
// nutriment (in g, or kJ for energy) for 100 g or 100 ml of product"
// (world.openfoodfacts.org/data/data-fields.txt). CarbX asks for potassium and
// phosphorus in mg, so those two are scaled and nothing else is. Salt is
// already in the grams the form expects. Where salt is absent but sodium is
// given, salt is derived at the EU factor of 2.5 (Regulation 1169/2011,
// Annex I: salt equivalent = sodium x 2.5).
export const OFF_MINERAL_MG = 1000;
export const SODIUM_TO_SALT = 2.5;
export function fromOpenFoodFacts(product) {
  const p = product || {};
  const N = p.nutriments || {};
  const s = (v) => (num(v) == null ? "" : String(num(v)));
  const mg = (v) => (num(v) == null ? "" : String(r1(num(v) * OFF_MINERAL_MG)));
  const salt = num(N.salt_100g) != null
    ? num(N.salt_100g)
    : num(N.sodium_100g) != null
      ? Math.round(num(N.sodium_100g) * SODIUM_TO_SALT * 1000) / 1000
      : null;
  return {
    name: p.product_name || p.code || "",
    cho: s(N.carbohydrates_100g),
    pro: s(N.proteins_100g),
    fat: s(N.fat_100g),
    fibre: s(N.fiber_100g),
    sugars: s(N.sugars_100g),
    sfa: s(N["saturated-fat_100g"]),
    salt: s(salt),
    k: mg(N.potassium_100g),
    p: mg(N.phosphorus_100g),
    kcal: s(N["energy-kcal_100g"]),
    ing: p.ingredients_text || "",
  };
}
