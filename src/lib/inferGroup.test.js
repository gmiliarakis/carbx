import { describe, it, expect } from "vitest";
import { inferGroup } from "./exchange.js";

// inferGroup() picks an exchange group from keywords in the food's name
// first, then falls back to macro percentages. Most keyword branches use
// String.includes(), which matches anywhere in the name, including inside
// unrelated words, so this file covers both the intended matches and that
// class of false positive.

describe("inferGroup(): keyword branches, intended matches", () => {
  it("oil/butter names with low carb+protein -> fat-only", () => {
    expect(inferGroup({ cho: 0, pro: 0.5, fat: 100 }, "Extra virgin olive oil")).toBe("fat-only");
    expect(inferGroup({ cho: 0.6, pro: 0.7, fat: 81 }, "Unsalted butter")).toBe("fat-only");
    expect(inferGroup({ cho: 0, pro: 0.2, fat: 99.9 }, "Margarine")).toBe("fat-only");
  });
  it("oil/butter keyword present but carb or protein too high -> falls through, not fat-only", () => {
    // "olie" (Dutch for oil) inside a high-carb name should not force fat-only
    expect(inferGroup({ cho: 70, pro: 8, fat: 5 }, "Frituurolie-gebakken chips")).not.toBe("fat-only");
  });
  it("milk/yoghurt/kefir names with cho>2 and pro>2 -> milk", () => {
    expect(inferGroup({ cho: 4.8, pro: 3.4, fat: 3.6 }, "Whole milk")).toBe("milk");
    expect(inferGroup({ cho: 6.5, pro: 4.2, fat: 1.6 }, "Test: semi-skimmed yoghurt")).toBe("milk");
    expect(inferGroup({ cho: 4, pro: 3.3, fat: 3.5 }, "Kefir")).toBe("milk");
    expect(inferGroup({ cho: 4.7, pro: 3.4, fat: 3.6 }, "Πλήρες γάλα")).toBe("milk");
  });
  it("milk keyword present but pro<=2 (e.g. a plant \"milk\") does not force milk", () => {
    // unsweetened almond milk: real-world macros are near-zero carb/protein
    expect(inferGroup({ cho: 0.3, pro: 0.4, fat: 1.1 }, "Unsweetened almond milk")).not.toBe("milk");
  });
  it("cheese/meat/fish/egg/tofu/nut names -> protein-only when low carb, starch when not", () => {
    expect(inferGroup({ cho: 1.3, pro: 25, fat: 27 }, "Aged cheddar cheese")).toBe("protein-only");
    expect(inferGroup({ cho: 1.2, pro: 19, fat: 9 }, "Test: sliced ham")).toBe("protein-only");
    expect(inferGroup({ cho: 0, pro: 22, fat: 12 }, "Grilled salmon fish fillet")).toBe("protein-only");
    expect(inferGroup({ cho: 1.1, pro: 12.5, fat: 10 }, "Boiled egg")).toBe("protein-only");
    expect(inferGroup({ cho: 1.9, pro: 8, fat: 4.8 }, "Firm tofu")).toBe("protein-only");
    expect(inferGroup({ cho: 62, pro: 9, fat: 14 }, "Cheese crackers")).toBe("starch"); // cho>=5, so "starch" branch of the same rule
  });
  it("fruit/juice names -> fruit", () => {
    expect(inferGroup({ cho: 23, pro: 1.1, fat: 0.3 }, "Ripe banana")).toBe("fruit");
    expect(inferGroup({ cho: 10, pro: 0.5, fat: 0 }, "Orange juice")).toBe("fruit"); // matches "juice"
    expect(inferGroup({ cho: 11, pro: 0.4, fat: 0.1 }, "Appelsap")).toBe("fruit"); // Dutch: apple juice, matches "sap"
    expect(inferGroup({ cho: 15, pro: 0.7, fat: 0.3 }, "Φρούτο ροδάκινο")).toBe("fruit"); // Greek: "fruit" stem
  });
});

