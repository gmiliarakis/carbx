import { useState } from "react";
import Tesseract from "tesseract.js";
import { LANGS, translator } from "./i18n.js";
import { decompose, fromOpenFoodFacts, gramsPerExchange, inferGroupWithReason,
  parseNutritionText, scanIngredients, r0, r1 } from "./lib/exchange.js";

// One per-100 g record, filled in by hand, from a pasted label, from a photo,
// or from Open Food Facts. Everything after that runs offline.

const CSS = `
.of-root{
  --bar:#22262B;
  --rail:#F0EEE8; --field:#FFFFFF; --line:#D5D2C9; --line2:#E3E0D8; --raise:#E6E3DB;
  --sheet:#FBFBF9; --ink:#1F2225; --rule:#D9DBD5; --rule2:#EDEEE9;
  --muted:#5A5F65; --muted2:#7B8085;
  --signal:#1F2225; --signal-w:#EDEBE4;
  --warn:#B4690E; --warn-w:#FBF0DE;
  --alert:#A3231C; --alert-w:#FBE7E5;
  /* --sans and --mono are declared on :root in index.css, so the document
     paints in them before the app mounts. Self-hosted; see src/fonts.css. */
  --display:var(--sans);
  --lab-fam:var(--sans); --lab-case:none; --lab-sp:.005em; --lab-size:13.5px; --lab-w:600;
  background:var(--sheet); color:var(--ink);
  font-family:var(--sans); font-size:15px; line-height:1.5;
  min-height:100vh; display:flex; flex-direction:column;
  -webkit-font-smoothing:antialiased;
}
.of-root *{box-sizing:border-box}
.of-head{display:flex; align-items:baseline; gap:16px; flex-wrap:wrap;
  padding:18px 22px 14px; background:var(--bar); color:var(--sheet)}
.of-langs{display:flex; gap:10px; align-items:baseline; margin-left:auto}
.of-langs button{background:none; border:0; padding:0; cursor:pointer;
  font-family:var(--sans); font-size:13px; color:#9AA0A6}
.of-langs button:hover{color:var(--sheet)}
.of-langs button[data-on="1"]{color:var(--sheet); text-decoration:underline; text-underline-offset:3px}
.of-langs button:focus-visible{outline:2px solid var(--sheet); outline-offset:3px}
.of-title{font-family:var(--display); font-size:15px; letter-spacing:.06em; font-weight:600}
.of-grid{display:grid; grid-template-columns:340px 1fr; align-items:stretch; flex:1 1 auto}
@media (max-width:880px){ .of-grid{grid-template-columns:1fr} }
.of-rail{padding:16px 20px 40px; border-right:1px solid var(--line); background:var(--rail)}
.of-legend{font-family:var(--lab-fam); font-size:var(--lab-size); letter-spacing:var(--lab-sp);
  text-transform:var(--lab-case); font-weight:600;
  color:var(--muted); padding-bottom:7px; margin-bottom:11px; border-bottom:1px solid var(--line)}
.of-sect{margin-bottom:22px}
.of-lab{display:block; font-family:var(--lab-fam); font-size:var(--lab-size);
  letter-spacing:var(--lab-sp); text-transform:var(--lab-case); font-weight:var(--lab-w);
  color:var(--ink); margin-bottom:5px}
.of-in,.of-sel,.of-ta{width:100%; background:var(--field); color:var(--ink); border:1px solid var(--line);
  border-radius:2px; padding:8px 9px; font-family:var(--mono); font-size:14px; font-variant-numeric:tabular-nums}
.of-ta{resize:vertical; line-height:1.5; font-size:12px}
.of-in:focus,.of-sel:focus,.of-ta:focus{outline:2px solid var(--signal); outline-offset:1px; border-color:var(--signal)}
.of-in::placeholder,.of-ta::placeholder{color:#A4A8A2}
.of-row{display:flex; gap:8px; margin-bottom:8px}
.of-f{flex:1; min-width:0}
/* The unit belongs to the value, not to the field name, so it sits against the
   box. That also lets the box be only as wide as the few digits it holds. */
.of-num{display:flex; align-items:center; gap:6px}
.of-num .of-in{flex:0 1 66px; width:auto; min-width:0}
.of-unit{font-size:12.5px; color:var(--muted); white-space:nowrap}
.of-btn{width:100%; background:var(--signal); color:#fff; border:1px solid var(--signal); border-radius:2px; padding:9px;
  font-family:var(--sans); font-size:12.5px; letter-spacing:.005em; font-weight:500; cursor:pointer; margin-top:9px}
.of-btn.ghost{background:var(--field); border-color:var(--line); color:var(--muted)}
.of-btn.ghost:hover{border-color:var(--muted); color:var(--ink)}
.of-btn:disabled{background:var(--raise); border-color:var(--line); color:var(--muted2); cursor:default}
.of-btn:focus-visible{outline:2px solid var(--signal); outline-offset:2px}
.of-seg{display:flex; border:1px solid var(--line); border-radius:2px; overflow:hidden; margin-bottom:10px; flex-wrap:wrap}
.of-seg button{flex:1 1 0; min-width:64px; background:var(--field); color:var(--muted); border:0; padding:8px 3px;
  cursor:pointer; font-family:var(--sans); font-size:12px; letter-spacing:.005em}
.of-seg button:hover{background:var(--raise); color:var(--ink)}
.of-seg button+button{border-left:1px solid var(--line)}
.of-seg button[data-on="1"],.of-seg button[data-on="1"]:hover{background:var(--signal); color:#fff}
.of-hint{font-size:12.5px; color:var(--muted); margin-top:7px; line-height:1.5}
.of-warnbox{font-size:11.5px; line-height:1.5; color:#5C3705; background:var(--warn-w);
  border-left:2px solid var(--warn); padding:8px 10px; margin-top:9px}
.of-res{margin-top:10px; max-height:250px; overflow:auto; border:1px solid var(--line); border-radius:2px}
.of-item{display:block; width:100%; text-align:left; background:var(--field); border:0;
  border-bottom:1px solid var(--line2); padding:8px 10px; cursor:pointer; color:var(--ink)}
.of-item:hover,.of-item:focus-visible{background:var(--raise); outline:none}
.of-item .n{font-size:12.5px; line-height:1.3}
.of-item .b{font-family:var(--mono); font-size:10.5px; color:var(--muted); margin-top:2px}

.of-sheet{background:var(--sheet); color:var(--ink); min-height:100%; padding:20px 24px 32px;
  display:flex; flex-direction:column}
.of-sheet>*{flex:0 0 auto}
.of-shead{display:flex; justify-content:space-between; align-items:baseline; gap:12px;
  border-bottom:2px solid var(--ink); padding-bottom:7px; margin-bottom:10px; flex-wrap:wrap}
.of-shead h2{margin:0; font-family:var(--display); font-size:15px; letter-spacing:.01em; font-weight:600}
.of-stamp{font-family:var(--mono); font-size:12px; color:var(--muted)}
.of-pname{font-family:var(--display); font-size:21px; font-weight:600; line-height:1.25; margin:12px 0 2px}
.of-pbrand{font-family:var(--sans); font-size:13px; color:var(--muted)}
.of-block{margin-top:24px}
.of-btitle{font-family:var(--lab-fam); font-size:var(--lab-size); letter-spacing:var(--lab-sp);
  text-transform:var(--lab-case); font-weight:600;
  color:var(--muted); border-bottom:1px solid var(--rule); padding-bottom:6px; margin-bottom:6px}

.of-cards{display:grid; grid-template-columns:repeat(auto-fit,minmax(118px,1fr)); gap:1px;
  background:var(--rule); border:1px solid var(--rule)}
.of-card{background:var(--sheet); padding:10px 11px}
.of-card .k{font-family:var(--lab-fam); font-size:var(--lab-size); letter-spacing:var(--lab-sp); text-transform:var(--lab-case); font-weight:var(--lab-w); color:var(--muted)}
.of-card .v{font-family:var(--mono); font-size:22px; font-variant-numeric:tabular-nums; margin-top:4px}
.of-card .s{font-family:var(--sans); font-size:12px; color:var(--muted); margin-top:3px}

.of-line{display:grid; grid-template-columns:14px 1fr auto; gap:10px; align-items:baseline;
  padding:7px 0; border-bottom:1px solid var(--rule2)}
.of-flagcol{font-family:var(--mono); font-size:12px; font-weight:700}
.of-nm{font-size:14px}
.of-nm small{display:block; color:var(--muted); font-size:12px; font-family:var(--sans); margin-top:3px; line-height:1.45}
.of-vl{font-family:var(--mono); font-variant-numeric:tabular-nums; font-size:15px; white-space:nowrap}
.of-vl u{text-decoration:none; color:var(--muted); font-size:10.5px; margin-left:3px}
.of-note{display:grid; grid-template-columns:14px 1fr; gap:10px; padding:10px 11px; margin:7px 0;
  border-left:2px solid; font-size:13.5px; line-height:1.5}
.of-note b{font-weight:600}
.of-note.w{background:var(--warn-w); border-color:var(--warn); color:#5C3705}
.of-note.a{background:var(--alert-w); border-color:var(--alert); color:#5E1310}
.of-note.i{background:var(--signal-w); border-color:var(--ink); color:#2B2F33}
.of-hit{font-family:var(--mono); font-size:11.5px; display:inline-block; padding:2px 6px; margin:2px 4px 2px 0;
  border:1px solid currentColor; border-radius:2px}
.of-src{margin-top:26px; padding-top:14px; border-top:1px solid var(--rule);
  font-size:12.5px; color:var(--muted); line-height:1.6}
.of-src a{color:var(--ink); text-decoration:underline; text-underline-offset:2px}
.of-src a:focus-visible{outline:2px solid var(--signal); outline-offset:2px}
.of-empty{color:var(--muted); font-size:14.5px; margin-top:22px; max-width:56ch; line-height:1.6}
.of-foot{margin-top:auto; padding-top:22px; text-align:right; font-family:var(--sans);
  font-size:11.5px; color:var(--muted)}

.of-use{display:flex; align-items:flex-start; gap:14px; padding:13px 22px;
  background:var(--signal-w); border-bottom:1px solid var(--line);
  font-size:13.5px; line-height:1.55; color:#2B2F33}
.of-use p{margin:0; max-width:92ch}
.of-use button{flex:0 0 auto; background:none; border:1px solid var(--line);
  border-radius:2px; color:var(--muted); cursor:pointer; padding:6px 12px;
  font-family:var(--sans); font-size:12px; letter-spacing:.005em}
.of-use button:hover{border-color:var(--ink); color:var(--ink)}
.of-use button:focus-visible{outline:2px solid var(--signal); outline-offset:2px}
@media (max-width:600px){ .of-use{flex-direction:column; gap:9px} }

.of-why{font-size:13px; color:var(--muted); line-height:1.55; margin-top:7px; max-width:64ch}
.of-why b{color:var(--ink); font-weight:600}
.of-why i{font-style:normal; font-family:var(--lab-fam); font-size:11px; letter-spacing:var(--lab-sp);
  text-transform:var(--lab-case); border:1px solid var(--line); border-radius:2px;
  padding:1px 6px; margin-right:6px; color:var(--muted)}


.of-more{display:flex; align-items:center; gap:8px; width:100%; background:none; border:0;
  padding:0; cursor:pointer; color:var(--muted); font-family:var(--sans); font-size:12.5px}
.of-more:hover{color:var(--ink)}
.of-more:focus-visible{outline:2px solid var(--signal); outline-offset:3px}
.of-more span{display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px;
  border:1px solid var(--line); border-radius:2px; font-size:11px; line-height:1; background:var(--field)}

.of-labrow{display:flex; align-items:center; gap:6px}
.of-check{display:flex; align-items:center; gap:7px; margin-top:10px; font-size:12px; color:#4E5257}
.of-check label{display:flex; align-items:center; gap:8px; cursor:pointer}
.of-help{position:relative; display:inline-flex; align-items:center}
.of-help>button{width:15px; height:15px; padding:0; border-radius:50%; border:1px solid currentColor;
  background:none; color:inherit; font-family:var(--mono); font-size:10px; line-height:1; cursor:pointer;
  display:flex; align-items:center; justify-content:center; opacity:.55}
.of-help>button:hover,.of-help>button[aria-expanded="true"]{opacity:1}
.of-help>button:focus-visible{outline:2px solid var(--signal); outline-offset:2px}
.of-help .pop{position:absolute; z-index:30; top:21px; left:-10px; width:236px; padding:9px 11px;
  background:var(--bar); color:var(--sheet); border-radius:2px;
  font-family:var(--sans); font-size:11.5px; line-height:1.5; letter-spacing:0; text-transform:none;
  font-weight:400; box-shadow:0 6px 20px rgba(31,34,37,.22)}
`;

