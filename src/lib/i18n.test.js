import { describe, it, expect } from "vitest";
import { LANGS, STRINGS, translator } from "../i18n.js";
import { SCANS, TIERS, MILK_TIERS, groups, inferGroupWithReason } from "./exchange.js";
import { KEYWORDS } from "./keywords.js";

// The interface reads every string through a key. These tests fail when a key
// exists in one language and not the other, or when the library starts
// producing an id the dictionary has never heard of, which would otherwise
// render as a bare key or silently fall back to English mid-sentence.

const LANG_IDS = LANGS.map((l) => l.id);

describe("the two languages stay in step", () => {
  it("offers exactly English and Greek", () => {
    expect(LANG_IDS).toEqual(["en", "el"]);
  });

  it.each(LANG_IDS)("%s has the same keys as every other language", (id) => {
    const reference = Object.keys(STRINGS.en).sort();
    expect(Object.keys(STRINGS[id]).sort()).toEqual(reference);
  });

  it("has no empty translations", () => {
    for (const id of LANG_IDS) {
      const blank = Object.entries(STRINGS[id]).filter(([, v]) => !v || !v.trim());
      expect(blank.map(([k]) => `${id}: ${k}`)).toEqual([]);
    }
  });

  it("keeps the flag sentences distinct within a language", () => {
    // Each flag has its own severity: "Salty" warns at 250 mg of sodium and
    // "High in salt" alerts at 500. If two of them read identically, the only
    // thing separating a warning from an alert on screen is its colour. This
    // catches the copy-paste that overwrites one flag with another.
    const clashes = [];
    for (const id of LANG_IDS) {
      const flags = Object.entries(STRINGS[id]).filter(([k]) => k.startsWith("flag"));
      const byText = new Map();
      for (const [k, v] of flags) {
        if (byText.has(v)) clashes.push(`${id}: ${byText.get(v)} and ${k} read the same`);
        byText.set(v, k);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("keeps the same placeholders in both languages", () => {
    const holders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const wrong = [];
    for (const key of Object.keys(STRINGS.en)) {
      for (const id of LANG_IDS.filter((l) => l !== "en")) {
        const a = holders(STRINGS.en[key]);
        const b = holders(STRINGS[id][key]);
        if (a.join() !== b.join()) wrong.push(`${key}: en has ${a} but ${id} has ${b}`);
      }
    }
    expect(wrong).toEqual([]);
  });
});

describe("every id the library produces has a translation", () => {
  const missing = (prefix, ids) => {
    const out = [];
    for (const id of ids) {
      for (const lang of LANG_IDS) {
        if (!(prefix + id in STRINGS[lang])) out.push(`${lang}: ${prefix}${id}`);
      }
    }
    return out;
  };

  it("names every food group, protein tier and milk variant", () => {
    const ids = [
      ...Object.keys(groups(15)),
      ...TIERS.map((x) => x.id),
      ...MILK_TIERS.map((x) => x.id),
      "protein", "fat", "protein-only", "fat-only",
    ];
    expect(missing("g_", ids)).toEqual([]);
  });

  it("names every additive scan category", () => {
    expect(missing("s_", SCANS.map((s) => s.id))).toEqual([]);
  });

  it("carries every classification reason the classifier can reach", () => {
    // Drive the classifier over foods that between them hit every branch, then
    // check each key it produced is translated.
    const foods = [
      ["Oat drink", { cho: 7.1, pro: 1.1, fat: 3, sugars: 3.4, fibre: 0.8 }],
      ["Sojayoghurt", { cho: 1, pro: 4, fat: 2.3, sugars: 0.7, fibre: 0.6 }],
      ["Olive oil", { cho: 0, pro: 0, fat: 100 }],
      ["Whole milk", { cho: 4.7, pro: 3.4, fat: 3.6, sugars: 4.7, fibre: 0 }],
      ["Chicken breast", { cho: 0, pro: 31, fat: 3.6 }],
      ["Breaded chicken", { cho: 20, pro: 15, fat: 10, fibre: 1 }],
      ["Banana", { cho: 23, pro: 1.1, fat: 0.3, sugars: 12, fibre: 2.6 }],
      ["Broccoli", { cho: 7, pro: 2.8, fat: 0.4, sugars: 1.7, fibre: 2.6 }],
      ["Table sugar", { cho: 100, pro: 0, fat: 0, sugars: 100, fibre: 0 }],
      ["Volkorenbrood", { cho: 37, pro: 11, fat: 1.8, sugars: 1.3, fibre: 6.5 }],
      ["", { cho: 0, pro: 0, fat: 100 }],
      ["Greek White panetto", { cho: 11, pro: 0, fat: 29, sugars: 0 }],
      ["", { cho: 4.7, pro: 3.4, fat: 0.5, sugars: 4.7, fibre: 0 }],
      ["", { cho: 10.6, pro: 0, fat: 0, sugars: 10.6, fibre: 0 }],
      ["", { cho: 0.5, pro: 26, fat: 4 }],
      ["", { cho: 1, pro: 26, fat: 4 }],
      ["", { cho: 4, pro: 2.8, fat: 0.4, sugars: 1.7, fibre: 2.6 }],
      ["", { cho: 14, pro: 0.3, fat: 0.2, sugars: 10, fibre: 2.4 }],
      ["xyzzy", { cho: 60, pro: 8, fat: 2 }],
    ];
    const keys = new Set(foods.map(([n, p]) => inferGroupWithReason(p, n).key));
    expect(keys.size).toBeGreaterThan(12);
    expect(missing("r_", [...keys])).toEqual([]);
  });

  it("translates every reason key the source file defines, reached or not", () => {
    // Belt and braces: the dictionary should carry a reason for each key in the
    // module, so adding a branch without translating it fails here.
    const reasons = Object.keys(STRINGS.en).filter((k) => k.startsWith("r_"));
    expect(reasons.length).toBeGreaterThanOrEqual(19);
    expect(missing("", reasons)).toEqual([]);
  });
});

describe("translator()", () => {
  it("fills placeholders", () => {
    const t = translator("en");
    expect(t("flagSugar", { n: 21 })).toBe("21 g sugar in this portion.");
  });

  it("returns Greek for Greek", () => {
    expect(translator("el")("exchangesTitle")).toBe("Ισοδύναμα");
  });

  it("falls back to English rather than rendering a bare key", () => {
    expect(translator("zz")("exchangesTitle")).toBe("Exchanges");
  });
});

describe("the Greek interface and the Greek keyword lists agree", () => {
  it("uses ισοδύναμο for an exchange, never a calque", () => {
    const greek = Object.values(STRINGS.el).join(" ");
    expect(greek).toMatch(/ισοδύναμ/);
    expect(greek).not.toMatch(/ανταλλαγ/);
  });

  it("still parses Greek food names whichever interface language is on", () => {
    // The keyword lists are language-independent; the switch changes the
    // interface only. This pins that they are not accidentally coupled.
    expect(KEYWORDS.protein.any).toContain("χαλούμι");
  });
});

describe("classification reasons are sentence fragments", () => {
  // The interface writes "Counted as Starch, because <reason>." and supplies
  // the full stop, so a reason carrying its own produced "..". App.jsx strips a
  // trailing stop defensively; this keeps the dictionary tidy as well.
  it("does not start with a capital or read as a standalone sentence", () => {
    const shouty = [];
    for (const id of LANG_IDS) {
      for (const [k, v] of Object.entries(STRINGS[id])) {
        if (!k.startsWith("r_")) continue;
        if (v[0] !== v[0].toLowerCase()) shouty.push(`${id}: ${k} starts with a capital`);
      }
    }
    expect(shouty).toEqual([]);
  });
});