describe("inferGroup(): fruit coverage in every supported language", () => {
  // Getting fruit wrong changes the exchange math, since a fruit exchange
  // carries no protein or fat while starch and veg both do. Two things keep
  // it right: a wide keyword list in the five supported languages, and a
  // composition check for names no list can enumerate.
  const realApple = { cho: 14, pro: 0.3, fat: 0.2, sugars: 10, fibre: 2.4 };
  const realGrapes = { cho: 18, pro: 0.6, fat: 0.2, sugars: 18, fibre: 0.9 };
  const realWatermelon = { cho: 7.6, pro: 0.6, fat: 0.2, sugars: 6.2, fibre: 0.4 };
  const realPlantain = { cho: 32, pro: 1.3, fat: 0.4, sugars: 15, fibre: 2.3 };

  it("apple, pear, grape, orange, melon and mango match by keyword", () => {
    expect(inferGroup(realApple, "Fresh apple")).toBe("fruit");
    expect(inferGroup(realGrapes, "Grapes")).toBe("fruit");
    expect(inferGroup({ cho: 12, pro: 0.9, fat: 0.1 }, "Ripe pear")).toBe("fruit");
    expect(inferGroup({ cho: 12, pro: 0.9, fat: 0.1 }, "Sinaasappel")).toBe("fruit"); // Dutch: orange
    expect(inferGroup({ cho: 12, pro: 0.9, fat: 0.1 }, "Orange")).toBe("fruit");
    expect(inferGroup(realWatermelon, "Wassermelone")).toBe("fruit"); // German: watermelon
    expect(inferGroup({ cho: 15, pro: 0.8, fat: 0.4 }, "Pêche")).toBe("fruit"); // French: peach
    expect(inferGroup({ cho: 17, pro: 0.8, fat: 0.6 }, "Μάνγκο")).toBe("fruit"); // Greek: mango
    expect(inferGroup({ cho: 66, pro: 3.1, fat: 0.5 }, "Dadels")).toBe("fruit"); // Dutch: dates (dried, high CHO but keyword-matched)
  });

  it("a fruit named outside the keyword list still classifies as fruit by its macros", () => {
    // "Nashi" (Asian pear) is deliberately left out of FRUIT_WORDS, standing
    // in for the languages the keyword list cannot enumerate.
    expect(inferGroup({ cho: 11, pro: 0.4, fat: 0.2, sugars: 9, fibre: 3.6 }, "Nashi")).toBe("fruit");
    // same real watermelon/grapes/plantain macros as above, under a made-up name
    expect(inferGroup(realWatermelon, "Xyzzyfruit-9000")).toBe("fruit");
    expect(inferGroup(realGrapes, "Product 42")).toBe("fruit");
    expect(inferGroup(realPlantain, "Item A-19")).toBe("fruit");
  });

  it("the composition check needs sugars and fibre, and omitting them is harmless", () => {
    expect(() => inferGroup({ cho: 14, pro: 0.3, fat: 0.2 }, "Unnamed produce")).not.toThrow();
    // With no sugars or fibre the check cannot evaluate, so it falls through
    // to the percentage rules (cho=14 > 12, so starch).
    expect(inferGroup({ cho: 14, pro: 0.3, fat: 0.2 }, "Unnamed produce")).toBe("starch");
  });

  it("does not misfire on starchy or protein-bearing foods with some fibre or sugar", () => {
    // rolled oats: low sugar ratio, so it should stay starch
    expect(inferGroup({ cho: 12, pro: 2.5, fat: 1.4, sugars: 0.4, fibre: 1.7 }, "Havermout")).not.toBe("fruit");
    // white bread: protein too high to qualify
    expect(inferGroup({ cho: 49, pro: 9, fat: 3.2, sugars: 5, fibre: 2.7 }, "Witbrood")).not.toBe("fruit");
    // cooked white rice: negligible sugar and fibre
    expect(inferGroup({ cho: 28, pro: 2.7, fat: 0.3, sugars: 0.1, fibre: 0.4 }, "Gekookte rijst")).not.toBe("fruit");
  });

  it("does not misfire on zero-fibre sugary drinks and spreads", () => {
    // cola: all sugar and no fibre, which the fibre floor rejects
    expect(inferGroup({ cho: 10.6, pro: 0, fat: 0, sugars: 10.6, fibre: 0 }, "Cola")).not.toBe("fruit");
    // honey: also excluded on CHO being far outside the fresh-fruit range
    expect(inferGroup({ cho: 82, pro: 0.3, fat: 0, sugars: 82, fibre: 0.2 }, "Honing")).not.toBe("fruit");
  });

  it("does not misfire on high-protein or high-fat foods containing natural sugar", () => {
    expect(inferGroup({ cho: 4.8, pro: 3.4, fat: 3.6, sugars: 4.8, fibre: 0 }, "Melk")).not.toBe("fruit"); // pro just above the <3 cap
    expect(inferGroup({ cho: 2, pro: 1, fat: 20, sugars: 2, fibre: 0.5 }, "Unnamed fatty spread")).not.toBe("fruit");
  });
});

