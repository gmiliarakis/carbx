import { useState } from "react";
import Tesseract from "tesseract.js";
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
  --lab-fam:var(--sans); --lab-case:none; --lab-sp:.005em; --lab-size:11.5px; --lab-w:500;
  background:var(--sheet); color:var(--ink);
  font-family:var(--sans); font-size:15px; line-height:1.5;
  min-height:100vh; display:flex; flex-direction:column;
  -webkit-font-smoothing:antialiased;
}
.of-root *{box-sizing:border-box}
.of-head{display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  padding:18px 22px 14px; background:var(--bar); color:var(--sheet)}
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
  color:var(--muted); margin-bottom:4px}
.of-in,.of-sel,.of-ta{width:100%; background:var(--field); color:var(--ink); border:1px solid var(--line);
  border-radius:2px; padding:8px 9px; font-family:var(--mono); font-size:14px; font-variant-numeric:tabular-nums}
.of-ta{resize:vertical; line-height:1.5; font-size:12px}
.of-in:focus,.of-sel:focus,.of-ta:focus{outline:2px solid var(--signal); outline-offset:1px; border-color:var(--signal)}
.of-in::placeholder,.of-ta::placeholder{color:#A4A8A2}
.of-row{display:flex; gap:8px; margin-bottom:8px}
.of-f{flex:1; min-width:0}
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

.of-ledger{width:100%; border-collapse:collapse; font-family:var(--mono); font-variant-numeric:tabular-nums}
.of-ledger th{font-family:var(--lab-fam); font-size:var(--lab-size); letter-spacing:var(--lab-sp);
  text-transform:var(--lab-case); color:var(--muted);
  text-align:right; padding:5px 7px; border-bottom:1px solid var(--rule); font-weight:600}
.of-ledger th:first-child{text-align:left}
.of-ledger td{font-size:13.5px; padding:8px 7px; text-align:right; border-bottom:1px solid var(--rule2)}
.of-ledger td:first-child{text-align:left; font-family:var(--sans)}
.of-ledger tr[data-kind="draw"] td{color:var(--ink); font-weight:600}
.of-ledger tr[data-kind="res"] td{color:var(--muted); font-style:italic}
.of-ledger tr[data-kind="tot"] td{border-top:2px solid var(--ink); border-bottom:0; font-weight:700; font-size:13.5px; padding-top:9px}

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
.of-note b{font-family:var(--mono); font-size:12px}
.of-note.w{background:var(--warn-w); border-color:var(--warn); color:#5C3705}
.of-note.a{background:var(--alert-w); border-color:var(--alert); color:#5E1310}
.of-note.i{background:var(--signal-w); border-color:var(--ink); color:#2B2F33}
.of-hit{font-family:var(--mono); font-size:11.5px; display:inline-block; padding:2px 6px; margin:2px 4px 2px 0;
  border:1px solid currentColor; border-radius:2px}
.of-method{margin-top:24px; padding-top:12px; border-top:1px solid var(--rule);
  font-family:var(--sans); font-size:12.5px; color:var(--muted); line-height:1.65}
.of-method b{color:var(--ink); font-weight:600}
.of-empty{color:var(--muted); font-size:14.5px; margin-top:22px; max-width:56ch; line-height:1.6}
.of-foot{margin-top:auto; padding-top:22px; text-align:right; font-family:var(--sans);
  font-size:11.5px; color:var(--muted)}

.of-use{display:flex; align-items:flex-start; gap:14px; padding:13px 22px;
  background:var(--signal-w); border-bottom:1px solid var(--line);
  font-size:13.5px; line-height:1.55; color:#2B2F33}
.of-use p{margin:0; max-width:92ch}
.of-use b{font-weight:600}
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
function Line({ flag = "", name, sub, value, unit }) {
  const c = flag === "a" ? "var(--alert)" : flag === "w" ? "var(--warn)" : "var(--ink)";
  return (<div className="of-line">
    <span className="of-flagcol" style={{ color: flag ? c : "var(--muted2)" }}>{flag === "a" ? "!!" : flag === "w" ? "!" : ""}</span>
    <span className="of-nm">{name}{sub && <small>{sub}</small>}</span>
    <span className="of-vl" style={{ color: c }}>{value}{unit && <u>{unit}</u>}</span></div>);
}

function plainFlags({ pp, na, scans }) {
  const out = [];
  if (na > 500) out.push({ id: "na", cls: "a", text: `High in salt, ${r0(na)} mg sodium in this portion.` });
  else if (na > 250) out.push({ id: "na", cls: "w", text: `Salty, ${r0(na)} mg sodium in this portion.` });
  if (pp.sugars > 15) out.push({ id: "sug", cls: "w", text: `${r1(pp.sugars)} g sugar in this portion.` });
  if (pp.sfa > 5) out.push({ id: "sfa", cls: "w", text: `${r1(pp.sfa)} g saturated fat in this portion.` });
  // Only worth saying on a food that carries carbohydrate, and only when the
  // label actually declared fibre. Blank is unknown, not zero: flagging olive
  // oil and chicken as low in fibre is noise that costs the real flags their
  // weight. Half a starch exchange is the floor for calling a food a
  // carbohydrate food at all.
  if (pp.fibre != null && pp.cho >= 8 && pp.fibre < 3)
    out.push({ id: "fib", cls: "w",
      text: `Low in fibre, ${r1(pp.fibre)} g against ${r1(pp.cho)} g of carbohydrate in this portion.` });
  if (pp.k != null && pp.k > 200) out.push({ id: "k", cls: "w", text: `High in potassium, ${r0(pp.k)} mg in this portion.` });
  if (pp.p != null && pp.pro > 0 && pp.p / pp.pro > 12)
    out.push({ id: "p", cls: "w", text: `High in phosphorus for the protein it carries, ${r0(pp.p)} mg in this portion.` });
  scans.forEach((sc) => out.push({ id: "scan-" + sc.id, cls: sc.cls, text: `${sc.title}: ${sc.hits.join(", ")}.` }));
  return out;
}

const USE_NOTICE_KEY = "carbx.intended-use.v1";


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
        ? <div className="of-card"><div className="k">Result</div><div className="v">0</div>
            <div className="s">under half an exchange, counts as free</div></div>
        : view.dec.rounded.map((o) => (
            <div className="of-card" key={o.label}>
              <div className="k">{o.label}</div><div className="v">{o.ex}</div>
              <div className="s">exchange{o.ex === 1 ? "" : "s"}{o.gpe ? ` · ${r0(o.gpe)} g each` : ""}</div></div>))}
    </div>);

  const GLABEL = { starch: "Starch", fruit: "Fruit", milk: "Milk", veg: "Non-starchy veg",
                   sweet: "Sweets and other carbs", "protein-only": "Protein only", "fat-only": "Fat only" };

  return (
    <div className="of-root">
      <style>{CSS}</style>
      <div className="of-head">
        <span className="of-title">CarbX</span>
      </div>

      {useNotice && (
        <div className="of-use" role="note">
          <p>
            <b>What this is.</b> A teaching and self-management aid that converts a nutrition
            declaration into exchanges. It is not a medical device, it does not calculate insulin
            doses, and it does not replace assessment by a dietitian or physician. Every figure
            comes from the label you enter, so check the parsed values against the pack before
            acting on them.
          </p>
          <button type="button" onClick={dismissUseNotice}>Understood</button>
        </div>
      )}

      <div className="of-grid">
        <div className="of-rail">
          <div className="of-sect">
            <div className="of-legend">Source</div>
            <div className="of-seg">
              <button data-on={src === "hand" ? 1 : 0} onClick={() => setSrc("hand")}>Manual</button>
              <button data-on={src === "paste" ? 1 : 0} onClick={() => setSrc("paste")}>Text</button>
              <button data-on={src === "photo" ? 1 : 0} onClick={() => setSrc("photo")}>Photo</button>
              <button data-on={src === "off" ? 1 : 0} onClick={() => setSrc("off")}>Database</button>
            </div>

            {src === "paste" && (<>
              <span className="of-lab">Nutrition declaration, as printed</span>
              <textarea className="of-ta" rows={7} value={paste} onChange={(e) => setPaste(e.target.value)}
                placeholder={"Voedingswaarde per 100 g\nEnergie 418 kcal\nVetten 14 g\nwaarvan verzadigd 6 g\nKoolhydraten 62 g\nwaarvan suikers 3 g\nVezels 4 g\nEiwitten 9 g\nZout 1,4 g\n\nIngrediënten: ..."} />
              <button className="of-btn" onClick={() => parseLabel(null)} disabled={busy || paste.trim().length < 10}>
                {busy ? "Reading…" : "Read label"}
              </button>
              <p className="of-hint">Parsed locally, in English, Dutch, German, French and Greek. Values come only from your text, never inferred.</p>
            </>)}

            {src === "photo" && (<>
              <span className="of-lab">Photo of the nutrition panel</span>
              <input type="file" accept="image/*" onChange={onPhoto}
                style={{ width: "100%", fontSize: 12, color: "#5C6167", fontFamily: "var(--mono)" }} />
              <span className="of-lab" style={{ marginTop: 8 }}>OCR language</span>
              <select className="of-sel" value={ocrLang} onChange={(e) => setOcrLang(e.target.value)}>
                <option value="eng+nld+deu+fra+ell">Auto (all supported)</option>
                <option value="eng">English</option>
                <option value="nld">Dutch</option>
                <option value="deu">German</option>
                <option value="fra">French</option>
                <option value="ell">Greek</option>
              </select>
              {busy && <p className="of-hint">Reading the panel on-device… (first run downloads OCR language data once, then works offline)</p>}
              <p className="of-hint">Include the ingredients list for the additive scan. OCR accuracy varies, check the figures.</p>
            </>)}

            {src === "off" && (<>
              <div className="of-row">
                <div className="of-f">
                  <span className="of-lab">Database</span>
                  <select className="of-sel" value={cc} onChange={(e) => setCc(e.target.value)}>
                    <option value="world">World</option><option value="nl">Netherlands</option>
                    <option value="gr">Greece</option><option value="be">Belgium</option>
                    <option value="de">Germany</option><option value="fr">France</option>
                  </select>
                </div>
              </div>
              <span className="of-lab">Product or barcode</span>
              <input className="of-in" value={q} onChange={(e) => setQ(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && offSearch()} placeholder="volkoren brood" />
              <button className="of-btn" onClick={offSearch} disabled={busy}>{busy ? "Searching…" : "Search"}</button>
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
              <span className="of-lab">Food</span>
              <input className="of-in" value={rec.name} onChange={(e) => set("name", e.target.value)}
                     placeholder="description" />
              <p className="of-hint">Per 100 g or 100 mL, straight off the pack.</p>
              <div className="of-row" style={{ marginTop: 8 }}>
                {[["cho", "Carbs g"], ["pro", "Protein g"], ["fat", "Fat g"]].map(([k, l]) => (
                  <div className="of-f" key={k}><span className="of-lab">{l}</span>
                    <input className="of-in" value={rec[k]} inputMode="decimal" onChange={(e) => set(k, e.target.value)} /></div>))}
              </div>
              {detail && (<>
                <div className="of-row">
                  {[["fibre", "Fibre g"], ["sugars", "Sugars g"], ["sfa", "Sat fat g"]].map(([k, l]) => (
                    <div className="of-f" key={k}><span className="of-lab">{l}</span>
                      <input className="of-in" value={rec[k]} inputMode="decimal" onChange={(e) => set(k, e.target.value)} /></div>))}
                </div>
                <div className="of-row">
                  {[["salt", "Salt g"], ["kcal", "Calories"]].map(([k, l]) => (
                    <div className="of-f" key={k}><span className="of-lab">{l}</span>
                      <input className="of-in" value={rec[k]} inputMode="decimal" onChange={(e) => set(k, e.target.value)} /></div>))}
                </div>
                <div className="of-row">
                  {[["k", "Potassium mg"], ["p", "Phosphorus mg"]].map(([k, l]) => (
                    <div className="of-f" key={k}><span className="of-lab">{l}</span>
                      <input className="of-in" value={rec[k]} inputMode="decimal" onChange={(e) => set(k, e.target.value)} /></div>))}
                </div>
                <span className="of-lab" style={{ marginTop: 6 }}>Ingredients list</span>
                <textarea className="of-ta" rows={3} value={rec.ing} onChange={(e) => set("ing", e.target.value)}
                          placeholder="paste for the additive scan" />
              </>)}
              <button className="of-btn ghost" style={{ marginTop: 12 }} onClick={() => { setRec(BLANK); setParsed(false); setMsg(""); }}>Clear</button>
            </>)}

            {msg && <div className="of-warnbox">{msg}</div>}
          </div>

          <div className="of-sect">
            <div className="of-legend">Basis</div>
            <div className="of-row">
              <div className="of-f"><span className="of-lab">Portion g</span>
                <input className="of-in" value={portion} inputMode="decimal" onChange={(e) => setPortion(e.target.value)} /></div>
              {!detail && <div className="of-f" />}
              {detail && (
                <div className="of-f"><span className="of-lab">Carbs per exchange</span>
                  <select className="of-sel" value={unit} onChange={(e) => setUnit(parseInt(e.target.value, 10))}>
                    <option value={15}>15 g (US)</option><option value={10}>10 g (NL)</option>
                  </select></div>)}
            </div>
            {detail && (<>
              <span className="of-lab of-labrow">
                Food group
                <Help label="What food group means">
                  Which group the carbohydrate is counted from: starch, fruit, milk, vegetables or sweets.
                  Each group carries a different amount of protein and fat per exchange, so this changes the result.
                  Auto picks the group from the figures and the name. Set it yourself if you disagree.
                </Help>
              </span>
              <select className="of-sel" value={override} onChange={(e) => setOverride(e.target.value)}>
                <option value="">Auto{view ? `: ${GLABEL[view.auto]}` : ""}</option>
                {Object.entries(GLABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <div className="of-check">
                <label>
                  <input type="checkbox" checked={proTiers} onChange={(e) => setProTiers(e.target.checked)} style={{ accentColor: "var(--signal)" }} />
                  <span>Protein list has fat tiers</span>
                </label>
                <Help label="What protein fat tiers means">
                  On for a list that separates lean, medium-fat and high-fat protein. Off for a single protein
                  category. This changes the names only, the figures stay the same either way.
                </Help>
              </div>
            </>)}
          </div>

          <div className="of-sect">
            <button className="of-more" onClick={() => setDetail(!detail)} aria-expanded={detail}>
              <span aria-hidden="true">{detail ? "\u2212" : "+"}</span>
              {detail ? "Fewer options" : "More options"}
            </button>
            <p className="of-hint">{detail
              ? "Every field, the food group, the carbs-per-exchange convention, and the full working."
              : "The rest of the label, the food group, and the full working."}</p>
          </div>
        </div>

        {/* sheet */}
        <div className="of-sheet">
          <div className="of-shead">
            <h2>{detail ? "Working" : "Exchanges"}</h2>
            {view && <span className="of-stamp">{r0(size)} g portion · {unit} g carbs per exchange</span>}
          </div>

          {!view && (
            <p className="of-empty">
              {detail
                ? "Enter a food to see the working behind its exchanges, and every value behind the flags. Paste an ingredients list too, it also scans for phosphate and potassium additives."
                : "Enter a food to see how many exchanges the portion holds, and anything worth knowing about it."}
            </p>
          )}

          {view && !detail && (<>
            <div className="of-pname">{rec.name || "Unnamed food"}</div>
            <div className="of-pbrand">{r0(size)} g portion</div>
            <div className="of-why">
              <i>{override ? "you set" : view.why.via === "name" ? "by name"
                : view.why.via === "composition" ? "by figures" : "no match"}</i>
              Counted as <b>{GLABEL[view.gid]}</b>
              {override ? "." : `, because ${view.why.rule}.`}
              {!override && view.why.via === "default"
                && " Set the type yourself on the left if that is wrong."}
            </div>
            <div style={{ marginTop: 16 }}>{cards}</div>
            <div className="of-block">
              {plainFlags(view).length === 0
                ? <Note kind="i">Nothing flagged in this portion.</Note>
                : plainFlags(view).map((f) => <Note key={f.id} kind={f.cls}>{f.text}</Note>)}
            </div>
          </>)}

          {view && detail && (<>
            <div className="of-pname">{rec.name || "Unnamed food"}</div>
            <div className="of-pbrand">
              {parsed ? "transcribed, check against pack" : "entered by hand"}
            </div>
            <div className="of-why">
              <i>{override ? "you set" : view.why.via === "name" ? "by name"
                : view.why.via === "composition" ? "by figures" : "no match"}</i>
              Counted as <b>{GLABEL[view.gid]}</b>
              {override
                ? `, set by hand. Left to itself it would have read ${GLABEL[view.auto]}, because ${view.why.rule}.`
                : `, because ${view.why.rule}.`}
            </div>

            <div className="of-block">
              <div className="of-btitle">Ledger</div>
              <table className="of-ledger">
                <thead><tr><th>Step</th><th>Carbs g</th><th>Protein g</th><th>Fat g</th></tr></thead>
                <tbody>
                  {view.dec.steps.map((s, i) => (
                    <tr key={i} data-kind={s.kind}>
                      <td>{s.label}</td>
                      <td>{s.kind === "draw" && !s.cho ? "0" : r1(s.cho)}</td>
                      <td>{s.kind === "draw" && !s.pro ? "0" : r1(s.pro)}</td>
                      <td>{s.kind === "draw" && !s.fat ? "0" : r1(s.fat)}</td>
                    </tr>))}
                  <tr data-kind="tot"><td>Rebuilt from rounded exchanges</td>
                    <td>{r1(view.dec.rc)}</td><td>{r1(view.dec.rp)}</td><td>{r1(view.dec.rf)}</td></tr>
                </tbody>
              </table>

              <div style={{ marginTop: 14 }}>{cards}</div>

              <div style={{ marginTop: 12 }}>
                <Line flag={Math.abs(view.drift) > 10 ? "w" : ""} name="Reconciliation"
                      sub={`${r0(view.pp.kcal)} calories declared, ${r0(view.rkcal)} rebuilt from the rounded exchanges`}
                      value={`${view.drift >= 0 ? "+" : ""}${r1(view.drift)}`} unit="%" />
              </div>
              {Math.abs(view.drift) > 10 && (
                <Note kind="w" title="Drift above 10%">
                  Rounding to half exchanges has cost more than a tenth of the energy.
                  {view.pp.cho >= 5
                    ? " For a food eaten in quantity, count it in grams of carbohydrate instead of exchanges."
                    : " This portion carries almost no carbohydrate, so the drift is in the protein and fat exchanges" +
                      " rather than the carbohydrate. Half an exchange is a coarse unit on a portion this small;" +
                      " weigh the food rather than reading the count as exact."}
                </Note>)}
            </div>

            <div className="of-block">
              <div className="of-btitle">Per portion, condition flags</div>
              <Line flag={view.na > 500 ? "a" : view.na > 250 ? "w" : ""} name="Sodium"
                    sub={`${r1(view.pp.salt)} g salt · daily ceiling 2000 mg`} value={r0(view.na)} unit="mg" />
              <Line flag={view.pp.sugars > 15 ? "w" : ""} name="Sugars"
                    sub="total, not free sugars" value={r1(view.pp.sugars)} unit="g" />
              <Line flag={view.pp.fibre != null && view.pp.cho >= 8 && view.pp.fibre < 3 ? "w" : ""} name="Fibre"
                    sub={view.pp.fibre == null ? "not stated, treat as unknown"
                      : `${r1((view.pp.fibre / Math.max(view.pp.kcal, 1)) * 1000)} g per 1000 kcal · target ≥ 14`}
                    value={view.pp.fibre == null ? "n/s" : r1(view.pp.fibre)}
                    unit={view.pp.fibre == null ? "" : "g"} />
              <Line flag={view.pp.sfa > 5 ? "w" : ""} name="Saturated fat" value={r1(view.pp.sfa)} unit="g" />
              <Line flag={view.pp.k != null && view.pp.k > 200 ? "w" : ""} name="Potassium"
                    sub={view.pp.k == null ? "not stated, treat as unknown" : "renal tiers: <100 low · 100-200 medium · >200 high"}
                    value={view.pp.k == null ? "n/s" : r0(view.pp.k)} unit={view.pp.k == null ? "" : "mg"} />
              <Line flag={view.pp.p != null && view.pp.pro > 0 && view.pp.p / view.pp.pro > 12 ? "w" : ""} name="Phosphorus"
                    sub={view.pp.p == null ? "not mandatory in the EU or US, see additive scan below"
                      : `${r1(view.pp.p / Math.max(view.pp.pro, 0.1))} mg per g protein · target < 12`}
                    value={view.pp.p == null ? "n/s" : r0(view.pp.p)} unit={view.pp.p == null ? "" : "mg"} />
            </div>

            <div className="of-block">
              <div className="of-btitle">Ingredient scan</div>
              {!rec.ing.trim() && <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                No ingredients list entered. Paste one on the left to scan for phosphate, potassium, sodium and added-sugar sources.</p>}
              {rec.ing.trim() && view.scans.length === 0 && (
                <Note kind="i" title="Nothing flagged">
                  No phosphate, potassium, sodium or added-sugar terms matched. The scan reads text, so an unlisted or
                  differently-worded additive will be missed.
                </Note>)}
              {view.scans.map((s) => (
                <Note key={s.id} kind={s.cls} title={s.title}>
                  <span>{s.hits.map((h) => <span className="of-hit" key={h}>{h}</span>)}</span>
                  {s.id === "phos" && <div style={{ marginTop: 6 }}>
                    Additive phosphorus is absorbed close to completely, against roughly 40-60% for the phytate-bound
                    phosphorus in plant foods. This product therefore carries more absorbable load than any composition
                    table would show. In CKD, clearing additive sources usually gains more than restricting whole foods.
                  </div>}
                  {s.id === "pot" && <div style={{ marginTop: 6 }}>
                    Typical of reduced-sodium products: potassium chloride replaces salt, which helps blood
                    pressure but works against a potassium restriction.
                  </div>}
                </Note>))}
            </div>

            <div className="of-method">
              <b>Method.</b> Carbohydrate group drawn first at {unit} g per exchange, its protein and fat netted off. Milk
              carries the fat on the label, its variant named by fat per exchange (≤3 g fat-free, 4-7 g
              reduced-fat, ≥8 g whole). Residual protein at 7 g per exchange
              {proTiers ? ", tier named by fat per exchange (≤3 g lean, 4-7 g medium, ≥8 g high)" : ""},
              carrying the fat on the label.
              Residual fat at 5 g. The grams-per-exchange figures use this food's own composition, not the portion size.<br />
              <b>Provenance.</b> Every figure comes from what you entered or transcribed. Label parsing extracts
              text, it doesn't estimate.<br />
              <b>Scan limits.</b> Matches E-numbers, and additive names in English, Dutch, German, French
              and Greek. Anything worded outside those lists is not detected.
            </div>
          </>)}

          <div className="of-foot">Check before use.</div>
        </div>
      </div>
    </div>
  );
}
