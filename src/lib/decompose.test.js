import { describe, it, expect } from "vitest";
import { decompose, gramsPerExchange, groups, TIERS, half } from "./exchange.js";

/*
 * decompose() walks a food's macros down to whole exchanges: carbohydrate
 * against the chosen group first, then residual protein at 7 g/exchange
 * (fat tier decided by fat-per-exchange), then residual fat at 5 g/exchange.
 * Every expected number below is worked out by hand from the algorithm's
 * own documented rules, independently of the implementation, so a failure
 * here means the code and the spec have diverged.
 */

describe("decompose() - golden cases from the app's own built-in test fixtures", () => {
  it("crackers: starch group draws all CHO, leftover fat becomes a Fat exchange", () => {
    // cho=62 pro=9 fat=14, unit=15, group=starch, fibre=4 (below the >5 netting threshold)
    const d = decompose({ cho: 62, pro: 9, fat: 14, fibre: 4 }, 15, "starch", true);
    // starch exchange = 62/15 = 4.1333..., which happens to draw off ALL 62 g of
    // CHO (62 is an exact multiple of 15/... actually 4.1333*15 = 62 exactly)
    // and pro is capped at what's available (9 < 4.1333*3=12.4) so all 9 g pro
    // and 4.1333 g fat are netted off against the starch exchange, leaving
    // 9.8667 g fat to become its own exchange.
    expect(d.rounded).toHaveLength(2);
    const starch = d.rounded.find((o) => o.label === "Starch");
    const fat = d.rounded.find((o) => o.label === "Fat");
    expect(starch.ex).toBeCloseTo(4, 10); // half(4.1333) = 4
    expect(fat.ex).toBeCloseTo(2, 10); // half(9.8667/5) = half(1.9733) = 2
    expect(d.rc).toBeCloseTo(60, 10); // 4 * 15
    expect(d.rp).toBeCloseTo(12, 10); // 4 * 3
    expect(d.rf).toBeCloseTo(14, 10); // 4*1 + 2*5
  });

  it("ham: no starch group (protein-only isn't in the CHO group table), CHO is never drawn into any exchange", () => {
    // cho=1.2 pro=19 fat=9, group="protein-only" - not one of the five keys
    // groups() returns, so the starch-draw block is skipped entirely and the
    // 1.2 g CHO simply never appears in any exchange (matches the app's
    // documented behaviour: "protein-only"/"fat-only" opt out of CHO grouping).
    const d = decompose({ cho: 1.2, pro: 19, fat: 9, fibre: 0 }, 15, "protein-only", true);
    expect(d.rounded.some((o) => o.ref.cho > 0)).toBe(false);
    // pro/7 = 2.7143 exchanges; fat-per-exchange = 9/2.7143 = 3.3158, which
    // is > lean's max of 3 and <= medium's max of 7, so tier = medium (fat 5)
    const tier = d.rounded.find((o) => o.label === "Medium-fat protein");
    expect(tier).toBeTruthy();
    expect(tier.ex).toBeCloseTo(2.5, 10); // half(2.7143) = 2.5
    expect(d.rp).toBeCloseTo(17.5, 10); // 2.5 * 7
    expect(d.rf).toBeCloseTo(12.5, 10); // 2.5 * 5 (fat fully absorbed by the protein tier, no separate Fat exchange)
    expect(d.rounded.find((o) => o.label === "Fat")).toBeUndefined();
  });

  it("yoghurt: milk group draws CHO+protein, leftover fat becomes its own exchange", () => {
    const d = decompose({ cho: 6.5, pro: 4.2, fat: 1.6, fibre: 0 }, 15, "milk", true);
    const milk = d.rounded.find((o) => o.label === "Milk");
    const fat = d.rounded.find((o) => o.label === "Fat");
    expect(milk.ex).toBeCloseTo(0.5, 10); // 6.5/12 = 0.5417 -> half() = 0.5
    expect(fat.ex).toBeCloseTo(0.5, 10); // 1.6/5 = 0.32 -> half() rounds UP to 0.5
    expect(d.rc).toBeCloseTo(6, 10); // 0.5 * 12
    expect(d.rp).toBeCloseTo(4, 10); // 0.5 * 8
    expect(d.rf).toBeCloseTo(2.5, 10); // 0.5*0 + 0.5*5
  });
});

describe("decompose() - the > 0.4 threshold for drawing a CHO exchange", () => {
  it("does not draw a starch exchange at exactly 0.4 g CHO (strict >)", () => {
    const d = decompose({ cho: 0.4, pro: 0, fat: 0, fibre: 0 }, 15, "starch", true);
    expect(d.rounded.find((o) => o.label === "Starch")).toBeUndefined();
  });
  it("draws a starch exchange just above 0.4 g CHO", () => {
    const d = decompose({ cho: 0.41, pro: 0, fat: 0, fibre: 0 }, 15, "starch", true);
    // 0.41/15 = 0.0273 exchanges -> half() rounds to 0, so it's computed but
    // then filtered out for being 0 after rounding - the *step* still records
    // the draw even though nothing survives into `rounded`.
    expect(d.steps.some((s) => s.kind === "draw" && s.label.includes("Starch"))).toBe(true);
  });
});