describe("inferGroup(): short keyword fragments do not match mid-word", () => {
  // "ei" (Dutch for egg) is two letters, so a plain substring test finds it
  // inside "protein", a very common word on packaged food. That would send
  // anything called "High Protein Bar" into the cheese/meat/egg branch
  // before the macro fallback ever ran.
  it("a fat-dominant food named with \"protein\" is classified by its macros, not forced to protein-only via \"ei\"", () => {
    // cho=3 pro=2 fat=20, so 90% of kcal from fat with cho and pro both
    // under 5, and the fat-only rule in the percentage fallback should win.
    const g = inferGroup({ cho: 3, pro: 2, fat: 20 }, "High Protein Fat Bomb");
    expect(g).toBe("fat-only");
  });
  it("a carb-dominant food named with \"protein\" still classifies as starch/veg by its macros", () => {
    const g = inferGroup({ cho: 40, pro: 8, fat: 2 }, "Protein Pancake Mix");
    expect(g).toBe("starch");
  });
  it("\"vis\" (Dutch for fish) no longer matches mid-word inside unrelated names", () => {
    // "Provisions" contains "vis" mid-word, and a fat-dominant food named
    // that way should not be forced into protein-only either.
    const g = inferGroup({ cho: 2, pro: 2, fat: 20 }, "Camping Provisions Fat Bomb");
    expect(g).toBe("fat-only");
  });
  it("legitimate word-start uses of \"ei\" and \"vis\" still match", () => {
    expect(inferGroup({ cho: 0.5, pro: 12.5, fat: 10 }, "Gekookt ei")).toBe("protein-only"); // Dutch: boiled egg
    expect(inferGroup({ cho: 1, pro: 13, fat: 1 }, "Eiersalade")).toBe("protein-only"); // Dutch: egg salad
    expect(inferGroup({ cho: 0, pro: 20, fat: 2 }, "Visfilet")).toBe("protein-only"); // Dutch: fish fillet
  });
});

