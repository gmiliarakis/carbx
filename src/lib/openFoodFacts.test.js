import { describe, it, expect } from "vitest";
import { fromOpenFoodFacts, OFF_MINERAL_MG, SODIUM_TO_SALT } from "./exchange.js";

// Open Food Facts gives every _100g nutriment in grams. The form wants
// potassium and phosphorus in mg, so the mapping has to scale exactly those
// two. Reading them as mg was a real bug: a banana came out at 0.4 mg of
// potassium instead of 358, which on a renal diet is the difference between
// "free food" and a third of a day's allowance.
const banana = {
  product_name: "Banana",
  nutriments: {
    carbohydrates_100g: 22.8, proteins_100g: 1.09, fat_100g: 0.33,
    fiber_100g: 2.6, sugars_100g: 12.2, "saturated-fat_100g": 0.11,
    salt_100g: 0.0025, potassium_100g: 0.358, phosphorus_100g: 0.022,
    "energy-kcal_100g": 89,
  },
};

describe("fromOpenFoodFacts", () => {
  it("converts potassium from grams to milligrams", () => {
    expect(fromOpenFoodFacts(banana).k).toBe("358");
  });

  it("converts phosphorus from grams to milligrams", () => {
    expect(fromOpenFoodFacts(banana).p).toBe("22");
  });

  it("leaves salt in grams, which is what the form asks for", () => {
    expect(fromOpenFoodFacts(banana).salt).toBe("0.0025");
  });

  it("passes the macros through untouched", () => {
    const r = fromOpenFoodFacts(banana);
    expect([r.cho, r.pro, r.fat, r.fibre, r.sugars, r.sfa, r.kcal])
      .toEqual(["22.8", "1.09", "0.33", "2.6", "12.2", "0.11", "89"]);
  });

  it("derives salt from sodium at the EU factor when salt is absent", () => {
    const r = fromOpenFoodFacts({ nutriments: { sodium_100g: 0.4 } });
    expect(r.salt).toBe(String(0.4 * SODIUM_TO_SALT));
  });

  it("prefers a declared salt over deriving one from sodium", () => {
    const r = fromOpenFoodFacts({ nutriments: { salt_100g: 1.2, sodium_100g: 0.9 } });
    expect(r.salt).toBe("1.2");
  });

  it("leaves a missing mineral blank rather than zero", () => {
    const r = fromOpenFoodFacts({ nutriments: { carbohydrates_100g: 10 } });
    expect(r.k).toBe("");
    expect(r.p).toBe("");
    expect(r.salt).toBe("");
  });

  it("treats an explicit zero as a stated zero", () => {
    expect(fromOpenFoodFacts({ nutriments: { potassium_100g: 0 } }).k).toBe("0");
  });

  it("falls back to the barcode when the product has no name", () => {
    expect(fromOpenFoodFacts({ code: "5000112637922" }).name).toBe("5000112637922");
  });

  it("survives a product with no nutriments at all", () => {
    expect(() => fromOpenFoodFacts({})).not.toThrow();
    expect(() => fromOpenFoodFacts(null)).not.toThrow();
  });

  it("uses a factor of 1000 g to mg", () => {
    expect(OFF_MINERAL_MG).toBe(1000);
  });
});
