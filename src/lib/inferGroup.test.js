import { describe, it, expect } from "vitest";
import { inferGroup } from "./exchange.js";

/*
 * inferGroup() guesses which exchange group a food belongs to, first from
 * keywords in its name (in English/Dutch/Greek), then falling back to
 * macro percentages. The keyword branches use `String.includes()`, which
 * matches ANYWHERE in the name - including inside unrelated words. This
 * file both documents the intended behaviour and specifically probes for
 * that class of false positive.
 */

describe("inferGroup() - keyword branches, intended matches", () => {
  it("oil/butter names with low carb+protein -> fat-only", () => {
    expect(inferGroup({ cho: 0, pro: 0.5, fat: 100 }, "Extra virgin olive oil")).toBe("fat-only");
    expect(inferGroup({ cho: 0.6, pro: 0.7, fat: 81 }, "Unsalted butter")).toBe("fat-only");
    expect(inferGroup({ cho: 0, pro: 0.2, fat: 99.9 }, "Margarine")).toBe("fat-only");
  });
  it("oil/butter keyword present but carb or protein too high -> falls through, not fat-only", () => {
    // "olie" (Dutch for oil) inside a high-carb name should NOT force fat-only
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

describe("inferGroup() - fruit coverage, fixed: every common fruit, in every supported language, classifies as fruit", () => {
  // BUG (found and fixed): the fruit keyword list used to be five tokens
  // wide (fruit/appel/banana/banaan/φρού/juice/sap) with no fallback to
  // "fruit" anywhere in the percentage-based rules. A plainly-named "apple"
  // or "grapes" landed on veg or starch instead, which changes the exchange
  // math (fruit carries 0 protein/fat per exchange; starch and veg both
  // carry some). Fixed two ways: (1) a much wider multilingual keyword list
  // (English/Dutch/German/French/Greek, matching this file's other language
  // coverage), and (2) a language-agnostic macro heuristic - mostly-sugar
  // carbohydrate, some fibre, negligible protein/fat, plausible per-100g
  // range - that catches a fruit in ANY language the keyword list doesn't
  // cover, by its composition instead of its name.
  const realApple = { cho: 14, pro: 0.3, fat: 0.2, sugars: 10, fibre: 2.4 };
  const realGrapes = { cho: 18, pro: 0.6, fat: 0.2, sugars: 18, fibre: 0.9 };
  const realWatermelon = { cho: 7.6, pro: 0.6, fat: 0.2, sugars: 6.2, fibre: 0.4 };
  const realPlantain = { cho: 32, pro: 1.3, fat: 0.4, sugars: 15, fibre: 2.3 };

  it("apple, pear, grape, orange, melon, mango etc. now match by keyword directly", () => {
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

  it("a fruit named in a language/word NOT in the keyword list still classifies as fruit, via its macros", () => {
    // "Nashi" (Japanese/Asian pear) - deliberately not added to FRUIT_WORDS,
    // standing in for "any language" the keyword list can't enumerate.
    expect(inferGroup({ cho: 11, pro: 0.4, fat: 0.2, sugars: 9, fibre: 3.6 }, "Nashi")).toBe("fruit");
    // same real watermelon/grapes/plantain macros as above, under a made-up name
    expect(inferGroup(realWatermelon, "Xyzzyfruit-9000")).toBe("fruit");
    expect(inferGroup(realGrapes, "Product 42")).toBe("fruit");
    expect(inferGroup(realPlantain, "Item A-19")).toBe("fruit");
  });

  it("the macro heuristic needs sugars/fibre data to fire at all (backward compatible: omitting them just disables it, doesn't crash)", () => {
    expect(() => inferGroup({ cho: 14, pro: 0.3, fat: 0.2 }, "Unnamed produce")).not.toThrow();
    // no sugars/fibre supplied -> heuristic can't evaluate -> falls through
    // to the ordinary percentage rules (cho=14>12 -> starch), same as before
    expect(inferGroup({ cho: 14, pro: 0.3, fat: 0.2 }, "Unnamed produce")).toBe("starch");
  });

  it("does NOT misfire on starchy/protein-bearing foods that happen to have some fibre or sugar", () => {
    // rolled oats: low sugar ratio -> should stay starch, not fruit
    expect(inferGroup({ cho: 12, pro: 2.5, fat: 1.4, sugars: 0.4, fibre: 1.7 }, "Havermout")).not.toBe("fruit");
    // white bread: protein too high to qualify
    expect(inferGroup({ cho: 49, pro: 9, fat: 3.2, sugars: 5, fibre: 2.7 }, "Witbrood")).not.toBe("fruit");
    // cooked white rice: negligible sugar and fibre
    expect(inferGroup({ cho: 28, pro: 2.7, fat: 0.3, sugars: 0.1, fibre: 0.4 }, "Gekookte rijst")).not.toBe("fruit");
  });

  it("does NOT misfire on zero-fibre sugary liquids/spreads (soda, honey) even though they're mostly sugar", () => {
    // cola: all sugar, but zero fibre - the fibre floor keeps it out of "fruit"
    expect(inferGroup({ cho: 10.6, pro: 0, fat: 0, sugars: 10.6, fibre: 0 }, "Cola")).not.toBe("fruit");
    // honey: also excluded on CHO being far outside the fresh-fruit range
    expect(inferGroup({ cho: 82, pro: 0.3, fat: 0, sugars: 82, fibre: 0.2 }, "Honing")).not.toBe("fruit");
  });

  it("does NOT misfire on high-protein or high-fat foods that also contain some natural sugar", () => {
    expect(inferGroup({ cho: 4.8, pro: 3.4, fat: 3.6, sugars: 4.8, fibre: 0 }, "Melk")).not.toBe("fruit"); // pro just above the <3 cap
    expect(inferGroup({ cho: 2, pro: 1, fat: 20, sugars: 2, fibre: 0.5 }, "Unnamed fatty spread")).not.toBe("fruit");
  });
});

describe("inferGroup() - fixed: short keyword fragments no longer match mid-word", () => {
  // BUG (found while writing this suite, fixed in exchange.js): "ei" (Dutch
  // for egg) is only two letters, so a plain substring test matches it
  // inside the English word "protein" - which is extremely common in
  // packaged-food names. That silently forced ANY food named e.g. "High
  // Protein Bar" into the cheese/meat/egg branch before it ever reached the
  // macro-percentage fallback, regardless of what the food actually was.
  it("a fat-dominant food named with \"protein\" is classified by its macros, not forced to protein-only via \"ei\"", () => {
    // cho=3 pro=2 fat=20 -> 90% of kcal from fat, both cho and pro under 5:
    // the percentage fallback's fat-only rule should win.
    const g = inferGroup({ cho: 3, pro: 2, fat: 20 }, "High Protein Fat Bomb");
    expect(g).toBe("fat-only");
  });
  it("a carb-dominant food named with \"protein\" still classifies as starch/veg by its macros", () => {
    const g = inferGroup({ cho: 40, pro: 8, fat: 2 }, "Protein Pancake Mix");
    expect(g).toBe("starch");
  });
  it("\"vis\" (Dutch for fish) no longer matches mid-word inside unrelated names", () => {
    // "Provisions" contains "vis" mid-word; a fat-dominant food named this
    // way should not be forced into protein-only either.
    const g = inferGroup({ cho: 2, pro: 2, fat: 20 }, "Camping Provisions Fat Bomb");
    expect(g).toBe("fat-only");
  });
  it("legitimate word-start uses of \"ei\" and \"vis\" still match", () => {
    expect(inferGroup({ cho: 0.5, pro: 12.5, fat: 10 }, "Gekookt ei")).toBe("protein-only"); // Dutch: boiled egg
    expect(inferGroup({ cho: 1, pro: 13, fat: 1 }, "Eiersalade")).toBe("protein-only"); // Dutch: egg salad
    expect(inferGroup({ cho: 0, pro: 20, fat: 2 }, "Visfilet")).toBe("protein-only"); // Dutch: fish fillet
  });
});

describe("inferGroup() - percentage-based fallback (no keyword match)", () => {
  it("fat% > 70 with low carb and protein -> fat-only", () => {
    expect(inferGroup({ cho: 1, pro: 1, fat: 20 }, "Mystery Spread")).toBe("fat-only");
  });
  it("protein% > 40 with cho < 5 -> protein-only", () => {
    // chicken breast, no matching keyword in the name at all
    expect(inferGroup({ cho: 0, pro: 31, fat: 3.6 }, "Chicken Breast XL")).toBe("protein-only");
  });
  it("carb% > 45 and cho > 12 -> starch", () => {
    expect(inferGroup({ cho: 28, pro: 2.7, fat: 0.3 }, "Cooked white rice")).toBe("starch");
  });
  it("carb% > 45 and cho <= 12 -> non-starchy veg", () => {
    expect(inferGroup({ cho: 7, pro: 3, fat: 0.5 }, "Steamed broccoli")).toBe("veg");
  });
  it("boundary: cho exactly 12 with carb% > 45 -> veg (not > 12)", () => {
    expect(inferGroup({ cho: 12, pro: 1, fat: 0.2 }, "Root vegetable mash")).toBe("veg");
  });
  it("boundary: cho just above 12 with carb% > 45 -> starch", () => {
    expect(inferGroup({ cho: 12.1, pro: 1, fat: 0.2 }, "Root vegetable mash")).toBe("starch");
  });
  it("last-resort: cho < 2 and pro > 5 with no other branch matching -> protein-only", () => {
    // fat-dominant enough to dodge the fat-only rule (needs pro<5) and the
    // earlier protein-percent rule (needs cho<5, true here, but proPct must
    // ALSO be <=0.4, so we keep fat heavy to keep proPct down)
    const g = inferGroup({ cho: 1, pro: 5.5, fat: 15 }, "Odd Snack");
    expect(g).toBe("protein-only");
  });
  it("true default: nothing matches any rule -> starch", () => {
    const g = inferGroup({ cho: 3, pro: 3, fat: 3 }, "Balanced Mystery Food");
    expect(g).toBe("starch");
  });
});
