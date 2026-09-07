import { describe, it, expect } from "vitest";
import { KEYWORDS } from "./keywords.js";

// Lint for the keyword lists themselves. The lists are long and edited by hand,
// so the failure mode is not a wrong idea, it is a word that quietly swallows
// another word. "oil" inside "boiled" made a boiled egg a fat, "ei" inside
// "protein" made a protein bar an egg, "ente" inside "groente" made vegetables
// a duck. These tests catch that class before it reaches a food.

const GROUPS = Object.keys(KEYWORDS);
const anyTerms = (g) => KEYWORDS[g].any || [];
const allTerms = (g) => [...anyTerms(g), ...(KEYWORDS[g].start || []), ...(KEYWORDS[g].end || [])];

// Terms of three characters or fewer, which are only safe because something
// else constrains them. Each one here has been checked by hand; a new short
// term has to be added deliberately rather than by accident.
const ALLOWED_SHORT = new Set([
  "ham",  // Schinken, jambon: "jambon" is longer and wins on length
  "jam",  // inside "jambon", which wins on length
  "riz",  // inside "chorizo", which is protein and wins on length
  "blé",  // French wheat, always spelled with the accent
  "oie",  // French goose, inside "foie", which wins on length
  "egg",  // inside "eggplant", which wins on length
  "cod",  // inside "codfish"; no non-food word carries it
  "yog", "jog",  // yoghurt and Joghurt, both always followed by more letters
  "kip",  // Dutch chicken: "kipfilet", "kipnuggets", "skipjack" is protein too
  "œuf",  // the ligature makes it unambiguous
  "fig",  // inside "figue" and "figs", both fruit
  "λωτ", "χυμ",  // Greek stems, always followed by an ending
  "bun", "rye", "yam",  // no non-food word carries them
  "ijs",  // Dutch ice: inside "rijst", which is starch too
  "vla",  // Dutch custard: inside "vlaai", which the dairy gate rejects
  "reh",  // German deer: inside "Drehspieß", which is protein anyway
]);

// A fat or dairy keyword wins outright when its gate passes, so unlike every
// other group it is not settled by length. Any fat or dairy term sitting inside
// a longer term from another group is therefore a decision, not an accident:
// each pair below has been checked to confirm the composition gate separates
// them. A new pair fails this test until someone checks it the same way.
const REVIEWED_OVERLAPS = new Set([
  "butter<buttermilk", "butter<buttermilch", "butter<butternut",
  "butter<butterschmalz", "butter<butterkeks",
  "beurre<babeurre", "pignon<champignon", "lait<laitue", "lait<laitue romaine",
  "γάλα<κρέμα γάλακτος", "γάλακτος<κρέμα γάλακτος",
  "milk<buttermilk", "milch<buttermilch", "milch<dickmilch", "milch<kondensmilch",
  "sahne<schlagsahne", "sahne<saure sahne", "rahm<schmand",
  "creme<creme fraiche", "crème<crème fraîche",
  "oliv<olivenöl", "olive<olive oil",
  // checked against the gate: each of these carries too little fat, or too
  // little protein against its carbohydrate, to pass as fat or dairy
  "butter<butter bean", "olie<oliebol", "leinsamen<leinsamenbrot",
  "noisette<pommes noisette", "pignon<champignons",
  "pignon<champignon de paris", "vla<vlaai", "vla<vlaaivulling",
]);

describe("keywords.js: shape", () => {
  it("every term is lowercase, trimmed and non-empty", () => {
    for (const g of GROUPS) {
      for (const t of allTerms(g)) {
        expect(t, `${g}: ${JSON.stringify(t)}`).toBe(t.trim());
        expect(t.length, `${g}: empty term`).toBeGreaterThan(0);
        expect(t, `${g}: ${t} is not lowercase`).toBe(t.toLowerCase());
      }
    }
  });

  it("no term appears twice in the same group", () => {
    for (const g of GROUPS) {
      const seen = new Set(), dup = [];
      for (const t of anyTerms(g)) { if (seen.has(t)) dup.push(t); else seen.add(t); }
      expect(dup, `${g} repeats`).toEqual([]);
    }
  });

  it("no term appears in two groups, which would make it ambiguous", () => {
    const owner = new Map(), clashes = [];
    for (const g of GROUPS) {
      for (const t of anyTerms(g)) {
        if (owner.has(t) && owner.get(t) !== g) clashes.push(`${t}: ${owner.get(t)} and ${g}`);
        else owner.set(t, g);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("start and end entries compile as regexes", () => {
    for (const g of GROUPS) {
      for (const t of KEYWORDS[g].start || []) {
        expect(() => new RegExp(`(^|[^\\p{L}\\p{N}])${t}`, "u"), `${g}: ${t}`).not.toThrow();
      }
      for (const t of KEYWORDS[g].end || []) {
        expect(() => new RegExp(`${t}(?![\\p{L}\\p{N}])`, "u"), `${g}: ${t}`).not.toThrow();
      }
    }
  });
});

describe("keywords.js: words that swallow other words", () => {
  it("a term of three characters or fewer is on the checked list", () => {
    const loose = [];
    for (const g of GROUPS) {
      // start and end entries are anchored to a word boundary, which is what
      // makes a short stem safe, so they are not part of this check
      for (const t of anyTerms(g)) {
        if (t.length <= 3 && !ALLOWED_SHORT.has(t)) loose.push(`${g}: ${t}`);
      }
    }
    // A short term matches inside unrelated words. Either lengthen it, move it
    // to the group's start or end list, or add it to ALLOWED_SHORT with a
    // comment saying what makes it safe.
    expect(loose).toEqual([]);
  });

  it("every fat or dairy term inside a longer term from another group is reviewed", () => {
    const found = [];
    for (const short of ["fat", "milk"]) {
      for (const ts of anyTerms(short)) {
        for (const g of GROUPS) {
          if (g === short) continue;
          // plantDairy is exempt because inferGroup resolves it BEFORE the fat
          // and dairy rules, so a fat or dairy term sitting inside one of its
          // names can never win. "almond" inside "almond milk" is the case that
          // forced that ordering. inferGroupReason.test.js pins it.
          if (g === "plantDairy") continue;
          for (const tl of anyTerms(g)) {
            if (tl.length > ts.length && tl.includes(ts) && !REVIEWED_OVERLAPS.has(`${ts}<${tl}`)) {
              found.push(`${ts} (${short}) sits inside ${tl} (${g})`);
            }
          }
        }
      }
    }
    // Fat and dairy win outright rather than by length, so each of these needs
    // a composition gate that tells the two foods apart. Check it, then add
    // "short<long" to REVIEWED_OVERLAPS.
    expect(found).toEqual([]);
  });
});
