// Interface text in English and Greek.

export const LANGS = [
  { id: "en", label: "en" },
  { id: "el", label: "ελ" },
];

const en = {
  understood: "Understood",
  notice:
    "CarbX converts foods that are not on the printed exchange lists into exchange " +
    "groups, for people managing their own diet and for the dietitians working with " +
    "them. It is not a medical device, it does not calculate insulin doses, and it does " +
    "not replace assessment by a dietitian. Check the parsed values against the pack.",

  source: "Source",
  manual: "Manual",
  text: "Text",
  photo: "Photo",
  database: "Database",
  dbPicker: "Database",

  declaration: "Nutrition declaration",
  readLabel: "Read label",
  reading: "Reading…",
  parsedLocally:
    "Parsed locally, in English, Dutch, German, French and Greek. Values come only from your text, never inferred.",
  photoPanel: "Photo of the nutrition panel",
  ocrLanguage: "OCR language",
  ocrAuto: "Auto (all supported)",
  langEnglish: "English",
  langDutch: "Dutch",
  langGerman: "German",
  langFrench: "French",
  langGreek: "Greek",
  ocrBusy: "Reading the panel on-device… (first run downloads OCR language data)",
  ocrHint: "Include the ingredients list for the additive scan. OCR accuracy varies, check the figures.",

  dbWorld: "World",
  dbNetherlands: "Netherlands",
  dbGreece: "Greece",
  dbBelgium: "Belgium",
  dbGermany: "Germany",
  dbFrance: "France",
  productOrBarcode: "Product or barcode",
  productPlaceholder: "wholemeal bread",
  search: "Search",
  searching: "Searching…",
  nothingMatched: "Nothing matched.",

  food: "Food",
  foodPlaceholder: "description",
  per100: "Per 100 g or 100 mL, straight off the pack.",
  carbsG: "Carbs g",
  proteinG: "Protein g",
  fatG: "Fat g",
  fibreG: "Fibre g",
  sugarsG: "Sugars g",
  satFatG: "Sat fat g",
  saltG: "Salt g",
  calories: "Calories",
  potassiumMg: "Potassium mg",
  phosphorusMg: "Phosphorus mg",
  ingredients: "Ingredients list",
  ingredientsPlaceholder: "paste for the additive scan",
  clear: "Clear",

  basis: "Basis",
  portionG: "Portion g",
  carbsPerExchange: "Carbs per exchange",
  unit15: "15 g (US)",
  unit10: "10 g (NL)",
  foodGroup: "Food group",
  foodGroupHelpLabel: "What food group means",
  foodGroupHelp:
    "Which group the carbohydrate is counted from: starch, fruit, milk, vegetables or sweets. " +
    "Auto picks the group from the figures and the name. Οverride if you disagree.",
  auto: "Auto",
  kidneyDiet: "Kidney diet",
  kidneyHelpLabel: "What kidney diet adds",
  kidneyHelp:
    "Adds potassium and phosphorus to the figures, and scans the ingredients for phosphate " +
    "and potassium additives. Off by default. ",
  proteinTiers: "Protein list has fat tiers",
  proteinTiersHelpLabel: "What protein fat tiers means",
  proteinTiersHelp:
    "On for a list that separates lean, medium-fat and high-fat protein. Off for a single protein " +
    "category. This changes the names only, the figures stay the same either way.",
  moreOptions: "More options",
  fewerOptions: "Fewer options",
  moreHint: "The rest of the label, the food group, and the exchange convention.",

  view: "View",
  simple: "Simple",
  detail: "Detail",
  viewHint: "Simple gives the exchanges and anything flagged. Detail adds every value behind those flags and the ingredient scan.",

  exchangesTitle: "Exchanges",
  detailTitle: "Detail",
  emptySimple: "Enter a food to see how many exchanges the portion holds, and anything worth knowing about it.",
  emptyDetail:
    "Enter a food to see every value behind its flags. Paste an ingredients list too, it also scans for phosphate and potassium additives.",
  unnamedFood: "Unnamed food",
  enteredByHand: "entered by hand",
  transcribed: "transcribed, check against pack",
  viaName: "by name",
  viaFigures: "by figures",
  viaDefault: "no match",
  viaSet: "you set",
  countedAs: "Counted as",
  setByHand: "set by hand. Left to itself it would have read",
  because: "because",
  setYourself: "Set the group yourself on the left if that is wrong.",

  result: "Result",
  freeFood: "under half an exchange, counts as free",
  exchange: "exchange",
  exchanges: "exchanges",
  gEach: "g each",
  portionStamp: "g portion",
  perExchangeStamp: "g carbs per exchange",

  perPortion: "Per portion",
  sodium: "Sodium",
  sodiumSub: "salt · daily ceiling 2000 mg",
  sugars: "Sugars",
  sugarsSub: "total, not free sugars",
  fibre: "Fibre",
  fibreSub: "per 1000 calories, aim for 14 or more",
  notStated: "not stated, treat as unknown",
  saturatedFat: "Saturated fat",
  potassium: "Potassium",
  potassiumSub: "on a kidney diet: under 100 mg is low, 100 to 200 medium, above 200 high",
  phosphorus: "Phosphorus",
  phosphorusNotStated: "not mandatory in the EU or US, see additive scan below",
  phosphorusSub: "mg for every g of protein, aim below 12",

  driftTitle: "Counts are rough for this portion",
  driftCarb:
    "Rounding to half exchanges has cost more than a tenth of the energy. For a food eaten in quantity, count it in grams of carbohydrate instead.",
  driftOther:
    "Rounding to half exchanges has cost more than a tenth of the energy. This portion carries almost no carbohydrate, so it is the protein and fat that round badly. Half an exchange is a coarse unit on a portion this small.",

  ingredientScan: "Ingredient scan",
  noIngredientsRenal: "No ingredients list entered. Paste one on the left to scan for phosphate, potassium, sodium and added-sugar sources.",
  noIngredients: "No ingredients list entered. Paste one on the left to scan for sodium and added-sugar sources.",
  nothingFlagged: "Nothing flagged",
  nothingMatchedRenal:
    "No phosphate, potassium, sodium or added-sugar terms matched. The scan reads text, so an unlisted or differently-worded additive will be missed.",
  nothingMatchedScan:
    "No sodium or added-sugar terms matched. The scan reads text, so an unlisted or differently-worded additive will be missed.",
  nothingFlaggedPortion: "Nothing flagged in this portion.",
  phosNote:
    "Additive phosphorus is absorbed close to completely, against roughly 40-60% for the phytate-bound phosphorus in plant foods. This product therefore carries more absorbable load than any composition table would show. In CKD, clearing additive sources usually gains more than restricting whole foods.",
  potNote:
    "Typical of reduced-sodium products: potassium chloride replaces salt, which helps blood pressure but works against a potassium restriction.",

  provenance: "Every figure here comes from what you entered. Nothing is estimated.",
  howWorkedOut: "How this is worked out",
  checkBeforeUse: "Check before use.",

  // flag sentences, {n} filled in by the caller
  flagSaltHigh: "High in salt, {n} mg sodium in this portion.",
  flagSalty: "Salty, {n} mg sodium in this portion.",
  flagSugar: "{n} g sugar in this portion.",
  flagSatFat: "{n} g saturated fat in this portion.",
  flagFibre: "Low in fibre, {n} g against {c} g of carbohydrate in this portion.",
  flagPotassium: "High in potassium, {n} mg in this portion.",
  flagPhosphorus: "High in phosphorus for the protein it carries, {n} mg in this portion.",

  // food groups
  g_starch: "Starch",
  g_fruit: "Fruit",
  g_milk: "Milk",
  g_veg: "Non-starchy veg",
  g_sweet: "Sweets and other carbs",
  "g_protein-only": "Protein only",
  "g_fat-only": "Fat only",
  g_lean: "Lean protein",
  g_medium: "Medium-fat protein",
  g_high: "High-fat protein",
  g_protein: "Protein",
  g_fat: "Fat",
  g_milkFatFree: "Fat-free milk",
  g_milkReduced: "Reduced-fat milk",
  g_milkWhole: "Whole milk",

  // additive scan categories
  s_phos: "Phosphate additives",
  s_pot: "Potassium additives",
  s_sug: "Added sugar sources",
  s_na: "Sodium-bearing additives",

  // why a food was counted where it was
  r_plantDairyCarb: "it is a plant-based food; the US exchange list relies on its carbohydrates rather than its milk-resembling characteristics.",
  r_plantDairyProtein: "it is a plant-based food carrying protein and almost no carbohydrate, so it counts as protein rather than as a milk exchange",
  r_nameFat: "the name matched the fat list and the macros agree",
  r_nameDairy: "the name matched the dairy list and the protein stands in a milk-like ratio to the carbohydrate",
  r_nameProtein: "the name matched the protein list",
  r_nameProteinStarchy: "the name matched the protein list, but the food carries a starch exchange as well",
  r_nameFruit: "the name matched the fruit list and nothing in the macros contradicts it",
  r_nameVeg: "the name matched the vegetable list and the carbohydrate is low enough for one",
  r_nameSweet: "the name matched the sweets list and the food carries carbohydrate",
  r_nameStarch: "the name matched the starch list and the food carries carbohydrate",
  r_macroFatDominant: "over 70% of the energy is fat, with little carbohydrate or protein",
  r_macroFatNoProtein: "the energy is almost all fat, without any protein and little carbohydrates",
  r_macroMilk: "sugar carbohydrate with no fibre, carrying protein in a milk-like ratio",
  r_macroSweet: "the carbohydrate is almost entirely sugar, with no protein, fat or fibre alongside it",
  r_macroProteinShare: "over 40% of the energy is protein, with under 5 g of carbohydrate",
  r_macroProteinLowCarb: "almost no carbohydrate, with protein present",
  r_macroVeg: "little carbohydrate with vegetable-like protein alongside it",
  r_macroFruit: "mostly-sugar carbohydrate with some fibre and almost no protein or fat",
  r_noMatch: "neither the name nor the composition matched a group, so it falls to starch",
};

