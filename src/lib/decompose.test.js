import { describe, it, expect } from "vitest";
import { decompose, gramsPerExchange, groups, TIERS, MILK_TIERS, half } from "./exchange.js";

// decompose() draws a food's macros down to whole exchanges: carbohydrate
// against the chosen group first, then residual protein at 7 g per exchange
// (fat tier set by fat per exchange), then residual fat at 5 g per exchange.
// The expected numbers below are worked out by hand from those rules rather
// than read off the implementation.

describe("decompose(): the app's own built-in test foods", () => {
  it("crackers: starch group draws all CHO, leftover fat becomes a Fat exchange", () => {
    // cho=62 pro=9 fat=14, unit=15, group=starch, fibre=4 (below the >5 netting threshold)
    const d = decompose({ cho: 62, pro: 9, fat: 14, fibre: 4 }, 15, "starch");
    // 62/15 = 4.1333 starch exchanges, which draws off all 62 g of CHO.
    // Protein is capped at what is there (9 < 4.1333*3 = 12.4), so all 9 g of
    // protein and 4.1333 g of fat net off against the starch exchange and
    // 9.8667 g of fat is left to become its own exchange.
    expect(d.rounded).toHaveLength(2);
    const starch = d.rounded.find((o) => o.label === "Starch");
    const fat = d.rounded.find((o) => o.label === "Fat");
    expect(starch.ex).toBeCloseTo(4, 10); // half(4.1333) = 4
    expect(fat.ex).toBeCloseTo(2, 10); // half(9.8667/5) = half(1.9733) = 2
    expect(d.rc).toBeCloseTo(60, 10); // 4 * 15
    expect(d.rp).toBeCloseTo(12, 10); // 4 * 3
    expect(d.rf).toBeCloseTo(14, 10); // 4*1 + 2*5
  });

  it("ham: protein-only is not in the CHO group table, so its CHO is never drawn", () => {
    // cho=1.2 pro=19 fat=9. "protein-only" is not one of the five keys groups()
    // returns, so the CHO draw is skipped and the 1.2 g never enters an
    // exchange. "protein-only" and "fat-only" opt out of CHO grouping.
    const d = decompose({ cho: 1.2, pro: 19, fat: 9, fibre: 0 }, 15, "protein-only");
    expect(d.rounded.some((o) => o.ref.cho > 0)).toBe(false);
    // pro/7 = 2.7143 exchanges, fat per exchange = 9/2.7143 = 3.3158, above
    // lean's max of 3 and within medium's max of 7, so the tier is medium.
    const tier = d.rounded.find((o) => o.label === "Medium-fat protein");
    expect(tier).toBeTruthy();
    expect(tier.ex).toBeCloseTo(2.5, 10); // half(2.7143) = 2.5
    expect(d.rp).toBeCloseTo(17.5, 10); // 2.5 * 7
    // The exchange carries the ham's own 3.3158 g of fat per exchange, not the
    // tier's nominal 5 g, which would rebuild 12.5 g of fat for a ham declaring
    // 9 g. What is left of the 9 g is the 2.7143 to 2.5 exchange rounding.
    expect(d.rf).toBeCloseTo(2.5 * (9 / (19 / 7)), 10);
    expect(d.rf).toBeLessThan(9);
    expect(d.rounded.find((o) => o.label === "Fat")).toBeUndefined();
  });

  it("yoghurt: the milk exchange carries the fat the label declares", () => {
    const d = decompose({ cho: 6.5, pro: 4.2, fat: 1.6, fibre: 0 }, 15, "milk");
    const perEx = 1.6 / (6.5 / 12); // 2.95 g of fat per exchange, inside 0 to 3
    const milk = d.rounded.find((o) => o.label === "Fat-free milk");
    expect(milk.ex).toBeCloseTo(0.5, 10); // 6.5/12 = 0.5417 -> half() = 0.5
    expect(milk.ref.fat).toBeCloseTo(perEx, 10); // the label's fat, not the list's 0
    // The fat belongs to the fat-free milk exchange, which is defined as
    // carrying 0 to 3 g, so it is not also counted as a separate fat exchange.
    expect(d.rounded.some((o) => o.label === "Fat")).toBe(false);
    expect(d.rc).toBeCloseTo(6, 10); // 0.5 * 12
    expect(d.rp).toBeCloseTo(4, 10); // 0.5 * 8
    expect(d.rf).toBeCloseTo(0.5 * perEx, 10);
  });
});

