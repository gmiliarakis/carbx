import { describe, it, expect } from "vitest";
import { decompose, inferGroup, inferGroupWithReason } from "./exchange.js";

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

// Plant drinks wear a dairy name over a food that is usually not dairy, and
// both the fat rule and the dairy rule win outright, so the plant-drink test
// has to run ahead of both. These fix that ordering: without it a sweetened
// almond drink matched "almond" on the fat list and its carbohydrate went
// uncounted, which on a diabetes tool is the worst kind of quiet error.
describe("plant drinks", () => {
  const at = (name, p) => inferGroupWithReason(p, name);

  it("counts a soy drink on its carbohydrate, not as a milk exchange", () => {
    // The 2007 list's Dairy-Like Foods section: a cup of plain soy milk is
    // "1 carbohydrate + 1 fat". Where it means a milk exchange it says so,
    // as it does for chocolate milk ("1 fat-free milk + 1 carbohydrate").
    const r = at("Sojadrink ongezoet", { cho: 2.5, pro: 3.3, fat: 1.8, sugars: 0.5, fibre: 0.5 });
    expect(r.group).toBe("starch");
    expect(r.via).toBe("name");
    expect(r.rule).toMatch(/plant dairy/);
  });

  it("lets a soy drink's protein fall out as a protein exchange", () => {
    // Counting it as milk would swallow 8 g of protein into a milk exchange.
    // Counting it on carbohydrate leaves the protein to the later stage, which
    // is what the list's "1 carbohydrate + 1 fat" implies for the rest.
    const per100 = { cho: 2.5, pro: 3.3, fat: 1.8 };
    const portion = { cho: 2.5 * 2.5, pro: 3.3 * 2.5, fat: 1.8 * 2.5 };
    const d = decompose(portion, 15, inferGroup(per100, "Sojadrink"), { proteinTiers: true });
    expect(d.rounded.some((o) => o.ref.pro === 7)).toBe(true);
  });

  it("counts an oat drink on its carbohydrate, not as a milk exchange", () => {
    // Oatly Barista, 7394376616228. 1.1 g of protein against 7.1 g of
    // carbohydrate is nothing like the 8 against 12 a milk exchange carries.
    const r = at("Oat drink, barista edition", { cho: 7.1, pro: 1.1, fat: 3, sugars: 3.4, fibre: 0.8 });
    expect(r.group).toBe("starch");
    expect(r.via).toBe("name");
    expect(r.rule).toMatch(/plant dairy/);
  });

  it.each([
    ["Ρόφημα βρώμης", { cho: 7, pro: 1, fat: 1.5, sugars: 4, fibre: 0.8 }],
    ["Rice drink", { cho: 9.5, pro: 0.1, fat: 1, sugars: 5.5, fibre: 0 }],
    ["Hafermilch", { cho: 6.6, pro: 1, fat: 1.5, sugars: 4, fibre: 0.8 }],
    ["Lait d'avoine", { cho: 7, pro: 1, fat: 1.5, sugars: 4, fibre: 0.8 }],
    ["Havermelk", { cho: 7, pro: 1, fat: 1.5, sugars: 4, fibre: 0.8 }],
  ])("%s is counted on its carbohydrate", (name, p) => {
    expect(inferGroup(p, name)).toBe("starch");
  });

  it("does not lose a sweetened almond drink's carbohydrate to the nut list", () => {
    const r = at("Almond milk, sweetened", { cho: 3, pro: 0.4, fat: 1.1, sugars: 2.6, fibre: 0.3 });
    expect(r.group).toBe("starch");
    expect(r.rule).toMatch(/plant dairy/);
  });

  it("leaves an unsweetened almond drink to the composition rules", () => {
    // Almost nothing in it. It reaches the fat list and rounds away to a free
    // food, which is what it is.
    expect(inferGroup({ cho: 0.1, pro: 0.4, fat: 1.1, sugars: 0.1, fibre: 0.3 }, "Amandeldrink ongezoet"))
      .toBe("fat-only");
  });

  it("keeps the grains themselves on the starch list", () => {
    expect(inferGroup({ cho: 60, pro: 13, fat: 7, sugars: 1, fibre: 10 }, "Havermout")).toBe("starch");
    expect(inferGroup({ cho: 28, pro: 2.7, fat: 0.3, sugars: 0.1, fibre: 0.4 }, "Rijst gekookt")).toBe("starch");
  });

  it("leaves canned coconut milk on the fat list", () => {
    // A cooking ingredient at 21 g of fat, not a drink. "coconut milk" is
    // deliberately absent from the plant-drink names; "coconut drink" is there.
    expect(inferGroup({ cho: 3, pro: 2, fat: 21, sugars: 2, fibre: 0 }, "Coconut milk, canned")).toBe("fat-only");
  });

  it("still reads dairy milk as dairy", () => {
    expect(inferGroup({ cho: 4.9, pro: 3.7, fat: 1.5, sugars: 4.9, fibre: 0 }, "Halfvolle melk")).toBe("milk");
  });
});

describe("plant dairy beyond drinks", () => {
  it("counts a plain soy yoghurt as protein, not as a vegetable", () => {
    // 1 g of carbohydrate with 4 g of protein satisfies the vegetable rule,
    // which only asks for low carbohydrate and some protein alongside it. The
    // name is what tells the two apart.
    const r = inferGroupWithReason({ cho: 1, pro: 4, fat: 2.3, sugars: 0.7, fibre: 0.6 }, "Sojayoghurt naturel");
    expect(r.group).toBe("protein-only");
    expect(r.via).toBe("name");
  });

  it.each([
    ["Kokosyoghurt", { cho: 4.5, pro: 0.8, fat: 12, sugars: 3, fibre: 1 }],
    ["Coconut yoghurt", { cho: 4.5, pro: 0.8, fat: 12, sugars: 3, fibre: 1 }],
    ["Haveryoghurt", { cho: 8, pro: 1, fat: 3, sugars: 5, fibre: 1 }],
  ])("%s is counted on its carbohydrate, with the fat falling out separately", (name, p) => {
    expect(inferGroup(p, name)).toBe("starch");
  });

  it("still reads dairy yoghurt as dairy", () => {
    expect(inferGroup({ cho: 4, pro: 9.5, fat: 2, sugars: 4, fibre: 0 }, "Griekse yoghurt 2%")).toBe("milk");
  });

  it("keeps vegetables on the vegetable list", () => {
    expect(inferGroup({ cho: 7, pro: 2.8, fat: 0.4, sugars: 1.7, fibre: 2.6 }, "Broccoli")).toBe("veg");
    expect(inferGroup({ cho: 1.4, pro: 2.9, fat: 0.4, sugars: 0.4, fibre: 2.2 }, "Spinazie")).toBe("veg");
  });

  it.each([
    ["Tofu natuur", { cho: 1.9, pro: 12, fat: 7 }, "protein-only"],
    ["Tempeh", { cho: 9, pro: 19, fat: 11 }, "protein-only"],
    ["Seitan", { cho: 4, pro: 24, fat: 1.5 }, "protein-only"],
    ["Falafel", { cho: 32, pro: 13, fat: 18, fibre: 9 }, "starch"],
    ["Hummus", { cho: 14, pro: 8, fat: 17, fibre: 6 }, "starch"],
    ["Edamame", { cho: 8.9, pro: 11, fat: 5, fibre: 5 }, "starch"],
  ])("%s is %s", (name, p, want) => {
    expect(inferGroup(p, name)).toBe(want);
  });
});
