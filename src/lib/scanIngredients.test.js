import { describe, it, expect } from "vitest";
import { scanIngredients } from "./exchange.js";

function idsOf(result) {
  return result.map((s) => s.id).sort();
}
function hitsFor(result, id) {
  return result.find((s) => s.id === id)?.hits ?? [];
}

describe("scanIngredients() - phosphate additives", () => {
  it("matches E-numbers from the phosphate list", () => {
    expect(hitsFor(scanIngredients("stabiliser E450"), "phos")).toContain("E450");
    expect(hitsFor(scanIngredients("E452"), "phos")).toContain("E452");
    expect(hitsFor(scanIngredients("raising agent E341"), "phos")).toContain("E341");
  });
  it("matches E-numbers written with a space or a dash", () => {
    expect(hitsFor(scanIngredients("E 452"), "phos")).toContain("E452");
    expect(hitsFor(scanIngredients("E-452"), "phos")).toContain("E452");
  });
  it("matches by name in English, Dutch and Greek", () => {
    expect(hitsFor(scanIngredients("phosphoric acid"), "phos").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("fosfaten"), "phos").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("φωσφορικό οξύ"), "phos").length).toBeGreaterThan(0);
  });
  it("is case-insensitive", () => {
    expect(hitsFor(scanIngredients("PHOSPHORIC ACID"), "phos").length).toBeGreaterThan(0);
  });
});

describe("scanIngredients() - potassium additives", () => {
  it("matches E-numbers from the potassium list", () => {
    expect(hitsFor(scanIngredients("E508"), "pot")).toContain("E508");
  });
  it("matches potassium chloride/lactate/citrate/carbonate by name", () => {
    expect(hitsFor(scanIngredients("potassium chloride"), "pot")).toContain("potassium chloride");
    expect(hitsFor(scanIngredients("potassium citrate"), "pot").length).toBeGreaterThan(0);
  });
  it("matches Dutch and Greek names", () => {
    expect(hitsFor(scanIngredients("kaliumchloride"), "pot").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("χλωριούχο κάλιο"), "pot").length).toBeGreaterThan(0);
  });
  it('matches "salt substitute" / "zoutvervanger" as a proxy for potassium chloride', () => {
    expect(hitsFor(scanIngredients("salt substitute"), "pot").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("zoutvervanger"), "pot").length).toBeGreaterThan(0);
  });
});

describe("scanIngredients() - added sugar sources (no E-numbers in this category)", () => {
  it("matches common syrup/sweetener names", () => {
    expect(hitsFor(scanIngredients("glucose-fructose syrup"), "sug").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("corn syrup"), "sug").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("maltodextrin"), "sug").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("dextrose"), "sug").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("molasses"), "sug").length).toBeGreaterThan(0);
  });
  it("matches honey in English, Dutch and Greek", () => {
    expect(hitsFor(scanIngredients("honey"), "sug").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("honing"), "sug").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("μέλι"), "sug").length).toBeGreaterThan(0);
  });
  it("does not flag a plain E-number here (this category has none)", () => {
    // E100 isn't in any list, but confirms the "sug" scanner has no e-regex to match against at all
    const s = scanIngredients("E100");
    expect(s.find((x) => x.id === "sug")).toBeUndefined();
  });
});

describe("scanIngredients() - sodium-bearing additives", () => {
  it("matches E-numbers from the sodium list", () => {
    expect(hitsFor(scanIngredients("E250"), "na")).toContain("E250");
    expect(hitsFor(scanIngredients("E621"), "na")).toContain("E621");
  });
  it("matches monosodium glutamate and sodium nitrite/nitrate/benzoate/bicarbonate by name", () => {
    expect(hitsFor(scanIngredients("monosodium glutamate"), "na").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("sodium nitrite"), "na").length).toBeGreaterThan(0);
  });
  it("matches Dutch names", () => {
    expect(hitsFor(scanIngredients("natriumnitriet"), "na").length).toBeGreaterThan(0);
    expect(hitsFor(scanIngredients("natriumbicarbonaat"), "na").length).toBeGreaterThan(0);
  });
});

describe("scanIngredients() - E-number boundary safety", () => {
  it("does not match a listed number embedded inside a longer, unlisted number", () => {
    // "E4500" is not E450 - the \b after the digit group must reject this
    expect(scanIngredients("E4500 preservative")).toEqual([]);
  });
  it("does not match a bare number with no E prefix", () => {
    expect(scanIngredients("621 on its own, no E")).toEqual([]);
  });
});

describe("scanIngredients() - multi-category input, dedup, and the app's own fixtures", () => {
  it("flags multiple categories in one ingredients list, each with its own hits", () => {
    const s = scanIngredients("pork, water, salt, stabilisers (E451, E452), potassium chloride, sodium nitrite (E250)");
    expect(idsOf(s)).toEqual(["na", "phos", "pot"]);
    expect(hitsFor(s, "phos").sort()).toEqual(["E451", "E452"]);
    expect(hitsFor(s, "pot")).toContain("potassium chloride");
    expect(hitsFor(s, "na").sort()).toEqual(["E250", "sodium nitrite"]);
  });
  it("deduplicates a hit that appears more than once", () => {
    const s = scanIngredients("E250, sodium nitrite (E250), more sodium nitrite");
    const hits = hitsFor(s, "na");
    expect(hits.filter((h) => h === "E250")).toHaveLength(1);
    expect(hits.filter((h) => h === "sodium nitrite")).toHaveLength(1);
  });
  it("matches the crackers fixture (phosphate additives only)", () => {
    const s = scanIngredients("wheat flour, palm oil, salt, raising agent (E450, E500), sugar");
    // E500 is sodium bicarbonate -> "na" category too
    expect(idsOf(s)).toEqual(["na", "phos"]);
  });
});

describe("scanIngredients() - empty/short input", () => {
  it("returns [] for an empty string", () => {
    expect(scanIngredients("")).toEqual([]);
  });
  it("returns [] for null/undefined", () => {
    expect(scanIngredients(null)).toEqual([]);
    expect(scanIngredients(undefined)).toEqual([]);
  });
  it("returns [] for text under 3 characters after trimming", () => {
    expect(scanIngredients("  E ")).toEqual([]);
  });
  it("returns [] when nothing in the text matches any category", () => {
    expect(scanIngredients("water, salt, black pepper")).toEqual([]);
  });
});
