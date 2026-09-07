import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// The app ships its own typefaces so that it renders the same everywhere. That
// only holds if every rule reaches them through a token: one stray
// `font-family: sans-serif` and that element silently falls back to whatever
// the visitor's OS supplies, which is the exact failure the self-hosting was
// meant to remove. These tests fail on any font-family that is not a token
// reference, so a future edit cannot reintroduce one unnoticed.

const APP = readFileSync(new URL("../App.jsx", import.meta.url), "utf8");
const INDEX = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const FONTS = readFileSync(new URL("../fonts.css", import.meta.url), "utf8");

// The two places a literal stack is allowed: the token declarations themselves.
const TOKEN_DECL = /^\s*--(sans|mono|display|serif|lab-fam)\s*:/;

const declarations = (css) =>
  [...css.matchAll(/font-family\s*:\s*([^;}]+)/g)].map((m) => m[1].trim());

describe("typography is reached through tokens, never by name", () => {
  it("every font-family in App.jsx is a var() reference", () => {
    const literal = declarations(APP).filter((d) => !d.startsWith("var(--"));
    expect(literal).toEqual([]);
  });

  it("index.css names the stacks only in the token declarations", () => {
    const lines = INDEX.split("\n");
    const offenders = lines
      .map((l, i) => [i + 1, l])
      .filter(([, l]) => /font-family\s*:/.test(l) && !/var\(--/.test(l))
      .filter(([, l]) => !TOKEN_DECL.test(l));
    expect(offenders).toEqual([]);
  });

  it("declares both tokens on :root so the first paint is not a system font", () => {
    expect(INDEX).toMatch(/--sans\s*:\s*"Source Sans 3 Variable"/);
    expect(INDEX).toMatch(/--mono\s*:\s*"Source Code Pro"/);
    expect(INDEX).toMatch(/body\s*\{[^}]*font-family:\s*var\(--sans\)/s);
  });

  it("commits to a light colour scheme, so form controls are not painted dark", () => {
    expect(INDEX).toMatch(/color-scheme:\s*light\s*;/);
    expect(INDEX).not.toMatch(/color-scheme:\s*light dark/);
  });
});

describe("the shipped faces cover the languages the parser reads", () => {
  // English, Dutch, German and French need latin plus latin-ext; Greek needs
  // its own subset. A face declared without one of these means that language
  // falls back to a system font mid-sentence.
  const families = ["Source Sans 3 Variable", "Source Code Pro"];
  const GREEK = /U\+0370-0377/;
  const LATIN = /U\+0000-00FF/;
  const LATIN_EXT = /U\+0100-02BA/;

  const facesFor = (family) =>
    [...FONTS.matchAll(/@font-face\s*\{(.*?)\}/gs)]
      .map((m) => m[1])
      .filter((b) => b.includes(`font-family: "${family}"`));

  it.each(families)("%s ships latin, latin-ext and greek", (family) => {
    const faces = facesFor(family);
    expect(faces.length).toBeGreaterThan(0);
    for (const range of [LATIN, LATIN_EXT, GREEK]) {
      expect(faces.some((f) => range.test(f))).toBe(true);
    }
  });

  it.each(families)("%s is served from this repo, not a CDN", (family) => {
    for (const face of facesFor(family)) {
      expect(face).toMatch(/url\("\/fonts\//);
      expect(face).not.toMatch(/https?:/);
    }
  });

  it("every face swaps rather than blocking the first paint", () => {
    const faces = [...FONTS.matchAll(/@font-face\s*\{(.*?)\}/gs)].map((m) => m[1]);
    expect(faces.length).toBe(9);
    expect(faces.every((f) => /font-display:\s*swap/.test(f))).toBe(true);
  });
});
