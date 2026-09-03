/* ------------------------------------------------------------------ *
 * EXCHANGE LOOKUP — pure logic
 * Everything in this file is a plain function of its inputs: no DOM, no
 * React, no network. Extracted out of App.jsx so it can be unit tested
 * directly. Behaviour is unchanged from the inline originals.
 * ------------------------------------------------------------------ */

/* ---------------- exchange reference system ----------------
 * A diabetes exchange list groups foods by how much carbohydrate, protein
 * and fat one "exchange" of a group carries. groups() returns the US
 * reference values, scaled to whatever CHO-per-unit convention the user
 * picked (15 g US, 12 g Belgian, 10 g Kenyan/Dutch). TIERS covers the
 * protein side: how much fat rides along with 7 g of protein decides
 * whether a food counts as lean, medium or high-fat protein.
 * ---------------------------------------------------------- */
export function groups(unit) {
  const k = unit / 15;
  return {
    starch: { id: "starch", label: "Starch", cho: 15 * k, pro: 3 * k, fat: 1 * k },
    fruit:  { id: "fruit",  label: "Fruit",  cho: 15 * k, pro: 0, fat: 0 },
    milk:   { id: "milk",   label: "Milk",   cho: 12 * k, pro: 8 * k, fat: 0 },
    veg:    { id: "veg",    label: "Non-starchy veg", cho: 5 * k, pro: 2 * k, fat: 0 },
    sweet:  { id: "sweet",  label: "Sweets / other CHO", cho: 15 * k, pro: 0, fat: 0 },
  };
}
export const TIERS = [
  { label: "Lean protein", fat: 2, max: 3 },
  { label: "Medium-fat protein", fat: 5, max: 7 },
  { label: "High-fat protein", fat: 8, max: 1e9 },
];

/*
 * Flags four additive classes worth knowing for renal and cardiovascular
 * diets: phosphate and potassium additives (both absorbed far more
 * completely than the same minerals occurring naturally in whole foods),
 * sodium-bearing preservatives, and common added-sugar sources. Each
 * entry matches either an E-number or the additive's name, in English,
 * Dutch and Greek.
 */
