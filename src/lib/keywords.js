// Food-name keywords for inferGroup(), one list per exchange group.
//
// Editing: add a word to the right list and it takes effect immediately, there
// is no build step. Write it lowercase. Matching is a plain substring of the
// lowercased food name, so a stem covers its inflections: "tomat" catches
// tomato, tomaten, tomate and tomates. Prefer the shortest stem that cannot
// appear inside an unrelated word.
//
// Two lists take a match mode for stems too short to be safe as substrings:
//   start  a regex fragment that must sit at the start of a word
//   end    a stem that must sit at the end of a word, for German compounds
//
// Groups follow the US exchange convention, which is what the app's group
// table implements:
//   fat      oils, spreads, nuts, seeds, olives, avocado, cream, bacon
//   milk     milk, yoghurt and the other drinkable or spoonable dairy
//   protein  meat, fish, shellfish, cheese, egg, soy protein
//   fruit    fruit and fruit juice
//   veg      non-starchy vegetables, green beans included
//   starch   bread, cereal, rice, pasta, legumes, and the starchy vegetables
//            (potato, corn, peas, winter squash), plus sweets and baked goods
//
// Sweets sit in the starch list on purpose. A diet plan is written in the
// groups a person actually counts, so chocolate resolves to starch exchanges
// with its fat falling out as fat exchanges, rather than into a "sweets"
// category nobody plans against. The sweet group stays available as a manual
// override in the interface.
//
// Sources: the Greek terms come from the EDE guide (Οδηγός διατροφής για τη
// ρύθμιση του διαβήτη, Ισοδύναμα τροφών, groups 1 to 6) and George's own
// exchange sheet. The German terms were checked against Open Food Facts
// category names (de.openfoodfacts.org/kategorien). English, Dutch and French
// follow the same group definitions; the Open Food Facts listings for those
// two languages refuse automated access, so they were not machine-checked.