function Note({ kind, title, children }) {
  return (<div className={"of-note " + kind}>
    <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{kind === "a" ? "!!" : kind === "w" ? "!" : "i"}</span>
    <span>{title && <b>{title}: </b>}{children}</span></div>);
}
function Help({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="of-help" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label={label} aria-expanded={open}
        onClick={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>?</button>
      {open && <span className="pop" role="tooltip">{children}</span>}
    </span>);
}
function NumField({ label, unit, value, onChange }) {
  return (
    <div className="of-f">
      <span className="of-lab">{label}</span>
      <div className="of-num">
        <input className="of-in" value={value} inputMode="decimal" onChange={onChange} />
        <span className="of-unit">{unit}</span>
      </div>
    </div>);
}
function Line({ flag = "", name, sub, value, unit }) {
  const c = flag === "a" ? "var(--alert)" : flag === "w" ? "var(--warn)" : "var(--ink)";
  return (<div className="of-line">
    <span className="of-flagcol" style={{ color: flag ? c : "var(--muted2)" }}>{flag === "a" ? "!!" : flag === "w" ? "!" : ""}</span>
    <span className="of-nm">{name}{sub && <small>{sub}</small>}</span>
    <span className="of-vl" style={{ color: c }}>{value}{unit && <u>{unit}</u>}</span></div>);
}

function plainFlags({ pp, na, scans }, renal, t) {
  const out = [];
  if (na > 500) out.push({ id: "na", cls: "a", text: t("flagSaltHigh", { n: r0(na) }) });
  else if (na > 250) out.push({ id: "na", cls: "w", text: t("flagSalty", { n: r0(na) }) });
  if (pp.sugars > 15) out.push({ id: "sug", cls: "w", text: t("flagSugar", { n: r1(pp.sugars) }) });
  if (pp.sfa > 5) out.push({ id: "sfa", cls: "w", text: t("flagSatFat", { n: r1(pp.sfa) }) });
  // Only worth saying on a food that carries carbohydrate, and only when the
  // label actually declared fibre. Blank is unknown, not zero: flagging olive
  // oil and chicken as low in fibre is noise that costs the real flags their
  // weight. Half a starch exchange is the floor for calling a food a
  // carbohydrate food at all.
  if (pp.fibre != null && pp.cho >= 8 && pp.fibre < 3)
    out.push({ id: "fib", cls: "w", text: t("flagFibre", { n: r1(pp.fibre), c: r1(pp.cho) }) });
  if (renal && pp.k != null && pp.k > 200)
    out.push({ id: "k", cls: "w", text: t("flagPotassium", { n: r0(pp.k) }) });
  if (renal && pp.p != null && pp.pro > 0 && pp.p / pp.pro > 12)
    out.push({ id: "p", cls: "w", text: t("flagPhosphorus", { n: r0(pp.p) }) });
  scans
    .filter((sc) => renal || !RENAL_SCANS.has(sc.id))
    .forEach((sc) => out.push({ id: "scan-" + sc.id, cls: sc.cls, text: `${t("s_" + sc.id)}: ${sc.hits.join(", ")}.` }));
  return out;
}

const USE_NOTICE_KEY = "carbx.intended-use.v1";

// Phosphate and potassium additives are a kidney-diet concern. Sodium and added
// sugar are everyone's, so they are always scanned for.
const RENAL_SCANS = new Set(["phos", "pot"]);

// Order of the food-group picker. Names come from the dictionary.
const GROUP_IDS = ["starch", "fruit", "milk", "veg", "sweet", "protein-only", "fat-only"];

const LANG_KEY = "carbx.lang.v1";
const initialLang = () => {
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved && LANGS.some((l) => l.id === saved)) return saved;
    return (navigator.language || "").toLowerCase().startsWith("el") ? "el" : "en";
  } catch { return "en"; }
};