const el = {
  understood: "Το κατάλαβα",
  notice:
    "Το CarbX μετατρέπει τρόφιμα που δεν υπάρχουν στους πίνακες ισοδυνάμων σε " +
    "ισοδύναμα, για όσους διαχειρίζονται την διατροφή τους και για διαιτολόγους." +
    "Δεν είναι ιατροτεχνολογικό προϊόν, δεν υπολογίζει δόσεις ινσουλίνης" +
    "δεν αντικαθιστά την εκτίμηση από διαιτολόγο. Ελέγξτε τις τιμές που " +
    "αναγνωρίστηκαν με τη συσκευασία.",

  source: "Πηγή",
  manual: "Χειροκίνητα",
  text: "Κείμενο",
  photo: "Φωτογραφία",
  database: "Εύρεση",
  dbPicker: "Βάση δεδομένων",

  declaration: "Διατροφική δήλωση, όπως είναι τυπωμένη",
  readLabel: "Ανάγνωση ετικέτας",
  reading: "Ανάγνωση…",
  parsedLocally:
    "Η ανάλυση γίνεται τοπικά, σε Αγγλικά, Ολλανδικά, Γερμανικά, Γαλλικά και Ελληνικά. Οι τιμές των μακροθρεπτικών προκύπτουν μόνο από το κείμενό σας.",
  photoPanel: "Φωτογραφία του πίνακα διατροφικής σύστασης",
  ocrLanguage: "Γλώσσα OCR",
  ocrAuto: "Αυτόματα (όλες)",
  langEnglish: "Αγγλικά",
  langDutch: "Ολλανδικά",
  langGerman: "Γερμανικά",
  langFrench: "Γαλλικά",
  langGreek: "Ελληνικά",
  ocrBusy: "Ανάγνωση του πίνακα στη συσκευή… (την πρώτη φορά κατεβαίνουν τα γλωσσικά δεδομένα)",
  ocrHint: "Συμπεριλάβετε τη λίστα συστατικών για τον έλεγχο προσθέτων. Η ακρίβεια του OCR ποικίλλει, ελέγξτε τις διαβασμένες τιμές.",

  dbWorld: "Παγκόσμια",
  dbNetherlands: "Ολλανδία",
  dbGreece: "Ελλάδα",
  dbBelgium: "Βέλγιο",
  dbGermany: "Γερμανία",
  dbFrance: "Γαλλία",
  productOrBarcode: "Προϊόν ή barcode",
  productPlaceholder: "ψωμί ολικής",
  search: "Αναζήτηση",
  searching: "Αναζήτηση…",
  nothingMatched: "Κανένα αποτέλεσμα.",

  food: "Τρόφιμο",
  foodPlaceholder: "περιγραφή",
  per100: "Ανά 100 g ή 100 mL, όπως αναγράφεται στη συσκευασία.",
  carbsG: "Υδατάνθρακες g",
  proteinG: "Πρωτεΐνη g",
  fatG: "Λιπαρά g",
  fibreG: "Φυτικές ίνες g",
  sugarsG: "Σάκχαρα g",
  satFatG: "Κορεσμένα g",
  saltG: "Αλάτι g",
  calories: "Θερμίδες",
  potassiumMg: "Κάλιο mg",
  phosphorusMg: "Φώσφορος mg",
  ingredients: "Λίστα συστατικών",
  ingredientsPlaceholder: "επικολλήστε για τον έλεγχο προσθέτων",
  clear: "Καθαρισμός",

  basis: "Βάση υπολογισμού",
  portionG: "Μερίδα g",
  carbsPerExchange: "Υδατάνθρακες ανά ισοδύναμο",
  unit15: "15 g (ΗΠΑ)",
  unit10: "10 g (Ολλανδία)",
  foodGroup: "Ομάδα τροφίμων",
  foodGroupHelpLabel: "Τι σημαίνει ομάδα τροφίμων",
  foodGroupHelp:
    "Από ποια ομάδα μετρώνται οι υδατάνθρακες: αμυλούχα, φρούτα, γαλακτοκομικά, λαχανικά ή γλυκά. " +
    "Το Αυτόματα επιλέγει την ομάδα από τις τιμές και το όνομα. Ορίστε την μόνοι σας αν διαφωνείτε.",
  auto: "Αυτόματα",
  kidneyDiet: "Δίαιτα νεφροπαθών",
  kidneyHelpLabel: "Τι προστίθεται στη δίαιτα νεφροπαθών",
  kidneyHelp:
    "Προστίθεται το κάλιο και ο φώσφορος στις τιμές και ελέγχει τα συστατικά για πρόσθετα " +
    "φωσφορικών και καλίου. Ανενεργό εξ ορισμού. Το νάτριο και τα πρόσθετα σάκχαρα ελέγχονται πάντα.",
  proteinTiers: "Η λίστα πρωτεΐνης έχει κατηγορίες λιπαρών",
  proteinTiersHelpLabel: "Τι σημαίνουν οι κατηγορίες λιπαρών",
  proteinTiersHelp:
    "Ενεργό για λίστα που ξεχωρίζει άπαχη, μέτρια και υψηλή σε λιπαρά πρωτεΐνη." +
    "Αλλάζει μόνο τις ονομασίες, οι τιμές παραμένουν ίδιες.",
  moreOptions: "Περισσότερες επιλογές",
  fewerOptions: "Λιγότερες επιλογές",
  moreHint: "Η υπόλοιπη ετικέτα, η ομάδα τροφίμων και τα ισοδύναμα.",

  view: "Προβολή",
  simple: "Απλή",
  detail: "Αναλυτική",
  viewHint: "Η Απλή δείχνει τα ισοδύναμα και τυχόν επισημάνσεις. Η Αναλυτική προσθέτει κάθε τιμή πίσω από τις επισημάνσεις και τον έλεγχο συστατικών.",

  exchangesTitle: "Ισοδύναμα",
  detailTitle: "Αναλυτικά",
  emptySimple: "Εισαγάγετε ένα τρόφιμο για να δείτε πόσα ισοδύναμα έχει η μερίδα, και ό,τι αξίζει να ξέρετε γι' αυτό.",
  emptyDetail:
    "Εισαγάγετε ένα τρόφιμο για να δείτε κάθε τιμή πίσω από τις επισημάνσεις. Αν επικολλήσετε και τη λίστα συστατικών, ελέγχεται και για πρόσθετα φωσφορικών και καλίου.",
  unnamedFood: "Τρόφιμο χωρίς όνομα",
  enteredByHand: "καταχωρήθηκε χειροκίνητα",
  transcribed: "μεταγράφηκε, ελέγξτε με τη συσκευασία",
  viaName: "από το όνομα",
  viaFigures: "από τις τιμές",
  viaDefault: "καμία αντιστοίχιση",
  viaSet: "το ορίσατε",
  countedAs: "Μετρήθηκε ως",
  setByHand: "ορίστηκε χειροκίνητα. Από μόνο του θα το διάβαζε ως",
  because: "επειδή",
  setYourself: "Ορίστε την ομάδα μόνοι σας αριστερά αν αυτό είναι λάθος.",

  result: "Αποτέλεσμα",
  freeFood: "λιγότερο από μισό ισοδύναμο, μετράει ως ελεύθερο",
  exchange: "ισοδύναμο",
  exchanges: "ισοδύναμα",
  gEach: "g το καθένα",
  portionStamp: "g μερίδα",
  perExchangeStamp: "g υδατάνθρακες ανά ισοδύναμο",

  perPortion: "Ανά μερίδα",
  sodium: "Νάτριο",
  sodiumSub: "αλάτι, ημερήσιο όριο 2000 mg",
  sugars: "Σάκχαρα",
  sugarsSub: "συνολικά, όχι ελεύθερα σάκχαρα",
  fibre: "Φυτικές ίνες",
  fibreSub: "στόχος 14+ ανά 1000 θερμίδες",
  notStated: "δεν αναγράφεται/ άγνωστο",
  saturatedFat: "Κορεσμένα λιπαρά",
  potassium: "Κάλιο",
  potassiumSub: "σε δίαιτα νεφροπαθούς: κάτω από 100 mg χαμηλό, 100 έως 200 μέτριο, πάνω από 200 υψηλό",
  phosphorus: "Φώσφορος",
  phosphorusNotStated: "δεν είναι υποχρεωτικός στην ΕΕ/ΗΠΑ, δείτε τον έλεγχο προσθέτων παρακάτω",
  phosphorusSub: "mg ανά g πρωτεΐνης, στόχος κάτω από 12",

  driftTitle: "Οι μετρήσεις είναι κατά προσέγγιση για αυτή τη μερίδα",
  driftCarb:
    "Η στρογγυλοποίηση σε μισά ισοδύναμα μετέβαλε πάνω από το ένα δέκατο της ενέργειας. Αν το τρόφιμο καταναλώνεται σε μεγάλη ποσότητα, μετρήστε το σε γραμμάρια υδατανθράκων.",
  driftOther:
    "Η στρογγυλοποίηση σε μισά ισοδύναμα μετέβαλε πάνω από το ένα δέκατο της ενέργειας. Αυτή η μερίδα έχει ελάχιστους υδατάνθρακες, οπότε η απόκλιση είναι στην πρωτεΐνη και στα λιπαρά. Το μισό ισοδύναμο είναι μια εκτίμηση για τόσο μικρή μερίδα.",

  ingredientScan: "Έλεγχος συστατικών",
  noIngredientsRenal: "Δεν καταχωρήθηκε λίστα συστατικών. Επικολλήστε μία για έλεγχο για φωσφορικά, κάλιο, νάτριο και πρόσθετα σάκχαρα.",
  noIngredients: "Δεν καταχωρήθηκε λίστα συστατικών. Επικολλήστε μία για έλεγχο για νάτριο και πρόσθετα σάκχαρα.",
  nothingFlagged: "Καμία επισήμανση",
  nothingMatchedRenal:
    "Δεν βρέθηκαν όροι για φωσφορικά, κάλιο, νάτριο ή πρόσθετα σάκχαρα. Ο έλεγχος διαβάζει κείμενο, οπότε πρόσθετο εκτός λίστας ή με άλλη διατύπωση δεν θα εντοπιστεί.",
  nothingMatchedScan:
    "Δεν βρέθηκαν όροι για νάτριο ή πρόσθετα σάκχαρα. Ο έλεγχος διαβάζει κείμενο, οπότε πρόσθετο εκτός λίστας ή με άλλη διατύπωση δεν θα εντοπιστεί.",
  nothingFlaggedPortion: "Καμία επισήμανση σε αυτή τη μερίδα.",
  phosNote:
    "Ο φώσφορος από πρόσθετα απορροφάται σχεδόν πλήρως, έναντι περίπου 40-60% για τον δεσμευμένο σε φυτικά οξέα φώσφορο των φυτικών τροφίμων. Το προϊόν, επομένως, φέρει μεγαλύτερο απορροφήσιμο φορτίο από όσο δείχνει ο πίνακας σύστασης.",
  potNote:
    "Τυπικό των προϊόντων μειωμένου νατρίου: το χλωριούχο κάλιο αντικαθιστά το αλάτι, κάτι που βοηθά την αρτηριακή πίεση αλλά λειτουργεί αντίθετα σε περιορισμό καλίου.",

  provenance: "Κάθε τιμή εδώ προέρχεται από όσα καταχωρήσατε. Τίποτα δεν υπολογίζεται κατ' εκτίμηση.",
  howWorkedOut: "Πώς γίνεται ο υπολογισμός",
  checkBeforeUse: "Ελέγξτε πριν τη χρήση.",

  flagSaltHigh: "Υψηλό σε αλάτι, {n} mg νατρίου σε αυτή τη μερίδα.",
  flagSalty: "Υψηλό σε αλάτι, {n} mg νατρίου σε αυτή τη μερίδα.",
  flagSugar: "{n} g σάκχαρα σε αυτή τη μερίδα.",
  flagSatFat: "{n} g κορεσμένα λιπαρά σε αυτή τη μερίδα.",
  flagPotassium: "Υψηλό σε κάλιο, {n} mg σε αυτή τη μερίδα.",
  flagPhosphorus: "Υψηλό σε φώσφορο για την πρωτεΐνη που φέρει, {n} mg σε αυτή τη μερίδα.",

  g_starch: "Άμυλο",
  g_fruit: "Φρούτα",
  g_milk: "Γάλα",
  g_veg: "Λαχανικά",
  g_sweet: "Γλυκά και άλλοι υδατάνθρακες",
  "g_protein-only": "Πρωτεΐνη",
  "g_fat-only": "Λιπαρά",
  g_lean: "Άπαχη πρωτεΐνη",
  g_medium: "Πρωτεΐνη μέτριου λίπους",
  g_high: "Πρωτεΐνη υψηλού λίπους",
  g_protein: "Πρωτεΐνη",
  g_fat: "Λιπαρά",
  g_milkFatFree: "Γάλα αποβουτυρομένο",
  g_milkReduced: "Γάλα μειωμένων λιπαρών",
  g_milkWhole: "Πλήρες γάλα",

  s_phos: "Πρόσθετα φωσφορικών",
  s_pot: "Πρόσθετα καλίου",
  s_sug: "Πηγές πρόσθετων σακχάρων",
  s_na: "Πρόσθετα που φέρουν νάτριο",

  r_plantDairyCarb: "φυτικό προϊόν, ο πίνακας ισοδυνάμων λόγω της υψηλής περιεκτικότητας σε υδατάνθρακες το σύστημα των ισοδυνάμων των ΗΠΑ δεν το κατατάσει στην ομάδα των γαλακτοκομικών.",
  r_plantDairyProtein: "είναι φυτικό προϊόν με πρωτεΐνη και ελάχιστους υδατάνθρακες, οπότε μετράει ως πρωτεΐνη και όχι ως ισοδύναμο γάλακτος",
  r_nameFat: "το όνομα εντοπίστηκε στη λίστα λιπαρών και τα μακροθρεπτικά συνάδουν",
  r_nameDairy: "το όνομα εντοπίστηκε στη λίστα γαλακτοκομικών και η πρωτεΐνη είναι σε αναλογία γάλακτος προς τους υδατάνθρακες",
  r_nameProtein: "το όνομα εντοπίστηκε στη λίστα πρωτεΐνης",
  r_nameProteinStarchy: "το όνομα εντοπίστηκε στη λίστα πρωτεΐνης, αλλά το τρόφιμο φέρει ένα ισοδύναμο αμύλου σε υδατάνθρακες",
  r_nameFruit: "το όνομα εντοπίστηκε στη λίστα φρούτων και κανένα μακροθρεπτικό δεν το διαψεύδει",
  r_nameVeg: "το όνομα εντοπίστηκε στη λίστα λαχανικών και οι υδατάνθρακες είναι αρκετά χαμηλοί",
  r_nameSweet: "το όνομα εντοπίστηκε στη λίστα γλυκών και το τρόφιμο φέρει υδατάνθρακες",
  r_nameStarch: "το όνομα εντοπίστηκε στη λίστα αμύλου και το τρόφιμο φέρει υδατάνθρακες",
  r_macroFatDominant: "πάνω από το 70% της ενέργειας είναι λιπαρά, με λίγους υδατάνθρακες ή πρωτεΐνη",
  r_macroFatNoProtein: "η ενέργεια είναι σχεδόν αποκλειστικά λιπαρά, χωρίς αξιόλογη πρωτεΐνη και με λίγους υδατάνθρακες",
  r_macroMilk: "υδατάνθρακες από σάκχαρα χωρίς φυτικές ίνες, με πρωτεΐνη σε αναλογία γάλακτος",
  r_macroSweet: "οι υδατάνθρακες είναι σχεδόν αποκλειστικά σάκχαρα, χωρίς πρωτεΐνη, λιπαρά ή φυτικές ίνες",
  r_macroProteinShare: "πάνω από το 40% της ενέργειας είναι πρωτεΐνη, με κάτω από 5 g υδατάνθρακες",
  r_macroProteinLowCarb: "σχεδόν καθόλου υδατάνθρακες, με παρουσία πρωτεΐνης",
  r_macroVeg: "λίγοι υδατάνθρακες με πρωτεΐνη σε αναλογία λαχανικού",
  r_macroFruit: "υδατάνθρακες κυρίως από σάκχαρα, με λίγες φυτικές ίνες και σχεδόν καθόλου πρωτεΐνη ή λιπαρά",
  r_noMatch: "δεν εντοπίστηκε ούτε το όνομα ούτε η σύσταση σε κάποια ομάδα, οπότε πηγαίνει στο άμυλο",
};

export const STRINGS = { en, el };

// Fills {n}-style placeholders. Missing keys throw in development rather than
// rendering "undefined" into the interface.
export function translator(lang) {
  const dict = STRINGS[lang] || STRINGS.en;
  return (key, vars) => {
    const s = dict[key];
    if (s === undefined) return STRINGS.en[key] ?? key;
    return vars ? s.replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? "") : s;
  };
}