export const KEYWORDS = {
  // ---------------------------------------------------------------- fat ---
  // Nuts, seeds and nut butters are fat in the US list and in the EDE list
  // (Ομάδα 6). They carry real protein, so the branch is gated on fat being
  // the dominant energy source rather than on protein being absent.
  fat: {
    any: [
      // English
      "butter", "margarine", "ghee", "lard", "suet", "shortening",
      "mayonnaise", "mayo", "dressing", "vinaigrette", "aioli",
      "avocado", "olive", "coconut cream", "creme fraiche",
      "cream cheese", "sour cream", "soured cream", "whipping cream",
      "double cream", "single cream", "clotted cream", "bacon", "pancetta",
      "tahini", "sesame", "almond", "cashew", "walnut", "pecan", "pistachio",
      "hazelnut", "macadamia", "brazil nut", "peanut", "pine nut", "nut butter",
      "sunflower seed", "pumpkin seed", "chia", "flaxseed", "linseed", "hemp seed",
      // Dutch
      "bakvet", "frituurvet", "braadvet", "smeltjus", "studentenhaver",
      "maanzaad", "hennepzaad", "chiazaad", "pijnboompit", "kokosvet",
      "arachideolie", "olijfolie", "zonnebloemolie", "raapolie",
      "koolzaadolie", "sesamolie", "notenolie", "kastanje", "paranoten",
      "pecannoten", "tapenade",
      "olie", "halvarine", "reuzel", "mayonaise", "slasaus",
      "roomkaas", "zure room", "slagroom", "kookroom", "spekjes", "spekblokjes",
      "tahin", "amandel", "walnoot", "hazelnoot", "pinda", "pindakaas",
      "cashewnoot", "pistache", "pecannoot", "paranoot",
      "zonnebloempit", "pompoenpit", "lijnzaad", "sesamzaad", "notenpasta",
      // German
      "kokosfett", "pflanzenöl", "rapsöl", "olivenöl", "sonnenblumenöl",
      "distelöl", "leinöl", "kürbiskernöl", "schlagsahne", "saure sahne",
      "süße sahne", "schmand", "streichfett", "kochfett", "nuss-nougat",
      "studentenfutter", "esskastanien", "mandeln", "nüsse",
      "butterschmalz", "schmalz", "speck", "sahne", "rahm",
      "frischkäse", "mandel", "walnuss", "haselnuss", "erdnuss", "cashewnuss",
      "pistazi", "pekannuss", "paranuss", "pinienkern", "sonnenblumenkern",
      "kürbiskern", "leinsamen", "sesamsamen", "nussmus", "nusscreme",
      // French
      "huile d'olive", "huile de colza", "huile de tournesol",
      "matière grasse", "crème fraîche", "crème entière", "beurre allégé",
      "graisse", "noix de coco", "noix de cajou", "noix de pécan",
      "noix du brésil", "graine de chia", "graine de sésame",
      "purée de noisette", "olives", "châtaigne", "chataigne",
      "huile", "beurre", "saindoux", "crème", "creme", "lardon",
      "avocat", "amande", "noisette", "cajou", "pécan", "arachide",
      "cacahuète", "cacahuete", "pignon de pin", "pignons de pin", "graine de tournesol",
      "graine de courge", "graine de lin", "sésame", "purée d'amande",
      // Greek
      "ελαιόλαδο", "ηλιέλαιο", "καλαμποκέλαιο", "σογιέλαιο", "φοινικέλαιο",
      "λάδι", "λαδιού", "έλαιο", "βούτυρο", "μαργαρίνη", "βιτάμ",
      "μαγιονέζα", "ντρέσινγκ", "αβοκάντο", "ελιά", "ελιές",
      "κρέμα γάλακτος", "μπέικον", "λαρδί", "ταχίνι", "σησάμ",
      "αμύγδαλ", "καρύδι", "καρύδια", "κάσιους", "φιστίκ", "φυστίκ",
      "φιστικοβούτυρο", "φυστικοβούτυρο", "κουκουνάρι", "πασατέμπο",
      "ηλιόσπορ", "λιναρόσπορ", "ξηροί καρποί", "πεκάν",
    ],
    // German compounds suffix the noun: Olivenöl, Rapsöl, Sonnenblumenöl.
    // A word end keeps Röllchen and similar out.
    // "oil" hides inside boiled, broiled and spoiled, so it counts at a word
    // end, where "olive oil" and "sunflower oils" still match.
    // Dutch "boter" and "spek" are the same story from the other side:
    // "boterhamworst" is a sausage and "speklap" a cut of pork, both of which
    // would pass the fat gate on their macros. At a word end, "roomboter" and
    // "ontbijtspek" still match and those two do not.
    end: ["öl", "öle", "oil", "oils", "nuss", "nüsse", "boter", "spek"],
  },

  // --------------------------------------------------------------- milk ---
  milk: {
    any: [
      // English
      "milk", "yoghurt", "yogurt", "kefir", "buttermilk", "quark", "skyr",
      "ayran", "lassi", "dairy drink",
      // Dutch
      "yoghurtdrank", "melkdrank", "melkpoeder", "zuivelspread", "chocolademelk", "drinkyoghurt",
      "melk", "karnemelk", "kwark", "zuiveldrank", "vla", "vlaflip",
      // German
      "fruchtjoghurt", "trinkmilch", "kondensmilch", "magermilch",
      "vollmilch", "milchmischgetränk", "milchpulver", "sauermilch",
      "speisequark",
      "milch", "joghurt", "jogurt", "buttermilch", "molke", "dickmilch",
      // French
      "lait fermenté", "lait ribot", "lait concentré", "lait écrémé",
      "lait entier", "yaourt à boire",
      "lait", "yaourt", "yogourt", "babeurre", "kéfir", "fromage blanc",
      "petit-suisse", "petit suisse",
      // Greek
      "γάλα", "γάλακτος", "γιαούρτι", "γιαούρτ", "κεφίρ", "ξινόγαλα", "αριάνι",
      "τζατζίκι", "τυρόγαλο",
    ],
  },

  // ------------------------------------------------------------ protein ---
  protein: {
    any: [
      // English, meat and poultry
      "gammon steak", "brisket", "sirloin", "rump", "topside", "silverside",
      "escalope", "meatball", "burger", "black pudding", "haggis",
      "corned beef", "luncheon meat", "sweetbread", "tripe", "chitterling",
      "pheasant", "quail", "guinea fowl", "capon", "pigeon", "ostrich",
      "whiting", "turbot", "monkfish", "anglerfish", "plaice", "saithe",
      "pollack", "gurnard", "snapper", "tilapia", "pangasius", "swordfish",
      "kipper", "scallop", "crayfish", "langoustine", "whelk",
      "cockle", "winkle", "gruyère", "raclette", "reblochon", "mimolette",
      "roquefort", "stilton", "wensleydale", "paneer", "quorn",
      "meat", "beef", "veal", "steak", "mince", "ground beef", "pork", "ham",
      "gammon", "lamb", "mutton", "goat meat", "chicken", "turkey", "duck",
      "goose", "rabbit", "venison", "sausage", "salami", "pepperoni",
      "chorizo", "pastrami", "prosciutto", "bresaola", "liver", "kidney",
      // English, fish and shellfish
      "fish", "salmon", "tuna", "cod", "haddock", "herring", "mackerel",
      "sardine", "anchovy", "trout", "sea bass", "bream", "hake",
      "pollock", "caviar", "shrimp", "prawn", "crab", "lobster",
      "mussel", "clam", "oyster", "squid", "octopus", "calamari", "surimi",
      // English, cheese, egg, soy
      "cheese", "cheddar", "gouda", "edam", "feta", "mozzarella", "parmesan",
      "ricotta", "cottage", "halloumi", "brie", "camembert", "gruyere",
      "emmental", "manchego", "egg", "omelette", "tofu", "tempeh", "seitan",
      // Dutch
      "gehaktbal", "rundergehakt", "runderlap", "biefstuk", "rosbief",
      "rookvlees", "runderrollade", "sukadelap", "riblap", "tartaar",
      "hamburger", "shoarma", "spareribs", "varkenshaas", "varkensfilet",
      "karbonade", "schnitzel", "speklap", "kalfsvlees", "lamsvlees",
      "lamsbout", "lamskarbonade", "kipfilet", "kiprollade", "kalkoenfilet",
      "kipschnitzel", "kipdij", "cornedbeef", "pekelvlees", "casselerrib",
      "fricandeau", "braadworst", "rookworst", "knakworst", "boterhamworst",
      "cervelaat", "ossenworst", "bloedworst", "pate", "paardenvlees",
      "fazant", "patrijs", "nier", "eidooier", "eipoeder", "kabeljauw",
      "koolvis", "schol", "scholfilet", "wijting", "heilbot",
      "sardines", "bokking", "haringfilet", "rolmops", "lekkerbek",
      "kibbeling", "vissticks", "stokvis", "bakkeljauw", "kuit",
      "mosselen", "oesters", "garnalen", "kreeft", "krab", "slakken",
      "belegen kaas", "jonge kaas", "oude kaas", "komijnekaas", "smeerkaas",
      "korstloos", "schapenkaas",
      "vlees", "rundvlees", "gehakt", "varkensvlees", "kip",
      "kalkoen", "eend", "konijn", "worst", "leverworst", "lever",
      "zalm", "tonijn", "schelvis", "haring", "makreel",
      "ansjovis", "forel", "paling", "garnaal",
      "mossel", "oester", "inktvis", "kaas", "geitenkaas",
      "hüttenkäse", "eieren", "omelet",
      // German
      "rinderfilet", "rinderleber", "rinderzunge", "roastbeef",
      "kalbsschnitzel", "kalbsleber", "kalbszunge", "kalbsbratwurst",
      "hammelfleisch", "lammkotelett", "kotelett", "schweineleber",
      "schweinsbratwurst", "tatar", "hühnerbrust", "hühnerleber",
      "suppenhuhn", "brathuhn", "geflügel", "hirsch", "reh", "rehrücken",
      "hase", "mettwurst", "plockwurst", "teewurst",
      "gelbwurst", "mortadella", "presssack", "leberkäse", "leberpastete",
      "lyoner", "fleischwurst", "weißwurst", "bierschinken", "kasseler",
      "lachsschinken", "wiener würstchen", "renke", "felchen", "goldbarsch",
      "heilbutt", "karpfen", "brathering", "bückling", "matjes",
      "schillerlocken", "hecht", "scholle", "zander", "seezunge", "sprotte",
      "tilsiter", "chesterkäse", "edelpilzkäse", "schmelzkäse",
      "schichtkäse", "schnittkäse", "streichkäse", "schafskäse", "ziegenkäse",
      "harzer", "handkäse",
      "fleisch", "rindfleisch", "kalbfleisch", "hackfleisch", "schwein",
      "schinken", "lamm", "hähnchen", "huhn", "hühnchen", "pute", "truthahn",
      "ente", "gans", "kaninchen", "wurst", "würstchen", "leberwurst",
      "leber", "fisch", "lachs", "thunfisch", "kabeljau", "dorsch",
      "schellfisch", "hering", "makrele", "sardelle", "forelle", "seelachs",
      "kaviar", "garnele", "krabbe", "hummer", "muschel", "auster",
      "tintenfisch", "käse", "edamer", "emmentaler", "eier", "omelett",
      // French
      "blanc de poulet", "cuisse de poulet", "steak haché",
      "entrecôte", "faux-filet", "rumsteck", "bavette", "côte de porc",
      "rôti", "gigot", "merguez", "chipolata", "rillettes", "andouille",
      "boudin", "pâté", "terrine", "cervelas", "jambonneau", "coppa",
      "magret", "gésier", "ris de veau", "rognon", "cabillaud pané",
      "colin d'alaska", "lieu", "merlan", "julienne", "lotte", "raie",
      "dorade", "bar de ligne", "sole meunière", "saint-jacques", "bulot",
      "bigorneau", "écrevisse", "tarama",
      "tomme", "cantal", "maroilles",
      "munster", "crottin", "chaource", "morbier", "saint-nectaire",
      "bleu d'auvergne", "fourme", "féta", "fromage râpé",
      "viande", "boeuf", "bœuf", "veau", "haché", "porc", "jambon", "agneau",
      "mouton", "poulet", "dinde", "canard", "oie", "lapin", "gibier",
      "saucisse", "saucisson", "foie", "poisson", "saumon", "thon",
      "cabillaud", "morue", "églefin", "hareng", "maquereau", "anchois",
      "truite", "colin", "lieu noir", "anguille", "crevette", "crabe",
      "homard", "moule", "huître", "calamar", "poulpe", "fromage", "chèvre",
      "comté", "oeuf", "œuf",
      // Greek
      "κρέας", "κρέατος", "μοσχάρ", "βοδιν", "χοιριν", "χοιρομέρι", "αρνί",
      "αρνίσι", "κατσικίσι", "κοτόπουλο", "γαλοπούλα", "πάπια", "χήνα",
      "κουνέλι", "λαγός", "κιμάς", "μπριζόλα", "παϊδάκια", "μπον φιλέ",
      "νουά", "κόντρα", "ψαρονέφρι", "λουκάνικο", "σαλάμι", "πεπερόνι",
      "παστουρμάς", "ζαμπόν", "συκώτι", "καρδιά", "αμελέτητα",
      "ψάρι", "ψάρια", "μπακαλιάρος", "γαλέος", "τόνος", "σολομός",
      "σολωμός", "ρέγκα", "σαρδέλα", "αντζούγι", "σκουμπρί", "τσιπούρα",
      "λαβράκι", "πέστροφα", "χέλι", "χαβιάρι", "γαρίδ", "καβούρι",
      "αστακ", "μύδι", "στρείδι", "καλαμάρι", "χταπόδι", "σουρίμι",
      "τυρί", "τυριά", "φέτα", "ανθότυρο", "μυζήθρα", "μανούρι", "γραβιέρα",
      "κασέρι", "κεφαλοτύρι", "κεφαλογραβιέρα", "μετσοβόνε", "τελεμές",
      "κατίκι", "κοπανιστή", "μοτσαρέλα", "ρικότα", "τσένταρ", "ένταμ",
      "γκούντα", "παρμεζάνα", "κότατζ", "αυγό", "αυγά", "ομελέτα",
      "τόφου", "τοφού", "τέμπε",
    ],
    // "ei" is egg in Dutch and German, "vis" is fish in Dutch. Both are short
    // enough to hide inside unrelated words, so they match at a word start
    // only, and "ei" excludes the two words for protein that begin with it,
    // German "Eiweiß" and Dutch "eiwit".
    // "sole" and "eel" are whole fish but also live inside casserole and feel,
    // and German "Aal" inside Dutch "maaltijd", so they match at a word start
    // too.
    start: ["ei(?!wei|wit)", "vis", "ψαρ", "sole", "eel", "aal"],
  },

  // -------------------------------------------------------------- fruit ---
  fruit: {
    any: [
      "holunderbeere", "johannisbeere", "stachelbeere", "preiselbeere",
      "mirabelle", "reineclaude", "pampelmuse", "honigmelone", "blaubeere",
      "weintraube", "aardbeien", "bosbessen", "frambozen", "bramen",
      "krenten", "kruisbes", "stoofpeer", "appelmoes", "vruchtenmoes",
      "tuttifrutti", "kumquat", "longan", "loquat", "rambutan", "tamarind",
      "soursop", "cherimoya", "feijoa", "durian", "acerola", "goji",
      "groseille", "myrtille", "airelle", "quetsche", "brugnon",
      "pamplemousse", "clémentine", "figue de barbarie", "kaki", "corossol",
      "σταφύλι", "φραγκόσυκο",
      "fruit", "vrucht", "frucht", "φρού", "φρουτ",
      "apple", "appel", "apfel", "pomme", "μήλο", "μήλα",
      "banana", "banaan", "banane", "μπανάν",
      "orange", "sinaasappel", "apfelsine", "πορτοκάλ",
      "mandarin", "tangerine", "clementine", "μανταρίν",
      "grape", "druif", "druiven", "traube", "raisin sec", "σταφύλ",
      "raisin", "rozijn", "rosine", "σταφίδ",
      "pear", "peer", "birne", "poire", "αχλάδ",
      "melon", "meloen", "melone", "πεπόν",
      "watermelon", "watermeloen", "wassermelone", "pastèque", "καρπούζ",
      "strawberry", "aardbei", "erdbeere", "fraise", "φράουλ",
      "raspberry", "framboos", "himbeere", "framboise", "σμέουρ",
      "blueberry", "bosbes", "heidelbeere", "μύρτιλ",
      "blackberry", "braam", "brombeere", "mûre", "βατόμουρ",
      "currant", "bessen", "cassis", "φραγκοστάφυλ",
      "cranberry", "veenbes", "cranberrie",
      "cherry", "kersen", "kirsche", "cerise", "κεράσ",
      "peach", "perzik", "pfirsich", "pêche", "ροδάκιν",
      "nectarine", "νεκταρίν",
      "plum", "pruim", "pflaume", "prune", "δαμάσκην",
      "apricot", "abrikoos", "aprikose", "abricot", "βερίκοκ",
      "date", "dadel", "dattel", "χουρμάδ",
      "fig", "vijg", "feige", "figue", "σύκο", "σύκα",
      "pomegranate", "granaatappel", "granatapfel", "grenade", "ρόδι",
      "kiwi", "ακτινίδ",
      "pineapple", "ananas", "ανανά",
      "mango", "μάνγκο", "papaya", "παπάγια", "guava", "γκουάβα",
      "passion fruit", "passievrucht", "maracuja", "μαρακούγια",
      "lychee", "λίτσι", "persimmon", "λωτ",
      "lemon", "citroen", "zitrone", "citron", "λεμόν",
      "lime", "limoen", "limette", "λάιμ",
      "grapefruit", "pompelmoes", "γκρέιπ",
      "juice", "saft", "jus de", "χυμ",
      "compote", "compôte", "moes", "μους φρούτων",
    ],
  },

  // ---------------------------------------------------------------- veg ---
  // Non-starchy vegetables. Green beans belong here under the US convention;
  // corn, peas, potato and winter squash are starch.
  veg: {
    any: [
      // English
      "chayote", "salsify", "cardoon", "swede", "rutabaga", "celeriac",
      "romanesco", "pak choy", "bok choy", "mangetout", "snow pea",
      "samphire", "seaweed", "shiitake", "chanterelle", "oyster mushroom",
      "morel", "button mushroom", "purslane", "sorrel", "dandelion",
      "escarole", "mesclun", "spring onion", "shallot", "chive", "iceberg",
      "romaine", "little gem", "marrow", "gherkins",
      "vegetable", "lettuce", "spinach", "cucumber", "tomato", "pepper",
      "courgette", "zucchini", "aubergine", "eggplant", "broccoli",
      "cauliflower", "cabbage", "kale", "brussels sprout", "leek", "onion",
      "garlic", "celery", "carrot", "radish", "beetroot", "turnip",
      "asparagus", "artichoke", "mushroom", "green bean", "runner bean",
      "okra", "chard", "rocket", "arugula", "endive", "chicory", "watercress",
      "fennel", "kohlrabi", "pak choi", "bean sprout", "gherkin", "sauerkraut",
      // Dutch
      "peultjes", "kousenband", "schorseneren", "raapstelen",
      "postelein", "rammenas", "sterkers", "bleekselderij", "knolselderij",
      "spitskool", "rodekool", "savooiekool", "chinese kool", "amsoi",
      "paksoi", "tauge", "zeekraal", "zeewier", "cantharel", "oesterzwam",
      "kappertjes", "tafelzuur", "rauwkost", "groentemix", "sopropo",
      "antroewa", "bamboespruiten", "veldsla", "ijsbergsla",
      "rucolasla",
      "groente", "spinazie", "komkommer", "tomat", "paprika",
      "bloemkool", "boerenkool", "spruitjes", "prei", "knoflook", "selderij",
      "wortel", "radijs", "biet", "koolraap", "asperge", "artisjok",
      "champignon", "sperzieboon", "snijboon", "snijbiet", "rucola",
      "andijvie", "witlof", "waterkers", "venkel", "koolrabi",
      "taugé", "augurk", "zuurkool",
      // German
      "möhren", "porree", "schnittlauch", "kresse", "rotkohl", "weißkohl",
      "spitzkohl", "wirsing", "steckrübe", "schwarzwurzel", "sellerieknolle", "champignons", "pfifferling", "steinpilz",
      "austernpilz", "salatgurke", "eisbergsalat", "portulak",
      "brunnenkresse", "rote rüben",
      // "salat" on its own is a dish, not a vegetable: Eiersalat,
      // Kartoffelsalat, Nudelsalat and Wurstsalat are none of them veg.
      "gemüse", "kopfsalat", "blattsalat", "feldsalat",
      "spinat", "gurke", "tomate",
      "brokkoli", "blumenkohl", "kohl", "grünkohl", "rosenkohl", "lauch",
      "zwiebel", "knoblauch", "sellerie", "karotte", "möhre", "radieschen",
      "rote bete", "rübe", "spargel", "artischocke", "pilz", "grüne bohne",
      "mangold", "endivie", "chicorée", "fenchel",
      // French
      "haricots verts", "salsifis", "cardon",
      "topinambour", "crosne", "mâche", "scarole", "frisée", "pissenlit",
      "oseille", "pourpier", "bette", "épinards", "petits légumes",
      "champignon de paris", "girolle", "cèpe", "pleurote", "échalote",
      "ciboulette", "persil", "coeur d'artichaut", "chou rouge", "chou blanc",
      "chou de bruxelles", "chou chinois", "poireaux",
      "légume", "laitue", "épinard", "concombre", "poivron",
      "brocoli", "chou-fleur", "chou", "poireau",
      "oignon", "céleri", "carotte", "radis", "betterave", "navet",
      "artichaut", "haricot vert", "gombo",
      "blette", "roquette", "cresson", "fenouil",
      "chou-rave", "cornichon", "choucroute",
      // Greek
      "λαχανικ", "μαρούλι", "σπανάκι", "αγγούρι", "τομάτ", "πιπερι",
      "κολοκυθάκι", "μελιτζάν", "μπρόκολο", "κουνουπίδι", "λάχανο",
      "λαχανάκια", "πράσο", "κρεμμ", "σκόρδο", "σέλινο", "καρότ",
      "ραπανάκι", "παντζάρι", "γογγύλι", "σπαράγγι", "αγκινάρα",
      "μανιτάρι", "φασολάκια", "μπάμιες", "σέσκουλ", "ρόκα", "μαϊντανό", "άνηθο", "χόρτα", "λάπαθο", "παπαρούνα", "αντίδι",
      "ραδίκι", "μάραθο", "βλίτα", "βρούβες", "τουρσί", "αντίδια",
    ],
    // Dutch "ui" (onion) hides inside fruit, biscuit and juice, so it only
    // counts at a word start, where it still catches "uien" and "uiensoep".
    start: ["ui"],
  },

  // ------------------------------------------------------------- starch ---
  // Bread, cereal, rice, pasta, legumes, starchy vegetables, and the sweets
  // and baked goods that resolve into starch plus fat.
  starch: {
    any: [
      // English, bread and cereal
      "wholemeal", "granary", "sourdough", "flatbread", "chapati", "naan",
      "brioche", "crumpet", "muffin", "scone", "shortbread", "flapjack",
      "gingerbread", "madeleine", "macaroon", "meringue", "marshmallow",
      "toffee", "fudge", "nougat", "liquorice", "jelly bean", "cereal bar",
      "granola bar", "hash brown", "wedges", "crisps", "tortilla chip",
      "poppadom", "prawn cracker", "porridge oats", "pearl barley",
      "buckwheat", "amaranth", "sorghum", "teff", "black bean", "kidney bean",
      "cannellini", "butter bean", "borlotti", "edamame", "split pea",
      "mushy pea", "baked bean",
      "bread", "roll", "bun", "bagel", "toast", "baguette", "pitta", "pita",
      "tortilla", "wrap", "cracker", "crispbread", "rusk", "breadstick",
      "crouton", "cereal", "cornflakes", "muesli", "granola", "porridge",
      "bran", "wheat", "rye", "barley", "spelt", "semolina",
      "couscous", "bulgur", "quinoa", "rice", "pasta", "spaghetti",
      "macaroni", "noodle", "lasagne", "flour", "gnocchi", "dumpling",
      // English, starchy vegetables and legumes
      "potato", "yam", "cassava", "plantain", "corn", "polenta", "peas",
      "parsnip", "pastinaak", "panais", "παστινάκη",
      "lentil", "bean", "chickpea", "hummus", "popcorn", "pretzel",
      "butternut", "winter squash", "pumpkin",
      // English, sweets and baked goods
      "sugar", "honey", "jam", "marmalade", "syrup", "chocolate", "biscuit",
      "cookie", "cake", "brownie", "doughnut", "donut", "croissant",
      "pastry", "pancake", "waffle", "ice cream", "sorbet", "pudding",
      "candy", "sweets",
      // Dutch
      "tarwebrood", "meergranenbrood", "volkorenbrood", "stokbrood",
      "krentenbrood", "krentenbol", "rozijnenbrood", "roggebrood",
      "tarwebroodje", "meergranenbroodje", "ontbijtkoek", "speculaas",
      "stroopwafel", "kruidnoten", "pepernoten", "oliebol", "appelflap",
      "soesje", "bladerdeeg", "sprits", "koekje", "biscuitje", "vlaai",
      "hagelslag", "candybar", "winegum", "bonbon", "drop",
      "snoepje", "kauwgom", "noga", "mueslireep", "graanreep",
      "aardappelpuree", "aardappelkroket", "kroket", "bitterbal", "frikandel",
      "loempia", "nasischijf", "bamibal", "kaassouffle", "kipnugget",
      "kipkorn", "poffertjes", "rosti", "paneermeel", "maizena",
      "aardappelzetmeel", "tapioca", "gierst", "gort", "kapucijners",
      "cassave", "kroepoek", "soepstengel", "rijstwafel", "matze",
      "cracottes", "mihoen", "bami", "nasi", "puddingpoeder", "custardpoeder",
      "vlaaivulling", "berenklauw", "tompouce",
      "brood", "broodje", "beschuit", "knäckebröd", "ontbijtgranen",
      "havermout", "haver", "zemelen", "tarwe", "rogge", "gerst",
      "griesmeel", "rijst", "noedels", "meel", "aardappel",
      "patat", "friet", "bakbanan", "mais", "maïs", "erwt",
      "linzen", "bruine boon", "witte boon", "kikkererwt", "pompoen",
      "suiker", "honing", "stroop", "chocolade", "koek",
      "taart", "gebak", "pannenkoek", "wafel", "ijs", "snoep",
      // German
      "mehrkornbrötchen", "roggenbrötchen", "roggenmischbrot",
      "roggenvollkornbrot", "weizenmischbrot", "weizenvollkornbrot",
      "vollkornbrot", "vollkorntoast", "weizentoast", "weißbrot",
      "leinsamenbrot", "pumpernickel", "schwarzbrot", "schrotbrot",
      "buchweizen", "grünkern", "hirse", "naturreis", "paniermehl",
      "kartoffelstärke", "maisstärke", "weizenstärke", "sago",
      "puddingpulver", "teigwaren", "vollkornnudeln", "maisgries",
      "weizengries", "kleieflocken", "kartoffelpüree", "kartoffelknödel",
      "kroketten", "pommes frites", "kartoffelchips", "esskastanie",
      "lebkuchen", "stollen", "berliner", "streuselkuchen", "butterkeks",
      "zwiebackbrot", "marzipan", "gummibärchen",
      "brot", "brötchen", "semmel", "fladenbrot", "knäckebrot", "zwieback",
      "brezel", "müsli", "haferflocken", "hafer", "kleie", "weizen",
      "roggen", "gerste", "dinkel", "grieß", "reis", "nudel", "spätzle",
      "makkaroni", "mehl", "kartoffel", "süßkartoffel", "maniok",
      "kochbanan", "erbse", "linse", "kichererbse", "kürbis",
      "zucker", "honig", "marmelade", "konfitüre", "sirup", "schokolade",
      "keks", "kuchen", "gebäck", "krapfen", "pfannkuchen", "waffel",
      "speiseeis", "süßigkeit", "knödel", "klöße",
      // French
      "pain de mie", "pain complet", "pain aux céréales",
      "pain au chocolat", "chausson", "financier",
      "sablé", "spéculoos", "palmier", "chouquette", "éclair", "millefeuille",
      "tarte", "clafoutis", "far breton", "kouign-amann", "pain d'épices",
      "biscotte", "grissini", "bretzel", "blinis", "chapelure",
      "purée de pomme de terre", "frites", "chips", "gratin dauphinois",
      "pommes duchesse", "pommes noisette", "boulgour", "sarrasin", "millet",
      "sorgho", "amarante", "épeautre", "petit épeautre", "flageolet",
      "haricot coco", "fève", "guimauve",
      "pâte de fruits", "confiserie",
      "pain", "galette", "croûton", "céréales", "flocons",
      "avoine", "son de blé", "blé", "seigle", "orge",
      "semoule", "riz", "pâtes", "nouille", "farine",
      "pomme de terre", "patate", "manioc", "banane plantain",
      "petit pois", "lentille", "haricot blanc", "haricot rouge",
      "pois chiche", "courge", "potiron", "sucre", "miel", "confiture",
      "sirop", "chocolat", "gâteau", "viennoiserie", "beignet",
      "crêpe", "gaufre", "glace", "pâtisserie",
      // Greek
      "ψωμί", "ψωμάκι", "αρτοσκεύασμα", "φρυγανιά", "φρυγανιές", "παξιμάδι",
      "κουλούρι", "πίτα", "τορτίγια", "κράκερ", "κριτσίνι", "κρουτόν",
      "δημητριακά", "κορν φλέικς", "νιφάδες", "μούσλι", "βρώμη", "πίτουρο",
      "σιτάρι", "σίκαλη", "κριθάρι", "σιμιγδάλι", "κους κους", "πλιγούρι",
      "κινόα", "ρύζι", "ζυμαρικά", "μακαρόνια", "κριθαράκι", "χυλοπίτες",
      "λαζάνια", "αλεύρι", "πατάτα", "πατάτες", "γλυκοπατάτα", "καλαμπόκι",
      "αραβόσιτος", "πολέντα", "αρακάς", "φακές", "φασόλια", "φάβα",
      "ρεβίθια", "όσπρια", "ποπ κορν", "πρέτζελ", "κάστανα", "κολοκύθα",
      "ζάχαρη", "μέλι", "μαρμελάδα", "σιρόπι", "σοκολάτα", "μπισκότ",
      "κέικ", "γλυκό", "γλυκά", "κρουασάν", "ντόνατ", "τηγανίτα", "βάφλα",
      "παγωτό", "σορμπέ", "κρέμα καραμελέ", "πατατάκια", "μπράουνι",
    ],
    // "oat" sits inside "goat", German "eis" inside "Fleisch" and "Reis".
    start: ["oat", "eis"],
  },
};