const BLANK = { name: "", cho: "", pro: "", fat: "", fibre: "", sugars: "", sfa: "", salt: "", k: "", p: "", kcal: "", ing: "" };

export default function ExchangeLookup() {
  const [src, setSrc] = useState("hand");
  const [rec, setRec] = useState(BLANK);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [parsed, setParsed] = useState(false);
  const [cc, setCc] = useState("world");
  const [q, setQ] = useState("");
  const [offErr, setOffErr] = useState("");
  const [results, setResults] = useState([]);
  const [unit, setUnit] = useState(15);
  const [portion, setPortion] = useState("100");
  const [proTiers, setProTiers] = useState(true);
  const [override, setOverride] = useState("");
  const [ocrLang, setOcrLang] = useState("eng+nld+deu+fra+ell");
  const [detail, setDetail] = useState(false);
  const [full, setFull] = useState(false);
  // Potassium and phosphorus matter on a kidney diet and are noise to everyone
  // else, so they are off unless asked for.
  const [renal, setRenal] = useState(false);
  const [lang, setLang] = useState(initialLang);
  const t = translator(lang);
  const reason = (key) => t("r_" + key).replace(/[.·]+\s*$/, "");
  const pickLang = (id) => {
    setLang(id);
    try { window.localStorage.setItem(LANG_KEY, id); } catch { /* storage unavailable */ }
  };
  // Shown once per browser. Storage can throw or be empty, so failing to read
  // it shows the notice rather than hiding it.
  const [useNotice, setUseNotice] = useState(() => {
    try { return window.localStorage.getItem(USE_NOTICE_KEY) !== "seen"; }
    catch { return true; }
  });
  const dismissUseNotice = () => {
    setUseNotice(false);
    try { window.localStorage.setItem(USE_NOTICE_KEY, "seen"); } catch { /* storage unavailable */ }
  };

  const set = (k, v) => { setRec((r) => ({ ...r, [k]: v })); setParsed(false); };
  const g = (k) => parseFloat(rec[k]) || 0;
  const hasData = rec.cho !== "" || rec.pro !== "" || rec.fat !== "";

  // Read a pasted label or a photo on the device: OCR plus regex, no network call.
  const parseLabel = async (imageData, mediaType) => {
    setBusy(true); setMsg(""); setParsed(false);
    try {
      let text = paste;
      if (imageData) {
        const { data } = await Tesseract.recognize(`data:${mediaType};base64,${imageData}`, ocrLang);
        text = data.text || "";
      }
      if (!text || text.trim().length < 5) throw new Error("no text found");
      const j = parseNutritionText(text);
      const s = (v) => (v === null || v === undefined ? "" : String(v));
      const found = [j.cho, j.pro, j.fat].filter((v) => v != null).length;
      setRec((r) => ({ ...r, cho: s(j.cho), pro: s(j.pro), fat: s(j.fat), fibre: s(j.fibre),
               sugars: s(j.sugars), sfa: s(j.sfa), salt: s(j.salt), k: s(j.k), p: s(j.p),
               kcal: s(j.kcal), ing: j.ing || r.ing }));
      setParsed(true);
      setMsg(found === 0
        ? "No nutrition figures found in that text. Check the wording, or enter values by hand."
        : "Read locally, nothing sent anywhere. Check the figures against the pack." +
          (j.basis && j.basis !== "100g" && j.basis !== "100ml"
            ? ` Basis looks like "${j.basis}", convert to per 100 g first.`
            : ""));
      setSrc("hand");
    } catch (e) {
      setMsg(`Could not read that label (${e.message}). Type the values in directly.`);
    } finally { setBusy(false); }
  };

  const onPhoto = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => parseLabel(String(r.result).split(",")[1], f.type || "image/jpeg");
    r.onerror = () => setMsg("Could not read that file.");
    r.readAsDataURL(f);
  };

  const offSearch = async () => {
    if (!q.trim()) return;
    setBusy(true); setOffErr(""); setResults([]);
    try {
      const url = `https://${cc}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q.trim())}` +
        `&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,quantity,nutriments,ingredients_text,serving_quantity`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json();
      setResults((d.products || []).filter((p) => p.nutriments));
      if (!(d.products || []).length) setOffErr("Nothing matched.");
    } catch (e) {
      setOffErr(`Couldn't reach Open Food Facts (${e.message}).`);
    } finally { setBusy(false); }
  };

  const takeOff = (p) => {
    setRec(fromOpenFoodFacts(p));
    setSrc("hand"); setParsed(true);
    setMsg("Open Food Facts is crowd-sourced and unverified. Check the figures against the pack.");
  };

  // computation
  const size = parseFloat(portion) || 0;
  let view = null;
  if (hasData && size > 0) {
    const f = size / 100;
    const pp = { cho: g("cho") * f, pro: g("pro") * f, fat: g("fat") * f,
      fibre: rec.fibre === "" ? null : g("fibre") * f,
      sugars: g("sugars") * f, sfa: g("sfa") * f, salt: g("salt") * f,
      k: rec.k === "" ? null : g("k") * f, p: rec.p === "" ? null : g("p") * f,
      kcal: rec.kcal === "" ? g("cho") * 4 * f + g("pro") * 4 * f + g("fat") * 9 * f : g("kcal") * f };
    const why = inferGroupWithReason({ cho: g("cho"), pro: g("pro"), fat: g("fat"),
      sugars: rec.sugars === "" ? null : g("sugars"),
      fibre: rec.fibre === "" ? null : g("fibre") }, rec.name, { portionG: size, unit });
    const auto = why.group;
    const gid = override || auto;
    const dec = decompose(pp, unit, gid, { proteinTiers: proTiers });
    const per100 = { cho: g("cho"), pro: g("pro"), fat: g("fat") };
    dec.rounded = dec.rounded.map((o) => ({ ...o, gpe: gramsPerExchange(o.ref, per100) }));
    const rkcal = dec.rc * 4 + dec.rp * 4 + dec.rf * 9;
    const drift = pp.kcal > 0 ? ((rkcal - pp.kcal) / pp.kcal) * 100 : 0;
    const na = pp.salt * 400;
    view = { pp, auto, why, gid, dec, rkcal, drift, na, scans: scanIngredients(rec.ing) };
  }

  const cards = view && (
    <div className="of-cards">
      {view.dec.rounded.length === 0
        ? <div className="of-card"><div className="k">{t("result")}</div><div className="v">0</div>
            <div className="s">{t("freeFood")}</div></div>
        : view.dec.rounded.map((o) => (
            <div className="of-card" key={o.label}>
              <div className="k">{t("g_" + o.labelId)}</div><div className="v">{o.ex}</div>
              <div className="s">{o.ex === 1 ? t("exchange") : t("exchanges")}
                {o.gpe ? ` · ${r0(o.gpe)} ${t("gEach")}` : ""}</div></div>))}
    </div>);


  return (
    <div className="of-root">
      <style>{CSS}</style>
      <div className="of-head">
        <span className="of-title">CarbX</span>
        <nav className="of-langs" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l.id} type="button" onClick={() => pickLang(l.id)}
              aria-current={lang === l.id ? "true" : undefined}
              data-on={lang === l.id ? 1 : 0}>{l.label}</button>))}
        </nav>
      </div>

      {useNotice && (
        <div className="of-use" role="note">
          <p>{t("notice")}</p>
          <button type="button" onClick={dismissUseNotice}>{t("understood")}</button>
        </div>
      )}

      <div className="of-grid">
        <div className="of-rail">
          <div className="of-sect">
            <div className="of-legend">{t("source")}</div>
            <div className="of-seg">
              <button data-on={src === "hand" ? 1 : 0} onClick={() => setSrc("hand")}>{t("manual")}</button>
              <button data-on={src === "paste" ? 1 : 0} onClick={() => setSrc("paste")}>{t("text")}</button>
              <button data-on={src === "photo" ? 1 : 0} onClick={() => setSrc("photo")}>{t("photo")}</button>
              <button data-on={src === "off" ? 1 : 0} onClick={() => setSrc("off")}>{t("database")}</button>
            </div>

            {src === "paste" && (<>
              <span className="of-lab">{t("declaration")}</span>
              <textarea className="of-ta" rows={7} value={paste} onChange={(e) => setPaste(e.target.value)}
                placeholder={"Voedingswaarde per 100 g\nEnergie 418 kcal\nVetten 14 g\nwaarvan verzadigd 6 g\nKoolhydraten 62 g\nwaarvan suikers 3 g\nVezels 4 g\nEiwitten 9 g\nZout 1,4 g\n\nIngrediënten: ..."} />
              <button className="of-btn" onClick={() => parseLabel(null)} disabled={busy || paste.trim().length < 10}>
                {busy ? t("reading") : t("readLabel")}
              </button>
              <p className="of-hint">{t("parsedLocally")}</p>
            </>)}

            {src === "photo" && (<>
              <span className="of-lab">{t("photoPanel")}</span>
              <input type="file" accept="image/*" onChange={onPhoto}
                style={{ width: "100%", fontSize: 12, color: "#5C6167", fontFamily: "var(--mono)" }} />
              <span className="of-lab" style={{ marginTop: 8 }}>{t("ocrLanguage")}</span>
              <select className="of-sel" value={ocrLang} onChange={(e) => setOcrLang(e.target.value)}>
                <option value="eng+nld+deu+fra+ell">{t("ocrAuto")}</option>
                <option value="eng">{t("langEnglish")}</option>
                <option value="nld">{t("langDutch")}</option>
                <option value="deu">{t("langGerman")}</option>
                <option value="fra">{t("langFrench")}</option>
                <option value="ell">{t("langGreek")}</option>
              </select>
              {busy && <p className="of-hint">{t("ocrBusy")}</p>}
              <p className="of-hint">{t("ocrHint")}</p>
            </>)}

            {src === "off" && (<>
              <div className="of-row">
                <div className="of-f">
                  <span className="of-lab">{t("dbPicker")}</span>
                  <select className="of-sel" value={cc} onChange={(e) => setCc(e.target.value)}>
                    <option value="world">{t("dbWorld")}</option><option value="nl">{t("dbNetherlands")}</option>
                    <option value="gr">{t("dbGreece")}</option><option value="be">{t("dbBelgium")}</option>
                    <option value="de">{t("dbGermany")}</option><option value="fr">{t("dbFrance")}</option>
                  </select>
                </div>
              </div>
              <span className="of-lab">{t("productOrBarcode")}</span>
              <input className="of-in" value={q} onChange={(e) => setQ(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && offSearch()} placeholder={t("productPlaceholder")} />
              <button className="of-btn" onClick={offSearch} disabled={busy}>{busy ? t("searching") : t("search")}</button>
              {offErr && <p className="of-hint">{offErr}</p>}
              {results.length > 0 && (
                <div className="of-res">
                  {results.map((p) => (
                    <button key={p.code} className="of-item" onClick={() => takeOff(p)}>
                      <span className="n">{p.product_name || p.code}</span>
                      <span className="b">{[p.brands, p.quantity].filter(Boolean).join(" · ")}</span>
                    </button>
                  ))}
                </div>
              )}
            </>)}

            {src === "hand" && (<>
              <span className="of-lab">{t("food")}</span>
              <input className="of-in" value={rec.name} onChange={(e) => set("name", e.target.value)}
                     placeholder={t("foodPlaceholder")} />
              <p className="of-hint">{t("per100")}</p>
              <div className="of-row" style={{ marginTop: 8 }}>
                {[["cho", t("carbs"), "g"], ["pro", t("protein"), "g"], ["fat", t("fat"), "g"]].map(([k, l, u]) => (
                  <NumField key={k} label={l} unit={u} value={rec[k]} onChange={(e) => set(k, e.target.value)} />))}
              </div>
              {detail && (<>
                <div className="of-row">
                  {[["fibre", t("fibre"), "g"], ["sugars", t("sugars"), "g"], ["sfa", t("satFat"), "g"]].map(([k, l, u]) => (
                    <NumField key={k} label={l} unit={u} value={rec[k]} onChange={(e) => set(k, e.target.value)} />))}
                </div>
                <div className="of-row">
                  {[["salt", t("salt"), "g"], ["kcal", t("calories"), "kcal"]].map(([k, l, u]) => (
                    <NumField key={k} label={l} unit={u} value={rec[k]} onChange={(e) => set(k, e.target.value)} />))}
                </div>
                <div className="of-row">
                  {[["k", t("potassium"), "mg"], ["p", t("phosphorus"), "mg"]].map(([k, l, u]) => (
                    <NumField key={k} label={l} unit={u} value={rec[k]} onChange={(e) => set(k, e.target.value)} />))}
                </div>
                <span className="of-lab" style={{ marginTop: 6 }}>{t("ingredients")}</span>
                <textarea className="of-ta" rows={3} value={rec.ing} onChange={(e) => set("ing", e.target.value)}
                          placeholder={t("ingredientsPlaceholder")} />
              </>)}
              <button className="of-btn ghost" style={{ marginTop: 12 }} onClick={() => { setRec(BLANK); setParsed(false); setMsg(""); }}>{t("clear")}</button>
            </>)}

            {msg && <div className="of-warnbox">{msg}</div>}
          </div>

          <div className="of-sect">
            <div className="of-legend">{t("basis")}</div>
            <div className="of-row">
              <NumField label={t("portion")} unit="g" value={portion}
                onChange={(e) => setPortion(e.target.value)} />
              {!detail && <div className="of-f" />}
              {detail && (
                <div className="of-f"><span className="of-lab">{t("carbsPerExchange")}</span>
                  <select className="of-sel" value={unit} onChange={(e) => setUnit(parseInt(e.target.value, 10))}>
                    <option value={15}>{t("unit15")}</option><option value={10}>{t("unit10")}</option>
                  </select></div>)}
            </div>
            {detail && (<>
              <span className="of-lab of-labrow">
                {t("foodGroup")}
                <Help label={t("foodGroupHelpLabel")}>{t("foodGroupHelp")}</Help>
              </span>
              <select className="of-sel" value={override} onChange={(e) => setOverride(e.target.value)}>
                <option value="">{t("auto")}{view ? `: ${t("g_" + view.auto)}` : ""}</option>
                {GROUP_IDS.map((k) => <option key={k} value={k}>{t("g_" + k)}</option>)}
              </select>
              <div className="of-check">
                <label>
                  <input type="checkbox" checked={renal} onChange={(e) => setRenal(e.target.checked)} style={{ accentColor: "var(--signal)" }} />
                  <span>{t("kidneyDiet")}</span>
                </label>
                <Help label={t("kidneyHelpLabel")}>{t("kidneyHelp")}</Help>
              </div>
              <div className="of-check">
                <label>
                  <input type="checkbox" checked={proTiers} onChange={(e) => setProTiers(e.target.checked)} style={{ accentColor: "var(--signal)" }} />
                  <span>{t("proteinTiers")}</span>
                </label>
                <Help label={t("proteinTiersHelpLabel")}>{t("proteinTiersHelp")}</Help>
              </div>
            </>)}
          </div>

          <div className="of-sect">
            <button className="of-more" onClick={() => setDetail(!detail)} aria-expanded={detail}>
              <span aria-hidden="true">{detail ? "\u2212" : "+"}</span>
              {detail ? t("fewerOptions") : t("moreOptions")}
            </button>
            <p className="of-hint">{t("moreHint")}</p>
          </div>

          <div className="of-sect">
            <div className="of-legend">{t("view")}</div>
            <div className="of-seg">
              <button data-on={!full ? 1 : 0} onClick={() => setFull(false)}>{t("simple")}</button>
              <button data-on={full ? 1 : 0} onClick={() => setFull(true)}>{t("detail")}</button>
            </div>
            <p className="of-hint">{t("viewHint")}</p>
          </div>
        </div>

        {/* sheet */}
        <div className="of-sheet">
          <div className="of-shead">
            <h2>{full ? t("detailTitle") : t("exchangesTitle")}</h2>
            {view && <span className="of-stamp">{r0(size)} {t("portionStamp")} · {unit} {t("perExchangeStamp")}</span>}
          </div>

          {!view && (
            <p className="of-empty">
              {full ? t("emptyDetail") : t("emptySimple")}
            </p>
          )}

          {view && !full && (<>
            <div className="of-pname">{rec.name || t("unnamedFood")}</div>
            <div className="of-pbrand">{r0(size)} {t("portionStamp")}</div>
            <div className="of-why">
              <i>{override ? t("viaSet") : view.why.via === "name" ? t("viaName")
                : view.why.via === "composition" ? t("viaFigures") : t("viaDefault")}</i>
              {t("countedAs")} <b>{t("g_" + view.gid)}</b>
              {override ? "." : `, ${t("because")} ${reason(view.why.key)}.`}
              {!override && view.why.via === "default" && ` ${t("setYourself")}`}
            </div>
            <div style={{ marginTop: 16 }}>{cards}</div>
            <div className="of-block">
              {plainFlags(view, renal, t).length === 0
                ? <Note kind="i">{t("nothingFlaggedPortion")}</Note>
                : plainFlags(view, renal, t).map((f) => <Note key={f.id} kind={f.cls}>{f.text}</Note>)}
            </div>
          </>)}

          {view && full && (<>
            <div className="of-pname">{rec.name || t("unnamedFood")}</div>
            <div className="of-pbrand">
              {parsed ? t("transcribed") : t("enteredByHand")}
            </div>
            <div className="of-why">
              <i>{override ? t("viaSet") : view.why.via === "name" ? t("viaName")
                : view.why.via === "composition" ? t("viaFigures") : t("viaDefault")}</i>
              {t("countedAs")} <b>{t("g_" + view.gid)}</b>
              {override
                ? `, ${t("setByHand")} ${t("g_" + view.auto)}, ${t("because")} ${reason(view.why.key)}.`
                : `, ${t("because")} ${reason(view.why.key)}.`}
            </div>

            <div style={{ marginTop: 16 }}>{cards}</div>

            {Math.abs(view.drift) > 10 && (
              <div className="of-block">
                <Note kind="w" title={t("driftTitle")}>
                  {view.pp.cho >= 5 ? t("driftCarb") : t("driftOther")}
                </Note>
              </div>)}

            <div className="of-block">
              <div className="of-btitle">{t("perPortion")}</div>
              <Line flag={view.na > 500 ? "a" : view.na > 250 ? "w" : ""} name={t("sodium")}
                    sub={`${r1(view.pp.salt)} g ${t("sodiumSub")}`} value={r0(view.na)} unit="mg" />
              <Line flag={view.pp.sugars > 15 ? "w" : ""} name={t("sugars")}
                    sub={t("sugarsSub")} value={r1(view.pp.sugars)} unit="g" />
              <Line flag={view.pp.fibre != null && view.pp.cho >= 8 && view.pp.fibre < 3 ? "w" : ""} name={t("fibre")}
                    sub={view.pp.fibre == null ? t("notStated")
                      : `${r1((view.pp.fibre / Math.max(view.pp.kcal, 1)) * 1000)} g ${t("fibreSub")}`}
                    value={view.pp.fibre == null ? "n/s" : r1(view.pp.fibre)}
                    unit={view.pp.fibre == null ? "" : "g"} />
              <Line flag={view.pp.sfa > 5 ? "w" : ""} name={t("saturatedFat")} value={r1(view.pp.sfa)} unit="g" />
              {renal && (<>
              <Line flag={view.pp.k != null && view.pp.k > 200 ? "w" : ""} name={t("potassium")}
                    sub={view.pp.k == null ? t("notStated") : t("potassiumSub")}
                    value={view.pp.k == null ? "n/s" : r0(view.pp.k)} unit={view.pp.k == null ? "" : "mg"} />
              <Line flag={view.pp.p != null && view.pp.pro > 0 && view.pp.p / view.pp.pro > 12 ? "w" : ""} name={t("phosphorus")}
                    sub={view.pp.p == null ? t("phosphorusNotStated")
                      : `${r1(view.pp.p / Math.max(view.pp.pro, 0.1))} ${t("phosphorusSub")}`}
                    value={view.pp.p == null ? "n/s" : r0(view.pp.p)} unit={view.pp.p == null ? "" : "mg"} />
              </>)}
            </div>

            <div className="of-block">
              <div className="of-btitle">{t("ingredientScan")}</div>
              {!rec.ing.trim() && <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                {renal ? t("noIngredientsRenal") : t("noIngredients")}</p>}
              {rec.ing.trim() && view.scans.filter((s) => renal || !RENAL_SCANS.has(s.id)).length === 0 && (
                <Note kind="i" title={t("nothingFlagged")}>
                  {renal ? t("nothingMatchedRenal") : t("nothingMatchedScan")}
                </Note>)}
              {view.scans.filter((s) => renal || !RENAL_SCANS.has(s.id)).map((s) => (
                <Note key={s.id} kind={s.cls} title={t("s_" + s.id)}>
                  <span>{s.hits.map((h) => <span className="of-hit" key={h}>{h}</span>)}</span>
                  {s.id === "phos" && <div style={{ marginTop: 6 }}>{t("phosNote")}</div>}
                  {s.id === "pot" && <div style={{ marginTop: 6 }}>{t("potNote")}</div>}
                </Note>))}
            </div>

            <p className="of-src">
              {t("provenance")}{" "}
              <a href="https://github.com/gmiliarakis/carbx#reference" target="_blank" rel="noreferrer">
                {t("howWorkedOut")}
              </a>
            </p>
          </>)}

          <div className="of-foot">{t("checkBeforeUse")}</div>
        </div>
      </div>
    </div>
  );
}