describe("inferGroup(): composition fallback, no useful name", () => {
  // The carbohydrate groups are told apart the way their definitions differ:
  // how much protein rides with the carbohydrate, and how much carbohydrate
  // there is at all. Starch 15 g CHO to 3 g protein, fruit 15 g to 0, milk 12 g
  // to 8 g, nonstarchy veg 5 g to 2 g.
  it("barely any carbohydrate, mostly fat -> fat-only", () => {
    expect(inferGroup({ cho: 1, pro: 1, fat: 20 }, "Mystery Spread")).toBe("fat-only");
  });
  it("barely any carbohydrate, mostly protein -> protein-only", () => {
    expect(inferGroup({ cho: 0, pro: 31, fat: 3.6 }, "Chicken Breast XL")).toBe("protein-only");
  });
  it("plenty of carbohydrate, little sugar -> starch", () => {
    expect(inferGroup({ cho: 28, pro: 2.7, fat: 0.3, sugars: 0.1, fibre: 0.4 }, "Cooked white rice")).toBe("starch");
  });

  it("little carbohydrate with protein alongside it -> nonstarchy veg", () => {
    expect(inferGroup({ cho: 7, pro: 3, fat: 0.5, sugars: 1.7, fibre: 2.6 }, "Steamed greens")).toBe("veg");
    // a watery vegetable whose carbohydrate is proportionally sugary is still a
    // vegetable, because it carries a vegetable's protein
    expect(inferGroup({ cho: 3.1, pro: 1.2, fat: 0.3, sugars: 2.5, fibre: 1 }, "Courgette")).toBe("veg");
  });
  it("the same carbohydrate with no protein is not a vegetable", () => {
    // sugar water and a vegetable can carry the same carbohydrate; the protein
    // is what tells them apart, so a sugary drink must not land on veg
    expect(inferGroup({ cho: 7, pro: 0, fat: 0, sugars: 7, fibre: 0 }, "Unnamed drink")).not.toBe("veg");
    expect(inferGroup({ cho: 10.6, pro: 0, fat: 0, sugars: 10.6, fibre: 0 }, "Unnamed drink")).not.toBe("veg");
  });
  it("a starchy vegetable belongs on the starch list, not with nonstarchy veg", () => {
    // 12 g of carbohydrate per 100 g is a potato or a parsnip, which the list
    // counts as starch. Nonstarchy veg is around 5 g.
    expect(inferGroup({ cho: 12, pro: 1, fat: 0.2, sugars: 1, fibre: 2 }, "Boiled parsnip mash")).toBe("starch");
    expect(inferGroup({ cho: 17, pro: 2, fat: 0.1, sugars: 0.8, fibre: 2.2 }, "Unnamed mash")).toBe("starch");
  });

  it("lactose-like carbohydrate with dairy protein -> milk", () => {
    expect(inferGroup({ cho: 4.7, pro: 3.4, fat: 3.6, sugars: 4.7, fibre: 0 }, "Unnamed white drink")).toBe("milk");
  });
  it("fruit needs near-zero protein, so a sugary food with starch protein is starch", () => {
    expect(inferGroup({ cho: 20, pro: 4, fat: 1, sugars: 12, fibre: 1.5 }, "Unnamed food")).toBe("starch");
  });
  it("mostly sugar with fibre and no protein -> fruit", () => {
    expect(inferGroup({ cho: 14, pro: 0.3, fat: 0.2, sugars: 10, fibre: 2.4 }, "Unnamed food")).toBe("fruit");
  });

  it("last resort: almost no carbohydrate and real protein -> protein-only", () => {
    expect(inferGroup({ cho: 1, pro: 5.5, fat: 15 }, "Odd Snack")).toBe("protein-only");
  });
  it("nothing matches -> starch", () => {
    expect(inferGroup({ cho: 3, pro: 3, fat: 3 }, "Balanced Mystery Food")).toBe("starch");
  });
});

describe("inferGroup(): a dairy word used as a modifier is not dairy", () => {
  it("milk chocolate is not a milk exchange", () => {
    // 7.6 g of protein against 59 g of carbohydrate is nothing like the 8 to 12
    // a milk exchange carries, so the word is a modifier, not the food
    expect(inferGroup({ cho: 59, pro: 7.6, fat: 30, sugars: 52, fibre: 3.4 }, "Milk chocolate")).toBe("starch");
  });
  it("real dairy still matches on the same keyword", () => {
    expect(inferGroup({ cho: 4.7, pro: 3.4, fat: 3.6, sugars: 4.7 }, "Whole milk")).toBe("milk");
    expect(inferGroup({ cho: 6.5, pro: 4.2, fat: 1.6, sugars: 6.5 }, "Semi-skimmed yoghurt")).toBe("milk");
  });
});