describe("decompose() - the > 1.2 g thresholds for protein and fat exchanges", () => {
  it("does not draw a protein exchange at exactly 1.2 g residual protein", () => {
    const d = decompose({ cho: 0, pro: 1.2, fat: 0, fibre: 0 }, 15, "protein-only", true);
    expect(d.rounded).toHaveLength(0);
  });
  it("draws a protein exchange just above 1.2 g", () => {
    const d = decompose({ cho: 0, pro: 1.21, fat: 0, fibre: 0 }, 15, "protein-only", true);
    expect(d.steps.some((s) => s.kind === "draw" && s.label.includes("protein"))).toBe(true);
  });
  it("does not draw a fat exchange at exactly 1.2 g residual fat", () => {
    const d = decompose({ cho: 0, pro: 0, fat: 1.2, fibre: 0 }, 15, "protein-only", true);
    expect(d.rounded).toHaveLength(0);
  });
  it("draws a fat exchange just above 1.2 g", () => {
    const d = decompose({ cho: 0, pro: 0, fat: 1.21, fibre: 0 }, 15, "protein-only", true);
    expect(d.steps.some((s) => s.kind === "draw" && s.label === "0.2 × Fat")).toBe(true);
  });
});

describe("decompose() - protein fat-tier boundaries", () => {
  // tier is chosen by fat-per-exchange = fat / (pro/7), find()ing the first
  // tier whose `max` is >= that value: Lean max=3, Medium max=7, High max=Infinity
  function tierFor(fatPerExchange) {
    const pro = 7; // exactly 1 protein exchange, so fat-per-exchange === fat
    const d = decompose({ cho: 0, pro, fat: fatPerExchange, fibre: 0 }, 15, "protein-only", true);
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

describe("decompose() - rounding to the nearest half exchange", () => {
  it("rounds a small residual (0.24 -> half(0.24)=0) away to nothing", () => {
    const d = decompose({ cho: 0, pro: 0, fat: 0.24 * 5, fibre: 0 }, 15, "protein-only", true);
    expect(d.rounded).toHaveLength(0);
  });
  it("rounds 0.25 UP to 0.5, not down to 0 (JS Math.round half-up behaviour)", () => {
    const d = decompose({ cho: 0, pro: 0, fat: 0.25 * 5, fibre: 0 }, 15, "protein-only", true);
    expect(d.rounded[0].ex).toBeCloseTo(0.5, 10);
  });
  it("half() itself rounds to the nearest 0.5, ties rounding up", () => {
    expect(half(1.24)).toBeCloseTo(1, 10);
    expect(half(1.25)).toBeCloseTo(1.5, 10);
    expect(half(1.74)).toBeCloseTo(1.5, 10);
    expect(half(1.75)).toBeCloseTo(2, 10);
  });
});

describe("decompose() - fibre netting", () => {
  it("does not net off fibre at exactly 5 g (strict >5 threshold)", () => {
    const d = decompose({ cho: 20, pro: 0, fat: 0, fibre: 5 }, 15, "starch", true);
    expect(d.steps[0].label).toBe("Portion as eaten");
    expect(d.steps[0].cho).toBe(20);
  });
  it("nets off fibre just above 5 g", () => {
    const d = decompose({ cho: 20, pro: 0, fat: 0, fibre: 5.01 }, 15, "starch", true);
    expect(d.steps[0].label).toContain("netted off");
    expect(d.steps[0].cho).toBeCloseTo(20 - 5.01, 10);
  });
  it("never nets fibre below zero available CHO (floors at 0, doesn't go negative)", () => {
    const d = decompose({ cho: 5, pro: 0, fat: 0, fibre: 20 }, 15, "starch", true);
    expect(d.steps[0].cho).toBe(0);
  });
  it("subFibre=false ignores fibre entirely, however high", () => {
    const d = decompose({ cho: 20, pro: 0, fat: 0, fibre: 20 }, 15, "starch", false);
    expect(d.steps[0].cho).toBe(20);
  });
});

describe("decompose() - CHO-per-unit conventions (US 15g, Belgian 12g, Dutch/Kenyan 10g)", () => {
  it("the same 30 g CHO portion yields more, smaller exchanges at a smaller unit size", () => {
    const d15 = decompose({ cho: 30, pro: 0, fat: 0, fibre: 0 }, 15, "starch", true);
    const d12 = decompose({ cho: 30, pro: 0, fat: 0, fibre: 0 }, 12, "starch", true);
    const d10 = decompose({ cho: 30, pro: 0, fat: 0, fibre: 0 }, 10, "starch", true);
    expect(d15.rounded[0].ex).toBeCloseTo(2, 10); // 30/15
    expect(d12.rounded[0].ex).toBeCloseTo(2.5, 10); // 30/12 = 2.5
    expect(d10.rounded[0].ex).toBeCloseTo(3, 10); // 30/10
  });
  it("groups() scales every group's cho/pro/fat proportionally to the chosen unit", () => {
    const g10 = groups(10);
    expect(g10.starch).toEqual({ id: "starch", label: "Starch", cho: 10, pro: 2, fat: 2 / 3 });
    expect(g10.milk.cho).toBeCloseTo(8, 10); // 12 * (10/15)
    expect(g10.veg.cho).toBeCloseTo(10 / 3, 10); // 5 * (10/15)
  });
});

describe("decompose() - never produces a negative exchange count", () => {
  it("across a spread of random-ish inputs, every rounded exchange is >= 0 and every residual step stays >= -1e-9", () => {
    const groupIds = ["starch", "fruit", "milk", "veg", "sweet", "protein-only", "fat-only"];
    for (let cho = 0; cho <= 100; cho += 17) {
      for (let pro = 0; pro <= 60; pro += 23) {
        for (let fat = 0; fat <= 60; fat += 19) {
          for (const gid of groupIds) {
            const d = decompose({ cho, pro, fat, fibre: 0 }, 15, gid, true);
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

describe("TIERS table sanity", () => {
  it("is ordered so Array.find() reaches lean before medium before high", () => {
    expect(TIERS.map((t) => t.label)).toEqual(["Lean protein", "Medium-fat protein", "High-fat protein"]);
    expect(TIERS[0].max).toBeLessThan(TIERS[1].max);
    expect(TIERS[1].max).toBeLessThan(TIERS[2].max);
  });
});
