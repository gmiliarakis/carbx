import { describe, it, expect } from "vitest";
import { parseNutritionText, firstNum } from "./exchange.js";

const EXPECTED = { cho: 62, pro: 9, fat: 14, fibre: 4, sugars: 3, sfa: 6, salt: 1.4, k: 320, p: 120, kcal: 418 };

function checkAllFields(result) {
  for (const [key, val] of Object.entries(EXPECTED)) expect(result[key]).toBe(val);
}

describe("parseNutritionText() - every numeric field, across all five supported languages", () => {
  it("English label", () => {
    const t = `Nutrition per 100g
Energy 418 kcal
Fat 14 g
of which saturates 6 g
Carbohydrate 62 g
Sugars 3 g
Fibre 4 g
Protein 9 g
Salt 1.4 g
Potassium 320 mg
Phosphorus 120 mg

Ingredients: wheat flour, palm oil, salt.

Allergen advice: contains gluten.`;
    const r = parseNutritionText(t);
    checkAllFields(r);
    expect(r.basis).toBe("100g");
    expect(r.ing).toBe("wheat flour, palm oil, salt.");
  });

  it("Dutch label, with comma decimals for salt", () => {
    const t = `Voedingswaarde per 100 g
Energie 418 kcal
Vetten 14 g
waarvan verzadigd 6 g
Koolhydraten 62 g
waarvan suikers 3 g
Vezels 4 g
Eiwitten 9 g
Zout 1,4 g
Kalium 320 mg
Fosfor 120 mg

Ingrediënten: tarwebloem, palmolie, zout.

Allergie: bevat gluten.`;
    const r = parseNutritionText(t);
    checkAllFields(r);
    expect(r.ing).toBe("tarwebloem, palmolie, zout.");
  });

  it("French label", () => {
    const t = `Valeurs nutritionnelles pour 100 g
Energie 418 kcal
Matières grasses 14 g
dont acides gras saturés 6 g
Glucides 62 g
dont sucres 3 g
Fibres 4 g
Protéines 9 g
Sel 1,4 g
Potassium 320 mg
Phosphore 120 mg

Ingrédients: farine de blé, huile de palme, sel.`;
    const r = parseNutritionText(t);
    checkAllFields(r);
  });

  it("German label", () => {
    const t = `Nährwerte pro 100 g
Energie 418 kcal
Fett 14 g
davon gesättigte Fettsäuren 6 g
Kohlenhydrate 62 g
davon Zucker 3 g
Ballaststoffe 4 g
Eiweiß 9 g
Salz 1,4 g
Kalium 320 mg
Phosphor 120 mg

Zutaten: Weizenmehl, Palmöl, Salz.`;
    const r = parseNutritionText(t);
    checkAllFields(r);
  });

  it("Greek label", () => {
    const t = `Διατροφικές πληροφορίες ανά 100 g
Ενέργεια 418 kcal
Λιπαρά 14 g
εκ των οποίων κορεσμένα 6 g
Υδατάνθρακες 62 g
εκ των οποίων σάκχαρα 3 g
Φυτικές ίνες 4 g
Πρωτεΐνες 9 g
Αλάτι 1,4 g
Κάλιο 320 mg
Φώσφορος 120 mg

Συστατικά: αλεύρι σίτου, φοινικέλαιο, αλάτι.`;
    const r = parseNutritionText(t);
    checkAllFields(r);
  });
});

describe("parseNutritionText() - fixed: American \"fiber\" spelling", () => {
  // BUG (found while writing this suite, fixed in exchange.js): the app's
  // own UI hints point users at USDA FoodData Central as a data source, but
  // FoodData Central labels say "Fiber", not "Fibre" - and the old regex
  // only matched the British spelling, so pasting a US label's fibre line
  // silently came back as null.
  it("parses US-spelled \"Fiber\"", () => {
    expect(parseNutritionText("Dietary Fiber 4g").fibre).toBe(4);
    expect(parseNutritionText("Total Fiber: 4.5 g").fibre).toBe(4.5);
  });
  it("still parses British \"Fibre\"/\"Fibres\" (no regression)", () => {
    expect(parseNutritionText("Fibre 4g").fibre).toBe(4);
    expect(parseNutritionText("Fibres 4g").fibre).toBe(4);
  });
});