describe("inferGroup(): German names reach the same branches as English and Dutch", () => {
  // German builds compound nouns, so the keyword lists need the German stems
  // as well: without them these foods fell through to the composition rules
  // and sometimes landed on a different group than their English equivalent.
  it("Milch and Joghurt names -> milk", () => {
    expect(inferGroup({ cho: 4.8, pro: 3.4, fat: 3.5, sugars: 4.8, fibre: 0 }, "Vollmilch")).toBe("milk");
    expect(inferGroup({ cho: 4.7, pro: 3.9, fat: 3.5, sugars: 4.7, fibre: 0 }, "Naturjoghurt")).toBe("milk");
    // the composition rules alone read this one as starch, the keyword fixes it
    expect(inferGroup({ cho: 13, pro: 3.2, fat: 2.8, sugars: 13, fibre: 0 }, "Fruchtjoghurt")).toBe("milk");
    expect(inferGroup({ cho: 10.5, pro: 3.2, fat: 1.5, sugars: 10.5, fibre: 0.4 }, "Schokoladenmilch")).toBe("milk");
  });
  it("Käse, Fleisch, Fisch and Schinken names -> protein-only when low carb", () => {
    expect(inferGroup({ cho: 0.1, pro: 25, fat: 31 }, "Gouda Käse")).toBe("protein-only");
    // Frischkäse is cream cheese, which the US list counts as a fat, not a
    // protein, and the fat list carries it in every language.
    expect(inferGroup({ cho: 3.5, pro: 6, fat: 24, sugars: 3.5 }, "Frischkäse")).toBe("fat-only");
    expect(inferGroup({ cho: 0, pro: 23, fat: 2 }, "Hähnchenfleisch")).toBe("protein-only");
    expect(inferGroup({ cho: 0, pro: 20, fat: 13 }, "Lachsfisch")).toBe("protein-only");
    expect(inferGroup({ cho: 1, pro: 19, fat: 9 }, "Schinken")).toBe("protein-only");
  });
  it("Nuss names -> fat, following the US and EDE lists", () => {
    // Nuts carry real protein, so the fat branch is gated on fat dominating
    // the energy rather than on protein being absent.
    expect(inferGroup({ cho: 4, pro: 21, fat: 49 }, "Erdnüsse")).toBe("fat-only");
    expect(inferGroup({ cho: 22, pro: 21, fat: 49, fibre: 12 }, "Mandeln")).toBe("fat-only");
    expect(inferGroup({ cho: 20, pro: 25, fat: 50 }, "Peanut butter")).toBe("fat-only");
    expect(inferGroup({ cho: 6, pro: 18, fat: 54, fibre: 9 }, "Ταχίνι")).toBe("fat-only");
    // but a nut word on a carbohydrate food is a flavour, not the food
    expect(inferGroup({ cho: 60, pro: 7, fat: 18, sugars: 30 }, "Hazelnut wafer")).not.toBe("fat-only");
  });
  it("Öl at a word end -> fat-only, but not inside a longer word", () => {
    expect(inferGroup({ cho: 0, pro: 0, fat: 100 }, "Olivenöl")).toBe("fat-only");
    expect(inferGroup({ cho: 0.5, pro: 0.2, fat: 60 }, "Sonnenblumenöl-Aufstrich")).toBe("fat-only");
    // "öl" inside "Röllchen" must not reach the fat branch: on these macros the
    // composition rules put the food somewhere else entirely
    expect(inferGroup({ cho: 1, pro: 1, fat: 1 }, "Röllchen")).not.toBe("fat-only");
  });
  it("Ei matches egg, but not the German or Dutch word for protein", () => {
    expect(inferGroup({ cho: 1.1, pro: 12.6, fat: 9.5 }, "Gekochtes Ei")).toBe("protein-only");
    expect(inferGroup({ cho: 0.7, pro: 11, fat: 8, sugars: 0.7 }, "Eiersalat")).toBe("protein-only");
    // German "Eiweiß" and Dutch "eiwit" both mean protein and both start with
    // the egg stem. A protein-rich vegetable soup is a vegetable, and reading
    // the word as egg would force it to protein-only on its low carbohydrate.
    const soup = { cho: 4, pro: 2, fat: 0.5, sugars: 2, fibre: 1.2 };
    expect(inferGroup(soup, "Eiweißreiche Gemüsesuppe")).toBe("veg");
    expect(inferGroup(soup, "Eiwitrijke groentesoep")).toBe("veg");
  });
});