describe("decompose(): the > 0.4 threshold for drawing a CHO exchange", () => {
  it("does not draw a starch exchange at exactly 0.4 g CHO (strict >)", () => {
    const d = decompose({ cho: 0.4, pro: 0, fat: 0, fibre: 0 }, 15, "starch");
    expect(d.rounded.find((o) => o.label === "Starch")).toBeUndefined();
  });
  it("draws a starch exchange just above 0.4 g CHO", () => {
    const d = decompose({ cho: 0.41, pro: 0, fat: 0, fibre: 0 }, 15, "starch");
    // 0.41/15 = 0.0273 exchanges, which half() rounds to 0, so the draw is
    // filtered out of `rounded`. The step still records it.
    expect(d.steps.some((s) => s.kind === "draw" && s.label.includes("Starch"))).toBe(true);
  });
});

describe("decompose(): the > 1.2 g thresholds for protein and fat exchanges", () => {
  it("does not draw a protein exchange at exactly 1.2 g residual protein", () => {
    const d = decompose({ cho: 0, pro: 1.2, fat: 0, fibre: 0 }, 15, "protein-only");
    expect(d.rounded).toHaveLength(0);
  });
  it("draws a protein exchange just above 1.2 g", () => {
    const d = decompose({ cho: 0, pro: 1.21, fat: 0, fibre: 0 }, 15, "protein-only");
    expect(d.steps.some((s) => s.kind === "draw" && s.label.includes("protein"))).toBe(true);
  });
  it("does not draw a fat exchange at exactly 1.2 g residual fat", () => {
    const d = decompose({ cho: 0, pro: 0, fat: 1.2, fibre: 0 }, 15, "protein-only");
    expect(d.rounded).toHaveLength(0);
  });
  it("draws a fat exchange just above 1.2 g", () => {
    const d = decompose({ cho: 0, pro: 0, fat: 1.21, fibre: 0 }, 15, "protein-only");
    expect(d.steps.some((s) => s.kind === "draw" && s.label === "0.2 × Fat")).toBe(true);
  });
});

describe("decompose(): protein fat-tier boundaries", () => {
  // The tier is the first one whose `max` is at least fat / (pro/7).
  // Lean max 3, medium max 7, high unbounded.
  function tierFor(fatPerExchange) {
    const pro = 7; // exactly 1 protein exchange, so fat-per-exchange === fat
    const d = decompose({ cho: 0, pro, fat: fatPerExchange, fibre: 0 }, 15, "protein-only");
    return d.rounded.find((o) => o.ref.pro === 7)?.label;
  }
  it("exactly at the lean/medium boundary (3) still counts as lean (<=)", () => {
    expect(tierFor(3)).toBe("Lean protein");
  });
  it("just above 3 becomes medium", () => {
    expect(tierFor(3.01)).toBe("Medium-fat protein");
  });
  it("exactly at the medium/high boundary (7) still counts as medium (<=)", () => {
    expect(tierFor(7)).toBe("Medium-fat protein");
  });
  it("just above 7 becomes high-fat", () => {
    expect(tierFor(7.01)).toBe("High-fat protein");
  });
});

describe("decompose(): rounding to the nearest half exchange", () => {
  it("rounds a small residual (0.24 -> half(0.24)=0) away to nothing", () => {
    const d = decompose({ cho: 0, pro: 0, fat: 0.24 * 5, fibre: 0 }, 15, "protein-only");
    expect(d.rounded).toHaveLength(0);
  });
  it("rounds 0.25 up to 0.5, not down to 0, following Math.round", () => {
    const d = decompose({ cho: 0, pro: 0, fat: 0.25 * 5, fibre: 0 }, 15, "protein-only");
    expect(d.rounded[0].ex).toBeCloseTo(0.5, 10);
  });
  it("half() itself rounds to the nearest 0.5, ties rounding up", () => {
    expect(half(1.24)).toBeCloseTo(1, 10);
    expect(half(1.25)).toBeCloseTo(1.5, 10);
    expect(half(1.74)).toBeCloseTo(1.5, 10);
    expect(half(1.75)).toBeCloseTo(2, 10);
  });
});