export const SCANS = [
  { id: "phos", cls: "a", title: "Phosphate additives",
    e: /\b[eE]\s?-?(338|339|340|341|343|442|450|451|452|1410|1412|1413|1414|1442)\b/g,
    words: /(phosph\w*|fosfa\w*|fosfor\w*|φωσφορ\w*)/gi },
  { id: "pot", cls: "w", title: "Potassium additives",
    e: /\b[eE]\s?-?(340|501|508|515|525|536)\b/g,
    words: /(potassium\s+(chloride|lactate|citrate|carbonate)|kaliumchloride|kaliumlactaat|χλωριούχο\s+κάλιο|salt\s+substitute|zoutvervanger)/gi },
  { id: "sug", cls: "w", title: "Added sugar sources",
    e: null,
    words: /(glucose[-\s]?fructose\s?syrup|fructose[-\s]?glucose\s?syrup|glucose\s?syrup|corn\s?syrup|maltodextrin\w*|dextrose|invert\s?sugar|glucosestroop|fructose-?glucosestroop|maltodextrine|invertsuiker|σιρόπι\s+γλυκόζης|μαλτοδεξτρίνη|honey|honing|μέλι|concentrated\s+fruit\s+juice|molasses)/gi },
  { id: "na", cls: "w", title: "Sodium-bearing additives",
    e: /\b[eE]\s?-?(250|251|252|262|281|500|621|627|631)\b/g,
    words: /(monosodium\s+glutamate|sodium\s+(nitrite|nitrate|benzoate|bicarbonate)|natriumnitriet|natriumbicarbonaat)/gi },
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

/*
 * Reads a nutrition label, pasted text or OCR output from a photo, with
 * plain regex instead of a model: find a keyword in one of five
 * languages, take the nearest following number. Naive by design, no
 * network call, nothing leaves the device, but it only recognises
 * common label wording and can miss unusual layouts or a product name.
 * Treat the result as a starting point, check it against the pack.
 */
export function firstNum(re, text) {
  const m = text.match(re);
  if (!m) return null;
  return parseFloat(m[1].replace(",", "."));
}
export function parseNutritionText(text) {
  const t = (text || "").replace(/\r/g, " ").replace(/\u00a0/g, " ");
  const basis = /100\s*m\s?l/i.test(t) ? "100ml"
    : /100\s*g/i.test(t) ? "100g"
    : /per\s*(portion|serving|part|deel)/i.test(t) ? "serving"
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

  const ingMatch = t.match(/(?:ingredi[eë]nten|ingredients?|ingr[ée]dients?|zutaten|συστατικά)\s*[:\-]?\s*([\s\S]+)/i);
  const ing = ingMatch ? ingMatch[1].split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim().slice(0, 800) : "";

  return { cho, pro, fat, fibre, sugars, sfa, salt, k, p, kcal, ing, basis };
}

export const r1 = (x) => Math.round(x * 10) / 10;
export const r0 = (x) => Math.round(x);
export const half = (x) => Math.round(x * 2) / 2;
export const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Common fruit names, English/Dutch/German/French/Greek - the same five
// languages the rest of this file supports. Necessarily incomplete (no fixed
// list covers "any language"), which is why isFruitLike() below exists as a
// language-agnostic backstop for names this list doesn't recognise.
const FRUIT_WORDS = [
  "fruit", "vrucht", "frucht", "φρού",
  "apple", "appel", "apfel", "pomme", "μήλ",
  "banana", "banaan", "banane", "μπανάν",
  "orange", "sinaasappel", "apfelsine", "πορτοκάλ",
  "mandarin", "tangerine", "clementine", "μανταρίν",
  "grape", "druif", "druiven", "traube", "raisin sec", "σταφύλ",
  "raisin", "rozijn", "rosine", "σταφίδ",
  "pear", "peer", "birne", "poire", "αχλάδ",
  "melon", "meloen", "melone", "πεπόν",
  "watermelon", "watermeloen", "wassermelone", "pastèque", "καρπούζ",
  "strawberry", "aardbei", "erdbeere", "fraise", "φράουλ",
  "raspberry", "framboos", "himbeere", "framboise", "βατόμουρ",
  "blueberry", "bosbes", "heidelbeere", "myrtille", "μύρτιλ",
  "blackberry", "braam", "brombeere", "mûre", "βατόμουρ",
  "cherry", "kers", "kirsche", "cerise", "κεράσ",
  "peach", "perzik", "pfirsich", "pêche", "ροδάκιν",
  "nectarine", "νεκταρίν",
  "plum", "pruim", "pflaume", "prune", "δαμάσκην",
  "apricot", "abrikoos", "aprikose", "abricot", "βερίκοκ",
  "date", "dadel", "dattel", "χουρμάδ",
  "fig", "vijg", "feige", "figue", "σύκ",
  "pomegranate", "granaatappel", "granatapfel", "grenade", "ρόδ",
  "kiwi", "ακτινίδ",
  "pineapple", "ananas", "ανανά",
  "mango", "μάνγκο",
  "papaya", "παπάγια",
  "guava",
  "lemon", "citroen", "zitrone", "citron", "λεμόν",
  "lime", "limoen", "limette",
  "grapefruit", "pompelmoes", "pamplemousse", "γκρέιπφρουτ",
  "persimmon",
  "juice", "sap", "saft", "χυμ",
];

export function inferGroup(p, name = "") {
  const t = name.toLowerCase();
  const has = (...k) => k.some((x) => t.includes(x));
  // "ei" (Dutch for egg) and "vis" (Dutch for fish) are only 2-3 letters, so a
  // plain substring test matches them inside unrelated words too - notably
  // "ei" inside "protein", which is common in modern packaged-food names.
  // Require these two to at least start a word (not preceded by a letter or
  // digit) so "high protein bar" doesn't get treated as containing egg, while
  // "gekookt ei" / "eiersalade" / "visfilet" still match as intended.
  const hasWordStart = (...tokens) => tokens.some((tok) => new RegExp(`(^|[^\\p{L}\\p{N}])${tok}`, "iu").test(t));
  const kcal = p.cho * 4 + p.pro * 4 + p.fat * 9 || 1;
  if (has("oil", "olie", "butter", "boter", "margarine", "λάδι", "βούτυρο") && p.cho < 5 && p.pro < 5) return "fat-only";
  if (has("milk", "melk", "yog", "kefir", "γάλα", "γιαούρτι") && p.cho > 2 && p.pro > 2) return "milk";
  if (has("cheese", "kaas", "τυρί", "meat", "vlees", "fish", "ham", "egg", "tofu", "nut", "noot") || hasWordStart("ei", "vis")) return p.cho < 5 ? "protein-only" : "starch";
  if (has(...FRUIT_WORDS)) return "fruit";
  // Language-agnostic backstop: a food not named in FRUIT_WORDS (any other
  // language, an unusual product name) that still has fresh fruit's macro
  // signature - mostly-sugar carbohydrate, some fibre, next to no protein or
  // fat, in a plausible per-100g range - gets classified as fruit by its
  // composition instead of falling through to starch/veg. The fibre floor
  // is what keeps a zero-fibre sugary drink or straight honey/syrup from
  // being caught here too; dried fruit (much more concentrated CHO) isn't
  // covered by this and relies on FRUIT_WORDS instead.
  const sugars = num(p.sugars) ?? 0, fibre = num(p.fibre) ?? 0;
  const sugarRatio = p.cho > 0 ? sugars / p.cho : 0;
  if (p.cho >= 2 && p.cho <= 35 && p.pro < 3 && p.fat < 3 && fibre >= 0.3 && sugarRatio >= 0.45) return "fruit";
  const fatPct = (p.fat * 9) / kcal, choPct = (p.cho * 4) / kcal, proPct = (p.pro * 4) / kcal;
  if (fatPct > 0.7 && p.cho < 5 && p.pro < 5) return "fat-only";
  if (proPct > 0.4 && p.cho < 5) return "protein-only";
  if (choPct > 0.45) return p.cho > 12 ? "starch" : "veg";
  if (p.cho < 2 && p.pro > 5) return "protein-only";
  return "starch";
}

/*
 * Walks a food's macros down to whole exchanges, one group at a time:
 * carbohydrate first, against the auto-detected or user-picked group,
 * then whatever protein is left over (7 g per exchange, fat tier set by
 * how much fat comes with it), then whatever fat remains after that
 * (5 g per exchange). Each stage only touches the residual left by the
 * stage before it, which is why order matters and why real foods rarely
 * divide evenly into exchange units. Fractional exchanges round to the
 * nearest half.
 */
export function decompose(p, unit, groupId, subFibre) {
  const G = groups(unit);
  const steps = [], out = [];
  const choAvail = subFibre && p.fibre > 5 ? Math.max(0, p.cho - p.fibre) : p.cho;
  let cho = choAvail, pro = p.pro, fat = p.fat;
  steps.push({ kind: "start", label: subFibre && p.fibre > 5
    ? `Portion, fibre ${r1(p.fibre)} g netted off` : "Portion as eaten", cho, pro, fat });

  if (G[groupId] && cho > 0.4) {
    const g = G[groupId], ex = cho / g.cho;
    const dP = Math.min(pro, ex * g.pro), dF = Math.min(fat, ex * g.fat);
    cho -= ex * g.cho; pro -= dP; fat -= dF;
    out.push({ label: g.label, ex, ref: g });
    steps.push({ kind: "draw", label: `${r1(ex)} × ${g.label}`, cho: -(ex * g.cho), pro: -dP, fat: -dF });
    steps.push({ kind: "res", label: "residual", cho, pro, fat });
  }
  if (pro > 1.2) {
    const ex = pro / 7, fatPer = fat / ex;
    const tier = TIERS.find((t) => fatPer <= t.max) || TIERS[2];
    const dF = Math.min(fat, ex * tier.fat);
    pro -= ex * 7; fat -= dF;
    out.push({ label: tier.label, ex, ref: { cho: 0, pro: 7, fat: tier.fat } });
    steps.push({ kind: "draw", label: `${r1(ex)} × ${tier.label}`, cho: 0, pro: -(ex * 7), fat: -dF });
    steps.push({ kind: "res", label: "residual", cho, pro, fat });
  }
  if (fat > 1.2) {
    const ex = fat / 5; fat -= ex * 5;
    out.push({ label: "Fat", ex, ref: { cho: 0, pro: 0, fat: 5 } });
    steps.push({ kind: "draw", label: `${r1(ex)} × Fat`, cho: 0, pro: 0, fat: -(ex * 5) });
    steps.push({ kind: "res", label: "residual", cho, pro, fat });
  }
  const rounded = out.map((o) => ({ ...o, ex: half(o.ex) })).filter((o) => o.ex > 0);
  let rc = 0, rp = 0, rf = 0;
  for (const o of rounded) { rc += o.ex * o.ref.cho; rp += o.ex * o.ref.pro; rf += o.ex * o.ref.fat; }
  return { steps, rounded, rc, rp, rf };
}

// Converts one exchange back into grams of this specific food. Unlike
// the exchange counts above, this ignores portion size, it is a fixed
// property of the food's own composition (e.g. "1 starch exchange of
// this cracker = 47 g"), so it stays correct even if the portion changes.
export function gramsPerExchange(ref, per100) {
  if (ref.cho > 0) return per100.cho > 0 ? (100 * ref.cho) / per100.cho : null;
  if (ref.pro > 0) return per100.pro > 0 ? (100 * ref.pro) / per100.pro : null;
  if (ref.fat > 0) return per100.fat > 0 ? (100 * ref.fat) / per100.fat : null;
  return null;
}