describe("parseNutritionText() - basis detection", () => {
  it("detects 100g", () => {
    expect(parseNutritionText("per 100g: Fat 14g").basis).toBe("100g");
  });
  it("detects 100ml, and prioritises it over 100g wording elsewhere in the text", () => {
    expect(parseNutritionText("per 100 ml: Fat 14g").basis).toBe("100ml");
  });
  it("detects a per-serving/portion basis when no 100g/100ml wording is present", () => {
    expect(parseNutritionText("Per serving (30g): Fat 4g").basis).toBe("serving");
    expect(parseNutritionText("Per portion: Fat 4g").basis).toBe("serving");
    expect(parseNutritionText("Per deel: Vet 4g").basis).toBe("serving"); // Dutch
  });
  it("defaults to 100g when nothing matches", () => {
    expect(parseNutritionText("Fat 14g").basis).toBe("100g");
  });
});

describe("parseNutritionText() - ingredients extraction", () => {
  it("stops at the first blank line after the ingredients heading", () => {
    const t = "Ingredients: flour, sugar, salt.\n\nAllergen advice: contains gluten, may contain nuts.";
    expect(parseNutritionText(t).ing).toBe("flour, sugar, salt.");
  });
  it("collapses internal whitespace/newlines within the ingredients block itself", () => {
    const t = "Ingredients: flour,\nsugar,\n  salt.";
    expect(parseNutritionText(t).ing).toBe("flour, sugar, salt.");
  });
  it("truncates to 800 characters", () => {
    const longList = "flour, " + "sugar, ".repeat(200); // well over 800 chars
    const t = `Ingredients: ${longList}`;
    const r = parseNutritionText(t);
    expect(r.ing.length).toBe(800);
  });
  it("returns an empty string when no ingredients heading is found", () => {
    expect(parseNutritionText("Fat 14g Protein 9g").ing).toBe("");
  });
  it("recognises the heading in all five languages", () => {
    expect(parseNutritionText("Ingredients: a, b").ing).toBe("a, b");
    expect(parseNutritionText("Ingrediënten: a, b").ing).toBe("a, b");
    expect(parseNutritionText("Ingrédients: a, b").ing).toBe("a, b");
    expect(parseNutritionText("Zutaten: a, b").ing).toBe("a, b");
    expect(parseNutritionText("Συστατικά: a, b").ing).toBe("a, b");
  });
});

describe("firstNum()", () => {
  it("converts a comma decimal separator to a point", () => {
    expect(firstNum(/(\d+(?:[.,]\d+)?)\s*g/, "62,5 g")).toBeCloseTo(62.5, 10);
  });
  it("handles a plain point decimal", () => {
    expect(firstNum(/(\d+(?:[.,]\d+)?)\s*g/, "62.5 g")).toBeCloseTo(62.5, 10);
  });
  it("handles a whole number with no decimal", () => {
    expect(firstNum(/(\d+(?:[.,]\d+)?)\s*g/, "62 g")).toBe(62);
  });
  it("returns null when the pattern doesn't match at all", () => {
    expect(firstNum(/(\d+(?:[.,]\d+)?)\s*mg/, "62 g")).toBeNull();
  });
});

describe("parseNutritionText() - missing/garbage input", () => {
  it("returns all-null fields for empty input, without throwing", () => {
    const r = parseNutritionText("");
    for (const k of ["cho", "pro", "fat", "fibre", "sugars", "sfa", "salt", "k", "p", "kcal"]) {
      expect(r[k]).toBeNull();
    }
    expect(r.ing).toBe("");
  });
  it("handles null/undefined input without throwing", () => {
    expect(() => parseNutritionText(null)).not.toThrow();
    expect(() => parseNutritionText(undefined)).not.toThrow();
  });
  it("only fills in the fields it actually finds, leaving the rest null", () => {
    const r = parseNutritionText("Fat 14g");
    expect(r.fat).toBe(14);
    expect(r.cho).toBeNull();
    expect(r.pro).toBeNull();
  });
});