describe("decompose(): fibre is not netted off", () => {
  // The subtraction used to happen above 5 g per portion. It was removed: no
  // exchange list instructs it, and the American Diabetes Association does not
  // recommend counting "net carbs". Total carbohydrate is what gets counted.
  it("counts total carbohydrate however much fibre the portion holds", () => {
    const none = decompose({ cho: 20, pro: 0, fat: 0, fibre: 0 }, 15, "starch");
    const lots = decompose({ cho: 20, pro: 0, fat: 0, fibre: 20 }, 15, "starch");
    expect(lots.rounded).toEqual(none.rounded);
    expect(lots.rounded[0].ex).toBe(1.5);
  });

  it("is unaffected by fibre either side of the old 5 g threshold", () => {
    const at5 = decompose({ cho: 20, pro: 0, fat: 0, fibre: 5 }, 15, "starch");
    const over5 = decompose({ cho: 20, pro: 0, fat: 0, fibre: 5.01 }, 15, "starch");
    expect(over5.rounded[0].ex).toBe(at5.rounded[0].ex);
  });

  it("does not mention fibre in the opening ledger row", () => {
    const d = decompose({ cho: 20, pro: 0, fat: 0, fibre: 20 }, 15, "starch");
    expect(d.steps[0].label).toBe("Portion as eaten");
    expect(d.steps[0].cho).toBe(20);
  });

  it("works when fibre is absent from the record entirely", () => {
    expect(() => decompose({ cho: 20, pro: 0, fat: 0 }, 15, "starch")).not.toThrow();
  });
});


describe("decompose(): CHO-per-unit conventions (US 15g, Belgian 12g, Dutch/Kenyan 10g)", () => {
  it("the same 30 g CHO portion yields more, smaller exchanges at a smaller unit size", () => {
    const d15 = decompose({ cho: 30, pro: 0, fat: 0, fibre: 0 }, 15, "starch");
    const d12 = decompose({ cho: 30, pro: 0, fat: 0, fibre: 0 }, 12, "starch");
    const d10 = decompose({ cho: 30, pro: 0, fat: 0, fibre: 0 }, 10, "starch");
    expect(d15.rounded[0].ex).toBeCloseTo(2, 10); // 30/15
    expect(d12.rounded[0].ex).toBeCloseTo(2.5, 10); // 30/12 = 2.5
    expect(d10.rounded[0].ex).toBeCloseTo(3, 10); // 30/10
  });
  it("groups() scales the carbohydrate column and leaves protein and fat alone", () => {
    // The convention redefines the carbohydrate unit, not what a portion of the
    // food group carries otherwise, so only cho moves with it.
    const g10 = groups(10);
    expect(g10.starch).toEqual({ id: "starch", label: "Starch", cho: 10, pro: 3, fat: 1 });
    expect(g10.milk.cho).toBeCloseTo(8, 10); // 12 * (10/15)
    expect(g10.veg.cho).toBeCloseTo(10 / 3, 10); // 5 * (10/15)
  });
  it("a group's protein and fat are identical at every convention", () => {
    for (const id of ["starch", "fruit", "milk", "veg", "sweet"]) {
      expect(groups(10)[id].pro).toBe(groups(15)[id].pro);
      expect(groups(12)[id].pro).toBe(groups(15)[id].pro);
      expect(groups(10)[id].fat).toBe(groups(15)[id].fat);
      expect(groups(12)[id].fat).toBe(groups(15)[id].fat);
    }
  });
  it("a milk exchange carries 8 g of protein in every system", () => {
    expect(groups(15).milk.pro).toBe(8);
    expect(groups(12).milk.pro).toBe(8);
    expect(groups(10).milk.pro).toBe(8);
  });
});

describe("decompose(): never produces a negative exchange count", () => {
  it("across a spread of random-ish inputs, every rounded exchange is >= 0 and every residual step stays >= -1e-9", () => {
    const groupIds = ["starch", "fruit", "milk", "veg", "sweet", "protein-only", "fat-only"];
    for (let cho = 0; cho <= 100; cho += 17) {
      for (let pro = 0; pro <= 60; pro += 23) {
        for (let fat = 0; fat <= 60; fat += 19) {
          for (const gid of groupIds) {
            const d = decompose({ cho, pro, fat, fibre: 0 }, 15, gid);
            for (const o of d.rounded) expect(o.ex).toBeGreaterThanOrEqual(0);
            for (const s of d.steps) {
              if (s.kind === "res") {
                expect(s.cho).toBeGreaterThanOrEqual(-1e-9);
                expect(s.pro).toBeGreaterThanOrEqual(-1e-9);
                expect(s.fat).toBeGreaterThanOrEqual(-1e-9);
              }
            }
          }
        }
      }
    }
  });
});

