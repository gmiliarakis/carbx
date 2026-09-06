import { describe, it, expect } from "vitest";
import { inferGroup, decompose } from "./exchange.js";

// Real foods, per 100 g, against the group a dietitian would put the
// carbohydrate in. This file exists to catch a classifier that passes its own
// unit tests while getting ordinary food wrong.
//
// Sweets is not a group that gets prescribed on its own, so a sugary food is
// accepted on starch or fruit: what matters is that it decomposes sensibly,
// with its fat falling out as fat exchanges.
const FOODS = [
  ["White bread",       { cho: 49, pro: 9, fat: 3.2, fibre: 2.7, sugars: 5 },     ["starch"]],
  ["Cooked white rice", { cho: 28, pro: 2.7, fat: 0.3, fibre: 0.4, sugars: 0.1 }, ["starch"]],
  ["Boiled potato",     { cho: 17, pro: 2, fat: 0.1, fibre: 2.2, sugars: 0.8 },   ["starch"]],
  ["Baked beans",       { cho: 20, pro: 5, fat: 0.6, fibre: 4.5, sugars: 5 },     ["starch"]],
  ["Cooked lentils",    { cho: 20, pro: 9, fat: 0.4, fibre: 8, sugars: 1.8 },     ["starch"]],
  ["Apple",             { cho: 14, pro: 0.3, fat: 0.2, fibre: 2.4, sugars: 10 },  ["fruit"]],
  ["Banana",            { cho: 23, pro: 1.1, fat: 0.3, fibre: 2.6, sugars: 12 },  ["fruit"]],
  ["Orange juice",      { cho: 10, pro: 0.7, fat: 0.2, fibre: 0.2, sugars: 8 },   ["fruit"]],
  ["Whole milk",        { cho: 4.7, pro: 3.4, fat: 3.6, fibre: 0, sugars: 4.7 },  ["milk"]],
  ["Greek yoghurt 0%",  { cho: 4, pro: 10, fat: 0.4, fibre: 0, sugars: 4 },       ["milk"]],
  ["Broccoli",          { cho: 7, pro: 2.8, fat: 0.4, fibre: 2.6, sugars: 1.7 },  ["veg"]],
  ["Courgette",         { cho: 3.1, pro: 1.2, fat: 0.3, fibre: 1, sugars: 2.5 },  ["veg"]],
  ["Chicken breast",    { cho: 0, pro: 31, fat: 3.6, fibre: 0, sugars: 0 },       ["protein-only"]],
  ["Cheddar",           { cho: 1.3, pro: 25, fat: 33, fibre: 0, sugars: 0.5 },    ["protein-only"]],
  ["Olive oil",         { cho: 0, pro: 0, fat: 100, fibre: 0, sugars: 0 },        ["fat-only"]],
  ["Coca-Cola",         { cho: 10.6, pro: 0, fat: 0, fibre: 0, sugars: 10.6 },    ["starch", "fruit"]],
  ["Table sugar",       { cho: 100, pro: 0, fat: 0, fibre: 0, sugars: 100 },      ["starch", "fruit"]],
  ["Honey",             { cho: 82, pro: 0.3, fat: 0, fibre: 0.2, sugars: 82 },    ["starch", "fruit"]],
  ["Milk chocolate",    { cho: 59, pro: 7.6, fat: 30, fibre: 3.4, sugars: 52 },   ["starch", "fruit"]],
  ["Sponge cake",       { cho: 55, pro: 6, fat: 15, fibre: 1.2, sugars: 30 },     ["starch", "fruit"]],
  ["Fruit jam",         { cho: 60, pro: 0.4, fat: 0.1, fibre: 1, sugars: 58 },    ["starch", "fruit"]],
];

describe("real foods land in the group a dietitian would choose", () => {
  for (const [name, p, allowed] of FOODS) {
    it(`${name} -> ${allowed.join(" or ")}`, () => {
      expect(allowed).toContain(inferGroup(p, name));
    });
  }
  it("classifies the same way when the name is useless", () => {
    // The composition rules carry foods the keyword lists cannot name. Fruit
    // juice is the known exception: with no fibre it is not separable from
    // sugar water by composition, so it needs its name.
    const nameless = FOODS.filter(([n]) => n !== "Orange juice");
    const wrong = nameless.filter(([, p, allowed]) => !allowed.includes(inferGroup(p, "product 12345")));
    expect(wrong.map(([n]) => n)).toEqual([]);
  });
});

