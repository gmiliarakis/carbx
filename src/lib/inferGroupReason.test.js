import { describe, it, expect } from "vitest";
import { inferGroup, inferGroupWithReason } from "./exchange.js";

// The app shows the reason alongside the group, so a reader can tell a name
// match from a composition match. These fix the contract: the reason must
// always accompany the same group inferGroup returns, and `via` must be
// honest about which of the two decided it.
const cases = [
  ["olive oil", { cho: 0, pro: 0, fat: 100 }, "fat-only", "name"],
  ["Greek yoghurt 2%", { cho: 4, pro: 9, fat: 2 }, "milk", "name"],
  ["banana", { cho: 22.8, pro: 1.1, fat: 0.3, sugars: 12.2, fibre: 2.6 }, "fruit", "name"],
  ["chicken breast", { cho: 0, pro: 23, fat: 2 }, "protein-only", "name"],
  ["broccoli", { cho: 4, pro: 2.8, fat: 0.4 }, "veg", "name"],
  ["volkoren brood", { cho: 40, pro: 9, fat: 3 }, "starch", "name"],
  ["", { cho: 0, pro: 0, fat: 100 }, "fat-only", "composition"],
  ["", { cho: 0.5, pro: 26, fat: 4 }, "protein-only", "composition"],
  ["xyzzy", { cho: 60, pro: 8, fat: 2 }, "starch", "default"],
];

describe("inferGroupWithReason", () => {
  it.each(cases)("%s is %s, decided by %s", (name, p, group, via) => {
    const r = inferGroupWithReason(p, name);
    expect(r.group).toBe(group);
    expect(r.via).toBe(via);
  });

  it.each(cases)("%s agrees with inferGroup", (name, p) => {
    expect(inferGroupWithReason(p, name).group).toBe(inferGroup(p, name));
  });

  it("always carries a non-empty reason", () => {
    for (const [name, p] of cases) {
      expect(inferGroupWithReason(p, name).rule.length).toBeGreaterThan(10);
    }
  });

  it("says default only when neither the name nor the macros matched", () => {
    expect(inferGroupWithReason({ cho: 60, pro: 8, fat: 2 }, "qqqq").via).toBe("default");
    expect(inferGroupWithReason({ cho: 60, pro: 8, fat: 2 }, "rice").via).toBe("name");
  });
});

// Both of these came out of the validation run in validation/VALIDATION.md,
// where twenty real supermarket products were worked through by hand. They are
// the two the run got wrong.
describe("regressions found by the validation run", () => {
  it("reads halloumi named in Greek as a protein, not a starch", () => {
    // 4056489434252, Νωμά Κυπριακό χαλούμι. The keyword list carried
    // "halloumi" in Latin script only, so a pack labelled in Greek fell all
    // the way through to the starch default.
    const r = inferGroupWithReason({ cho: 3, pro: 20, fat: 25, sugars: 2 }, "Κυπριακό χαλούμι");
    expect(r.group).toBe("protein-only");
    expect(r.via).toBe("name");
  });

  it("still reads halloumi named in Latin script as a protein", () => {
    expect(inferGroup({ cho: 3, pro: 20, fat: 25 }, "Halloumi cheese")).toBe("protein-only");
  });

  it("reads a coconut-oil imitation cheese as a fat, not a starch", () => {
    // 5202390020407, Violife Greek White. 29 g of fat, 11 g of starch and no
    // protein at all, under a name that reads as cheese. It used to reach the
    // starch default because the fat rule required under 5 g of carbohydrate.
    const r = inferGroupWithReason({ cho: 11, pro: 0, fat: 29, sugars: 0 }, "Greek White panetto");
    expect(r.group).toBe("fat-only");
    expect(r.via).toBe("composition");
  });

  it("does not drag a real cheese into the fat rule", () => {
    expect(inferGroup({ cho: 0.7, pro: 16.5, fat: 24.5 }, "Feta")).toBe("protein-only");
    expect(inferGroup({ cho: 0, pro: 25.8, fat: 33.2 }, "Goudse kaas oud")).toBe("protein-only");
  });

  it("does not drag a chocolate spread into the fat rule", () => {
    // 64 g of carbohydrate against 28 g of fat: fat leads the energy but not
    // overwhelmingly, and the carbohydrate is far too high.
    expect(inferGroup({ cho: 64, pro: 3.6, fat: 28, sugars: 63, fibre: 2.6 }, "Merenda")).toBe("starch");
  });
});