describe("gramsPerExchange()", () => {
  it("uses the CHO ratio when the exchange carries CHO", () => {
    // starch exchange (cho:15) in a food that is 62g CHO / 100g
    expect(gramsPerExchange({ cho: 15, pro: 3, fat: 1 }, { cho: 62, pro: 9, fat: 14 })).toBeCloseTo((100 * 15) / 62, 10);
  });
  it("falls back to the protein ratio only when the exchange has no CHO", () => {
    // a protein-tier exchange (cho:0, pro:7) in a food that is 19g protein / 100g
    expect(gramsPerExchange({ cho: 0, pro: 7, fat: 5 }, { cho: 1.2, pro: 19, fat: 9 })).toBeCloseTo((100 * 7) / 19, 10);
  });
  it("falls back to the fat ratio only when the exchange has neither CHO nor protein", () => {
    expect(gramsPerExchange({ cho: 0, pro: 0, fat: 5 }, { cho: 62, pro: 9, fat: 14 })).toBeCloseTo((100 * 5) / 14, 10);
  });
  it("returns null when the food's own composition has zero of the relevant macro (would divide by zero)", () => {
    expect(gramsPerExchange({ cho: 15, pro: 0, fat: 0 }, { cho: 0, pro: 5, fat: 5 })).toBeNull();
    expect(gramsPerExchange({ cho: 0, pro: 7, fat: 0 }, { cho: 5, pro: 0, fat: 5 })).toBeNull();
    expect(gramsPerExchange({ cho: 0, pro: 0, fat: 5 }, { cho: 5, pro: 5, fat: 0 })).toBeNull();
  });
  it("returns null for a fully empty exchange reference", () => {
    expect(gramsPerExchange({ cho: 0, pro: 0, fat: 0 }, { cho: 10, pro: 10, fat: 10 })).toBeNull();
  });
});

describe("TIERS table", () => {
  it("is ordered so Array.find() reaches lean before medium before high", () => {
    expect(TIERS.map((t) => t.label)).toEqual(["Lean protein", "Medium-fat protein", "High-fat protein"]);
    expect(TIERS[0].max).toBeLessThan(TIERS[1].max);
    expect(TIERS[1].max).toBeLessThan(TIERS[2].max);
  });
});

describe("milk fat variants", () => {
  // The US list defines three milk exchanges sharing 12 g of carbohydrate and
  // 8 g of protein, separated only by the fat they carry.
  it("skim milk stays on the fat-free variant and nets off no fat", () => {
    const d = decompose({ cho: 5, pro: 3.4, fat: 0.2, fibre: 0 }, 15, "milk");
    expect(d.rounded.find((o) => o.label === "Fat-free milk")).toBeTruthy();
  });
  it("2% milk lands on the reduced-fat variant", () => {
    // cho 4.8 -> 0.4 exchanges, fat 2 -> 5 g per exchange, inside 4 to 7
    const d = decompose({ cho: 4.8, pro: 3.3, fat: 2, fibre: 0 }, 15, "milk");
    expect(d.steps.some((s) => s.label && s.label.includes("Reduced-fat milk"))).toBe(true);
  });
  it("whole milk lands on the whole variant and nets its fat into the milk exchange", () => {
    // cho 4.7 -> 0.3917 exchanges, fat 3.6 -> 9.2 g per exchange, above 8
    const d = decompose({ cho: 4.7, pro: 3.4, fat: 3.6, fibre: 0 }, 15, "milk");
    const draw = d.steps.find((s) => s.kind === "draw" && s.label.includes("Whole milk"));
    expect(draw).toBeTruthy();
    expect(draw.fat).toBeLessThan(0); // fat was drawn into the milk exchange
    expect(d.rounded.some((o) => o.label === "Fat")).toBe(false);
  });
  it("every milk variant carries 12 g CHO and 8 g protein at the 15 g convention", () => {
    for (const t of MILK_TIERS) {
      expect(groups(15).milk.cho).toBe(12);
      expect(groups(15).milk.pro).toBe(8);
      expect([0, 5, 8]).toContain(t.fat);
    }
  });
});