describe("inferGroup(): product names from the national exchange tables", () => {
  // Names taken from NEVO 2025, the two German Austauschtabellen and Ciqual.
  // Each of these was a real misclassification at some point while the keyword
  // lists were being filled in, mostly through one word hiding inside another.
  const CASES = [
    // Dutch
    ["Kipfilet gegrild", { cho: 0, pro: 23, fat: 2 }, "protein-only"],
    ["Rundergehakt", { cho: 0, pro: 19, fat: 15 }, "protein-only"],
    // "boter" inside "boterhamworst" and "spek" inside "speklap" both used to
    // reach the fat branch, which a fat-dominant sausage then passed
    ["Boterhamworst", { cho: 2, pro: 12, fat: 25 }, "protein-only"],
    ["Speklap", { cho: 0, pro: 15, fat: 30 }, "protein-only"],
    ["Roomboter", { cho: 0.6, pro: 0.7, fat: 82 }, "fat-only"],
    ["Ontbijtspek", { cho: 0, pro: 14, fat: 38 }, "fat-only"],
    ["Oliebol", { cho: 35, pro: 5, fat: 15 }, "starch"],
    ["Krentenbol", { cho: 50, pro: 8, fat: 4 }, "starch"],
    ["Sperziebonen", { cho: 4, pro: 2, fat: 0.2 }, "veg"],
    ["Doperwten", { cho: 11, pro: 6, fat: 0.5, fibre: 5 }, "starch"],
    ["Vanillevla", { cho: 16, pro: 3.3, fat: 2.5, sugars: 14 }, "milk"],
    ["Vlaai met kersen", { cho: 40, pro: 5, fat: 10, sugars: 20 }, "starch"],
    // German
    ["Kasseler Rippchen", { cho: 0, pro: 22, fat: 8 }, "protein-only"],
    ["Leinsamenbrot", { cho: 38, pro: 9, fat: 6 }, "starch"],
    ["Fruchtjoghurt", { cho: 13, pro: 3.2, fat: 2.8, sugars: 13 }, "milk"],
    ["Kartoffelknödel", { cho: 30, pro: 3, fat: 0.5 }, "starch"],
    ["Schlagsahne", { cho: 3, pro: 2, fat: 31 }, "fat-only"],
    // French
    ["Blanc de poulet", { cho: 0.5, pro: 22, fat: 1.5 }, "protein-only"],
    ["Steak haché", { cho: 0, pro: 20, fat: 15 }, "protein-only"],
    ["Pain de mie", { cho: 49, pro: 8, fat: 4 }, "starch"],
    ["Crème fraîche", { cho: 3, pro: 2, fat: 30 }, "fat-only"],
    ["Haricots verts", { cho: 4, pro: 2, fat: 0.2 }, "veg"],
    ["Petits pois", { cho: 11, pro: 6, fat: 0.5 }, "starch"],
    ["Roquefort", { cho: 2, pro: 19, fat: 31 }, "protein-only"],
    ["Pommes noisette", { cho: 25, pro: 3, fat: 10 }, "starch"],
    // "pignon" hides inside "champignon", and a mushroom passes the low-carb
    // half of the fat gate, so the pine nut is spelled out in full
    ["Champignons", { cho: 1.5, pro: 2.5, fat: 0.3 }, "veg"],
    ["Champignon de Paris", { cho: 1.5, pro: 2.5, fat: 0.3 }, "veg"],
    ["Pignons de pin", { cho: 4, pro: 14, fat: 68 }, "fat-only"],
    // English
    ["Butter beans", { cho: 20, pro: 7, fat: 0.5, fibre: 5 }, "starch"],
    ["Smoked kipper", { cho: 0, pro: 19, fat: 12 }, "protein-only"],
  ];
  for (const [name, macros, expected] of CASES) {
    it(`${name} -> ${expected}`, () => {
      expect(inferGroup(macros, name)).toBe(expected);
    });
  }
});