describe("a sugary food decomposes into carbohydrate plus its fat", () => {
  it("chocolate and cake yield a carbohydrate group and fat exchanges", () => {
    for (const name of ["Milk chocolate", "Sponge cake"]) {
      const [, p] = FOODS.find(([n]) => n === name);
      const d = decompose(p, 15, inferGroup(p, name), true);
      expect(d.rounded.some((o) => o.ref.cho > 0)).toBe(true);
      expect(d.rounded.some((o) => o.label === "Fat")).toBe(true);
    }
  });
  it("a fat-free sugary food yields carbohydrate and nothing else", () => {
    const [, p] = FOODS.find(([n]) => n === "Table sugar");
    const d = decompose(p, 15, inferGroup(p, "Table sugar"), true);
    expect(d.rounded.every((o) => o.ref.cho > 0)).toBe(true);
  });
});

describe("a flavour word in a name is not the food", () => {
  // Fruit and dairy words turn up constantly as flavours. Reading them as the
  // food puts pie, bread and lemonade on the fruit list, which is the single
  // easiest way for this app to mislead someone.
  const cases = [
    ["Apple pie",            { cho: 34, pro: 3, fat: 11, fibre: 1.4, sugars: 15 },   "starch"],
    ["Apple crumble",        { cho: 40, pro: 3, fat: 12, fibre: 2, sugars: 22 },     "starch"],
    ["Banana bread",         { cho: 48, pro: 6, fat: 15, fibre: 2, sugars: 28 },     "starch"],
    ["Raspberry cheesecake", { cho: 30, pro: 5, fat: 22, fibre: 1, sugars: 22 },     "starch"],
    ["Lemonade",             { cho: 10, pro: 0, fat: 0, fibre: 0, sugars: 10 },      "starch"],
    ["Cherry cola",          { cho: 11, pro: 0, fat: 0, fibre: 0, sugars: 11 },      "starch"],
    ["Fruit squash",         { cho: 10, pro: 0, fat: 0, fibre: 0, sugars: 10 },      "starch"],
    ["Strawberry yoghurt",   { cho: 14, pro: 3.5, fat: 2.8, fibre: 0.3, sugars: 14 },"milk"],
    ["Banana milkshake",     { cho: 12, pro: 3.2, fat: 2.5, fibre: 0.2, sugars: 11 },"milk"],
    ["Milk chocolate",       { cho: 59, pro: 7.6, fat: 30, fibre: 3.4, sugars: 52 }, "starch"],
  ];
  for (const [name, p, want] of cases) {
    it(`${name} -> ${want}`, () => expect(inferGroup(p, name)).toBe(want));
  }
});

describe("a name is still trusted when the composition is silent", () => {
  // A blank field is unknown, not zero. Someone entering only carbohydrate,
  // protein and fat for a banana must still get fruit.
  it("fruit entered without fibre or sugars is still fruit", () => {
    expect(inferGroup({ cho: 23, pro: 1.1, fat: 0.3 }, "Ripe banana")).toBe("fruit");
    expect(inferGroup({ cho: 12, pro: 0.9, fat: 0.1 }, "Ripe pear")).toBe("fruit");
    expect(inferGroup({ cho: 66, pro: 3.1, fat: 0.5 }, "Dadels")).toBe("fruit");
  });
  it("a declared absence of fibre does rule fruit out, but juice is exempt", () => {
    expect(inferGroup({ cho: 10, pro: 0.5, fat: 0, fibre: 0, sugars: 10 }, "Lemon drink")).not.toBe("fruit");
    expect(inferGroup({ cho: 10, pro: 0.7, fat: 0.2, fibre: 0.2, sugars: 8 }, "Orange juice")).toBe("fruit");
  });
});