describe("milk exchanges never override the declared fat", () => {
  it("charges the milk exchange exactly the fat on the label, at every variant", () => {
    for (const fat of [0, 1.6, 3, 3.6, 5, 9, 14]) {
      const d = decompose({ cho: 4.7, pro: 3.4, fat, fibre: 0 }, 15, "milk");
      const draw = d.steps.find((s) => s.kind === "draw" && s.label.includes("milk"));
      expect(-draw.fat).toBeCloseTo(fat, 10);
    }
  });
  it("puts 3 g of fat per exchange in fat-free, inclusive, and 3.01 in reduced-fat", () => {
    // 12 g of CHO is exactly one exchange, so fat per exchange is the fat itself
    const at = (fat) => decompose({ cho: 12, pro: 8, fat, fibre: 0 }, 15, "milk").rounded[0].label;
    expect(at(3)).toBe("Fat-free milk");
    expect(at(3.01)).toBe("Reduced-fat milk");
    expect(at(7)).toBe("Reduced-fat milk");
    expect(at(7.01)).toBe("Whole milk");
  });
});

describe("protein tiers switch", () => {
  // Which behaviour is right depends on the list the person was given, so it is
  // a setting rather than a fixed rule. Tiered is the default.
  const fatty = { cho: 0, pro: 21, fat: 24, fibre: 0 }; // 8 g of fat per exchange
  it("tiered: names the tier and carries the declared fat", () => {
    const d = decompose(fatty, 15, "protein-only", { proteinTiers: true });
    const draw = d.steps.find((s) => s.kind === "draw" && s.label.includes("protein"));
    expect(draw.label).toContain("High-fat protein");
    expect(-draw.fat).toBeCloseTo(24, 10); // all of it, as declared
    expect(d.rounded.some((o) => o.label === "Fat")).toBe(false);
  });
  it("a food at the top of the lean range is lean and keeps all of its fat", () => {
    // 14 g protein = 2 exchanges, 6 g fat = 3 g per exchange, the inclusive top
    // of the lean range, so it is lean carrying 3 g rather than the nominal 2 g
    // with the difference spilled into a fat exchange.
    const d = decompose({ cho: 0, pro: 14, fat: 6, fibre: 0 }, 15, "protein-only", { proteinTiers: true });
    const draw = d.steps.find((s) => s.kind === "draw" && s.label.includes("protein"));
    expect(draw.label).toContain("Lean protein");
    expect(-draw.fat).toBeCloseTo(6, 10);
    expect(d.rounded.some((o) => o.label === "Fat")).toBe(false);
    expect(d.rf).toBeCloseTo(6, 10); // rebuilds the declared fat exactly
  });
  it("untiered: one Protein exchange carrying exactly the declared fat", () => {
    const d = decompose({ cho: 0, pro: 14, fat: 6, fibre: 0 }, 15, "protein-only", { proteinTiers: false });
    const draw = d.steps.find((s) => s.kind === "draw" && s.label.includes("Protein"));
    expect(draw.label).toContain("Protein");
    expect(draw.label).not.toContain("Lean");
    expect(-draw.fat).toBeCloseTo(6, 10); // all of it, as declared
    expect(d.rounded.some((o) => o.label === "Fat")).toBe(false);
  });
  it("defaults to tiered when no option is passed", () => {
    const a = decompose({ cho: 0, pro: 14, fat: 6, fibre: 0 }, 15, "protein-only");
    const b = decompose({ cho: 0, pro: 14, fat: 6, fibre: 0 }, 15, "protein-only", { proteinTiers: true });
    expect(a.rounded.map((o) => o.label)).toEqual(b.rounded.map((o) => o.label));
  });
});

describe("no exchange ever rebuilds more fat than the label declares", () => {
  it("holds across the tier boundaries, tiered and untiered, milk and protein", () => {
    const cases = [];
    for (const fat of [0, 1, 2, 3, 3.01, 5, 6, 7, 7.01, 8, 12, 20]) {
      cases.push([{ cho: 0, pro: 14, fat, fibre: 0 }, "protein-only"]);
      cases.push([{ cho: 12, pro: 8, fat, fibre: 0 }, "milk"]);
    }
    for (const [p, gid] of cases) {
      for (const proteinTiers of [true, false]) {
        const d = decompose(p, 15, gid, { proteinTiers });
        // Rounding can lose fat, never invent it beyond half an exchange of it.
        expect(d.rf).toBeLessThanOrEqual(p.fat + 5 / 2 + 1e-9);
      }
    }
  });
});
