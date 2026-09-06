import { describe, it, expect } from "vitest";
import { inferGroup } from "./exchange.js";

// Real foods from the Greek composition table George works from, each with the
// exchange group the EDE list assigns it. The point of the fixture is the
// keyword lists: it catches a keyword that classifies a food against its own
// composition, and a composition rule that overrules a name it should not.
//
// The source table carries no sugars column, so the sugar-fraction tests
// inside inferGroup() never fire here. That is deliberate: it leaves the names
// and the macro ratios doing the work, which is what these lists are for.

const FOODS = [
  ["Αγγούρι", { cho: 2.6, pro: 0.8, fat: 0.1, fibre: 0.4 }, "veg"],
  ["Αλεύρι για όλες τις χρήσεις", { cho: 72.3, pro: 10.3, fat: 0.7, fibre: 3.2 }, "starch"],
  ["Αλεύρι μαλακό", { cho: 72.4, pro: 12.4, fat: 0.8, fibre: 2.7 }, "starch"],
  ["Αλεύρι σκληρό", { cho: 70.6, pro: 12.8, fat: 1.3, fibre: null }, "starch"],
  ["Αλεύρι, σίτου, μείγμα άσπρου και ολικής αλέσεως", { cho: 71.5, pro: 10.7, fat: 1.2, fibre: 4.6 }, "starch"],
  ["Αμύγδαλα, βρασμένα, ξεφλουδισμένα", { cho: 8.8, pro: 19.3, fat: 46.6, fibre: 4.6 }, "fat-only"],
  ["Άνηθος, φρέσκος", { cho: 5.3, pro: 3.2, fat: 0.4, fibre: 1.1 }, "veg"],
  ["Αυγό", { cho: 1.9, pro: 11.5, fat: 11.1, fibre: 0.0 }, "protein-only"],
  ["Γάλα, αγεδαδινό, πλήρες", { cho: 4.8, pro: 3.2, fat: 3.4, fibre: 0.0 }, "milk"],
  ["Γάλα, πρόβειο, πλήρες, μη παστεριωμένο", { cho: 5.5, pro: 5.5, fat: 6.0, fibre: 0.0 }, "milk"],
  ["Γάλα, σκόνη, αποβουτυρωμένο", { cho: 52.6, pro: 35.2, fat: 1.4, fibre: 0.0 }, "milk"],
  ["Γάλα, σκόνη, πλήρες", { cho: 37.7, pro: 28.3, fat: 23.3, fibre: 0.0 }, "milk"],
  ["Γιαούρτι, αγελαδινό, πλήρες, στραγγιστό", { cho: 7.4, pro: 6.7, fat: 6.7, fibre: 0.0 }, "milk"],
  ["Γιαούρτι, πρόβειο, πλήρες (κεσές)", { cho: 5.3, pro: 6.2, fat: 6.5, fibre: 0.0 }, "milk"],
  ["Γιαούρτι, πρόβειο, πλήρες, σακκούλας", { cho: 4.9, pro: 10.4, fat: 13.3, fibre: 0.0 }, "milk"],
  ["Ελιές θρούμπες, με κουκούτσι", { cho: 11.6, pro: 1.7, fat: 29.6, fibre: 3.5 }, "fat-only"],
  ["Ελιές, Καλαμών, σε άλμη, με κουκούτσια", { cho: 3.7, pro: 1.4, fat: 21.9, fibre: 1.3 }, "fat-only"],
  ["Ελιές, μαύρες, σε άλμη, με κουκούτσια", { cho: 4.7, pro: 1.2, fat: 19.0, fibre: 1.4 }, "fat-only"],
  ["Ελιές, πράσινες, σε άλμη, με κουκούτσια", { cho: 3.9, pro: 1.2, fat: 14.4, fibre: 1.8 }, "fat-only"],
  ["Κολοκυθάκια", { cho: 3.3, pro: 2.1, fat: 0.2, fibre: 0.6 }, "veg"],
  ["Κολοκυθάκια τηγανιτά", { cho: 18.0, pro: 4.4, fat: 17.8, fibre: 1.6 }, "starch"],
  ["Κρεμμυδάκι φρέσκο", { cho: 6.4, pro: 1.6, fat: 0.2, fibre: 1.1 }, "veg"],
  ["Λάπαθο (άγριο χόρτο)", { cho: 4.2, pro: 2.8, fat: 0.2, fibre: 1.9 }, "veg"],
  ["Μαϊντανός, φρέσκος", { cho: 8.5, pro: 3.1, fat: 0.4, fibre: 1.8 }, "veg"],
  ["Μέλι", { cho: 84.5, pro: 1.8, fat: 0.0, fibre: 0.0 }, "starch"],
  ["Μελιτζάνες, πιπεριές και κολοκυθάκια στο φούρνο", { cho: 9.6, pro: 3.2, fat: 10.4, fibre: 0.9 }, "veg"],
  ["Μελιτζανοσαλάτα", { cho: 10.4, pro: 3.3, fat: 10.7, fibre: 0.9 }, "veg"],
  ["Μυζήθρα, φρέσκια, ανάλατη", { cho: 4.8, pro: 10.0, fat: 18.4, fibre: 0.0 }, "protein-only"],
  ["Νισεστές", { cho: 86.1, pro: 1.3, fat: 0.2, fibre: 0.9 }, "starch"],
  ["Ξυνομυζήθρα Σίφνου", { cho: 5.3, pro: 11.2, fat: 15.3, fibre: 0.0 }, "protein-only"],
  ["Παπαρούνα ή κουτσουνάδα (άγριο χόρτο)", { cho: 3.8, pro: 2.3, fat: 0.3, fibre: 1.8 }, "veg"],
  ["Παστέλι τραγανό", { cho: 42.1, pro: 11.1, fat: 33.4, fibre: 6.8 }, "starch"],
  ["Πιπεριά κόκκινη", { cho: 6.7, pro: 1.0, fat: 0.1, fibre: 0.8 }, "veg"],
  ["Πιπεριά πράσινη", { cho: 5.1, pro: 1.1, fat: 0.1, fibre: 0.8 }, "veg"],
  ["Πράσο", { cho: 7.0, pro: 1.7, fat: 0.1, fibre: 2.2 }, "veg"],
  ["Ρεβίθια, αποφλοιωμένα", { cho: 55.4, pro: 18.8, fat: 6.4, fibre: 7.6 }, "starch"],
  ["Ρεβιθοκεφτέδες", { cho: 21.2, pro: 6.2, fat: 7.9, fibre: 2.4 }, "starch"],
  ["Ρύζι άσπρο", { cho: 77.0, pro: 5.6, fat: 0.5, fibre: 1.3 }, "starch"],
  ["Σέσκουλο (άγριο)", { cho: 4.6, pro: 2.9, fat: 0.1, fibre: 1.0 }, "veg"],
  ["Σησάμι άσπρο", { cho: 16.9, pro: 17.2, fat: 51.2, fibre: 8.0 }, "fat-only"],
  ["Σιμιγδάλι", { cho: 73.1, pro: 10.1, fat: 1.1, fibre: 3.3 }, "starch"],
  ["Σπανάκι", { cho: 4.3, pro: 2.9, fat: 0.4, fibre: 1.2 }, "veg"],
  ["Ταραμοσαλάτα", { cho: 15.5, pro: 6.2, fat: 18.2, fibre: 1.4 }, "starch"],
  ["Τζατζίκι", { cho: 4.4, pro: 8.2, fat: 17.9, fibre: 0.5 }, "milk"],
  ["Τομάτα κονκασέ", { cho: 11.1, pro: 1.1, fat: 0.4, fibre: 0.5 }, "veg"],
  ["Φασόλια, άσπρα, ξηρά", { cho: 37.8, pro: 21.4, fat: 1.8, fibre: null }, "starch"],
  ["Φασόλια, σούπα", { cho: 8.0, pro: 3.5, fat: 6.8, fibre: null }, "starch"],
  ["Φέτα", { cho: 6.7, pro: 17.2, fat: 21.4, fibre: 0.0 }, "protein-only"],
  ["Φρυγανιά, τριμμένη", { cho: 75.3, pro: 10.0, fat: 5.7, fibre: 3.2 }, "starch"],
  ["Χορτόπιτα (Χαλκιδικής)", { cho: 21.0, pro: 5.2, fat: 14.5, fibre: 2.6 }, "starch"],
  ["Χορτοπιτάκια τηγανιτά (Κρήτης)", { cho: 31.2, pro: 5.8, fat: 23.2, fibre: 3.8 }, "starch"],
  ["Χορτοτυρόπιτα (Ηπείρου)", { cho: 27.1, pro: 7.6, fat: 18.4, fibre: 2.0 }, "starch"],
  ["Ψωμάκι στρογγυλό, άσπρο", { cho: 57.4, pro: 9.1, fat: 2.5, fibre: 2.0 }, "starch"],
  ["Ψωμί, εφτάζυμο, παραδοσιακό", { cho: 54.8, pro: 8.0, fat: 3.4, fibre: 2.7 }, "starch"],
]; 

describe("inferGroup(): the Greek composition table", () => {
  for (const [name, macros, expected] of FOODS) {
    it(`${name} -> ${expected}`, () => {
      expect(inferGroup(macros, name)).toBe(expected);
    });
  }
});
