import { useState } from "react";
import Tesseract from "tesseract.js";
import { decompose, gramsPerExchange, inferGroup, parseNutritionText, scanIngredients, r0, r1, num } from "./lib/exchange.js";

// One per-100 g record, filled in by hand, from a pasted label, from a photo,
// or from Open Food Facts. Everything after that runs offline.

const CSS = `
.of-root{
  --chassis:#22262B; --chassis2:#2B3037; --chassis3:#363C44;
  --sheet:#FBFBF9; --ink:#14171A; --rule:#D9DBD5; --rule2:#EDEEE9;
  --muted:#6B7178; --muted2:#9AA0A6;
  --signal:#0F6E63; --signal-w:#E3F0EE;
  --warn:#B4690E; --warn-w:#FBF0DE;
  --alert:#A3231C; --alert-w:#FBE7E5;
  --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  background:var(--chassis); color:var(--sheet);
  font-family:var(--sans); font-size:14px; line-height:1.45; min-height:100%;
  -webkit-font-smoothing:antialiased;
}
.of-root *{box-sizing:border-box}
.of-head{display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  padding:18px 22px 14px; border-bottom:1px solid var(--chassis3)}
.of-title{font-family:var(--mono); font-size:13px; letter-spacing:.16em; text-transform:uppercase; font-weight:600}
.of-sub{font-size:12px; color:var(--muted2); font-family:var(--mono)}
.of-grid{display:grid; grid-template-columns:340px 1fr; align-items:stretch}
@media (max-width:880px){ .of-grid{grid-template-columns:1fr} }
.of-rail{padding:16px 20px 40px; border-right:1px solid var(--chassis3); background:#E7E9E4}
.of-rail .of-legend,.of-rail .of-lab{color:#5C6167}
.of-rail .of-hint{color:#585D63}
.of-legend{font-family:var(--mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase;
  color:var(--muted2); padding-bottom:7px; margin-bottom:11px; border-bottom:1px solid var(--chassis3)}
.of-sect{margin-bottom:22px}
.of-lab{display:block; font-family:var(--mono); font-size:10px; letter-spacing:.09em;
  text-transform:uppercase; color:var(--muted2); margin-bottom:4px}
.of-in,.of-sel,.of-ta{width:100%; background:var(--chassis2); color:var(--sheet); border:1px solid var(--chassis3);
  border-radius:2px; padding:7px 8px; font-family:var(--mono); font-size:13px; font-variant-numeric:tabular-nums}
.of-ta{resize:vertical; line-height:1.5; font-size:12px}
.of-in:focus,.of-sel:focus,.of-ta:focus{outline:2px solid var(--signal); outline-offset:1px; border-color:var(--signal)}
.of-in::placeholder,.of-ta::placeholder{color:#5A6068}
.of-row{display:flex; gap:8px; margin-bottom:8px}
.of-f{flex:1; min-width:0}
.of-btn{width:100%; background:var(--signal); color:#fff; border:0; border-radius:2px; padding:8px;
  font-family:var(--mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; margin-top:9px}
.of-btn.ghost{background:var(--chassis2); border:1px solid var(--chassis3); color:var(--muted2)}
.of-btn:disabled{background:var(--chassis3); color:var(--muted); cursor:default}
.of-btn:focus-visible{outline:2px solid var(--sheet); outline-offset:2px}
.of-seg{display:flex; border:1px solid var(--chassis3); border-radius:2px; overflow:hidden; margin-bottom:10px; flex-wrap:wrap}
.of-seg button{flex:1 1 0; min-width:64px; background:var(--chassis2); color:var(--muted2); border:0; padding:7px 3px;
  cursor:pointer; font-family:var(--mono); font-size:10.5px; letter-spacing:.06em; text-transform:uppercase}
.of-seg button+button{border-left:1px solid var(--chassis3)}
.of-seg button[data-on="1"]{background:var(--signal); color:#fff}
.of-hint{font-size:11px; color:var(--muted); margin-top:6px; line-height:1.45}
.of-warnbox{font-size:11.5px; line-height:1.5; color:#E8C48A; background:#332A1A;
  border-left:2px solid var(--warn); padding:8px 10px; margin-top:9px}
.of-res{margin-top:10px; max-height:250px; overflow:auto; border:1px solid var(--chassis3); border-radius:2px}
.of-item{display:block; width:100%; text-align:left; background:var(--chassis2); border:0;
  border-bottom:1px solid var(--chassis3); padding:8px 10px; cursor:pointer; color:var(--sheet)}
.of-item:hover,.of-item:focus-visible{background:var(--chassis3); outline:none}
.of-item .n{font-size:12.5px; line-height:1.3}
.of-item .b{font-family:var(--mono); font-size:10.5px; color:var(--muted2); margin-top:2px}

.of-sheet{background:var(--sheet); color:var(--ink); min-height:100%; padding:20px 24px 44px}
.of-shead{display:flex; justify-content:space-between; align-items:baseline; gap:12px;
  border-bottom:2px solid var(--ink); padding-bottom:7px; margin-bottom:10px; flex-wrap:wrap}
.of-shead h2{margin:0; font-family:var(--mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase}
.of-stamp{font-family:var(--mono); font-size:10.5px; color:var(--muted)}
.of-pname{font-size:19px; font-weight:600; line-height:1.25; margin:12px 0 2px}
.of-pbrand{font-family:var(--mono); font-size:11.5px; color:var(--muted)}
.of-block{margin-top:24px}
.of-btitle{font-family:var(--mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase;
  color:var(--muted); border-bottom:1px solid var(--rule); padding-bottom:6px; margin-bottom:6px}

.of-ledger{width:100%; border-collapse:collapse; font-family:var(--mono); font-variant-numeric:tabular-nums}
.of-ledger th{font-size:9.5px; letter-spacing:.11em; text-transform:uppercase; color:var(--muted);
  text-align:right; padding:5px 7px; border-bottom:1px solid var(--rule); font-weight:500}
.of-ledger th:first-child{text-align:left}
.of-ledger td{font-size:12.5px; padding:7px; text-align:right; border-bottom:1px solid var(--rule2)}
.of-ledger td:first-child{text-align:left; font-family:var(--sans)}
.of-ledger tr[data-kind="draw"] td{color:var(--signal)}
.of-ledger tr[data-kind="draw"] td:first-child{font-weight:600}
.of-ledger tr[data-kind="res"] td{color:var(--muted); font-style:italic}
.of-ledger tr[data-kind="tot"] td{border-top:2px solid var(--ink); border-bottom:0; font-weight:700; font-size:13.5px; padding-top:9px}

.of-cards{display:grid; grid-template-columns:repeat(auto-fit,minmax(118px,1fr)); gap:1px;
  background:var(--rule); border:1px solid var(--rule)}
.of-card{background:var(--sheet); padding:10px 11px}
.of-card .k{font-family:var(--mono); font-size:9.5px; letter-spacing:.11em; text-transform:uppercase; color:var(--muted)}
.of-card .v{font-family:var(--mono); font-size:19px; font-variant-numeric:tabular-nums; margin-top:3px}
.of-card .s{font-family:var(--mono); font-size:10.5px; color:var(--muted); margin-top:1px}

.of-line{display:grid; grid-template-columns:14px 1fr auto; gap:10px; align-items:baseline;
  padding:7px 0; border-bottom:1px solid var(--rule2)}
.of-flagcol{font-family:var(--mono); font-size:12px; font-weight:700}
.of-nm{font-size:13px}
.of-nm small{display:block; color:var(--muted); font-size:11px; font-family:var(--mono); margin-top:2px; line-height:1.4}
.of-vl{font-family:var(--mono); font-variant-numeric:tabular-nums; font-size:14px; white-space:nowrap}
.of-vl u{text-decoration:none; color:var(--muted); font-size:10.5px; margin-left:3px}
.of-note{display:grid; grid-template-columns:14px 1fr; gap:10px; padding:8px 9px; margin:6px 0;
  border-left:2px solid; font-size:12.5px; line-height:1.45}
.of-note b{font-family:var(--mono); font-size:12px}
.of-note.w{background:var(--warn-w); border-color:var(--warn); color:#5C3705}
.of-note.a{background:var(--alert-w); border-color:var(--alert); color:#5E1310}
.of-note.i{background:var(--signal-w); border-color:var(--signal); color:#0A413A}
.of-hit{font-family:var(--mono); font-size:11.5px; display:inline-block; padding:2px 6px; margin:2px 4px 2px 0;
  border:1px solid currentColor; border-radius:2px}
.of-method{margin-top:24px; padding-top:12px; border-top:1px solid var(--rule);
  font-family:var(--mono); font-size:10.5px; color:var(--muted); line-height:1.7}
.of-method b{color:var(--ink); font-weight:600}
.of-empty{color:var(--muted); font-size:13px; margin-top:22px; max-width:56ch; line-height:1.65}
`;

function Note({ kind, title, children }) {
  return (<div className={"of-note " + kind}>
    <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{kind === "a" ? "!!" : kind === "w" ? "!" : "i"}</span>
    <span>{title && <b>{title}: </b>}{children}</span></div>);
}
function Line({ flag = "", name, sub, value, unit }) {
  const c = flag === "a" ? "var(--alert)" : flag === "w" ? "var(--warn)" : "var(--ink)";
  return (<div className="of-line">
    <span className="of-flagcol" style={{ color: flag ? c : "var(--muted2)" }}>{flag === "a" ? "!!" : flag === "w" ? "!" : ""}</span>
    <span className="of-nm">{name}{sub && <small>{sub}</small>}</span>
    <span className="of-vl" style={{ color: c }}>{value}{unit && <u>{unit}</u>}</span></div>);
}

const BLANK = { name: "", cho: "", pro: "", fat: "", fibre: "", sugars: "", sfa: "", salt: "", k: "", p: "", kcal: "", ing: "" };

const FIXTURES = [
  { n: "Test: starch + fat", v: { name: "Test: crackers", cho: "62", pro: "9", fat: "14", fibre: "4", sugars: "3", sfa: "6", salt: "1.4", k: "", p: "", kcal: "418", ing: "wheat flour, palm oil, salt, raising agent (E450, E500), sugar" } },
  { n: "Test: protein + fat", v: { name: "Test: sliced ham", cho: "1.2", pro: "19", fat: "9", fibre: "0", sugars: "1", sfa: "3.4", salt: "2.2", k: "320", p: "", kcal: "163", ing: "pork, water, salt, stabilisers (E451, E452), potassium chloride, sodium nitrite (E250)" } },
  { n: "Test: milk group", v: { name: "Test: semi-skimmed yoghurt", cho: "6.5", pro: "4.2", fat: "1.6", fibre: "0", sugars: "6.5", sfa: "1.0", salt: "0.13", k: "180", p: "120", kcal: "56", ing: "semi-skimmed milk, yoghurt cultures" } },
];

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
  const [subFibre, setSubFibre] = useState(true);
  const [proTiers, setProTiers] = useState(true);
  const [override, setOverride] = useState("");
  const [ocrLang, setOcrLang] = useState("eng+nld+deu+fra+ell");

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
    const N = p.nutriments || {};
    const s = (v) => (num(v) == null ? "" : String(num(v)));
    setRec({ name: p.product_name || p.code, cho: s(N.carbohydrates_100g), pro: s(N.proteins_100g),
      fat: s(N.fat_100g), fibre: s(N.fiber_100g), sugars: s(N.sugars_100g), sfa: s(N["saturated-fat_100g"]),
      salt: s(N.salt_100g != null ? N.salt_100g : num(N.sodium_100g) != null ? N.sodium_100g * 2.5 : null),
      k: s(N.potassium_100g), p: s(N.phosphorus_100g), kcal: s(N["energy-kcal_100g"]), ing: p.ingredients_text || "" });
    setSrc("hand"); setParsed(true);
    setMsg("Pulled from Open Food Facts, which is crowd-sourced and unverified. Check the figures against the pack.");
  };

  // computation
  const size = parseFloat(portion) || 0;
  let view = null;
  if (hasData && size > 0) {
    const f = size / 100;
    const pp = { cho: g("cho") * f, pro: g("pro") * f, fat: g("fat") * f, fibre: g("fibre") * f,
      sugars: g("sugars") * f, sfa: g("sfa") * f, salt: g("salt") * f,
      k: rec.k === "" ? null : g("k") * f, p: rec.p === "" ? null : g("p") * f,
      kcal: rec.kcal === "" ? g("cho") * 4 * f + g("pro") * 4 * f + g("fat") * 9 * f : g("kcal") * f };
    const auto = inferGroup({ cho: g("cho"), pro: g("pro"), fat: g("fat"),
      sugars: rec.sugars === "" ? null : g("sugars"),
      fibre: rec.fibre === "" ? null : g("fibre") }, rec.name, { portionG: size, unit });
    const gid = override || auto;
    const dec = decompose(pp, unit, gid, subFibre, { proteinTiers: proTiers });
    const per100 = { cho: g("cho"), pro: g("pro"), fat: g("fat") };
    dec.rounded = dec.rounded.map((o) => ({ ...o, gpe: gramsPerExchange(o.ref, per100) }));
    const rkcal = dec.rc * 4 + dec.rp * 4 + dec.rf * 9;
    const drift = pp.kcal > 0 ? ((rkcal - pp.kcal) / pp.kcal) * 100 : 0;
    const na = pp.salt * 400;
    view = { pp, auto, gid, dec, rkcal, drift, na, scans: scanIngredients(rec.ing) };
  }

  const GLABEL = { starch: "Starch", fruit: "Fruit", milk: "Milk", veg: "Non-starchy veg",
                   sweet: "Sweets / other CHO", "protein-only": "Protein only", "fat-only": "Fat only" };

  return (
    <div className="of-root">
      <style>{CSS}</style>
      <div className="of-head">
        <span className="of-title">CarbX</span>
        <span className="of-sub" style={{ marginLeft: "auto" }}>decision support · verify before use</span>
      </div>

      <div className="of-grid">
        <div className="of-rail">
          <div className="of-sect">
            <div className="of-legend">Source</div>
            <div className="of-seg">
              <button data-on={src === "hand" ? 1 : 0} onClick={() => setSrc("hand")}>By hand</button>
              <button data-on={src === "paste" ? 1 : 0} onClick={() => setSrc("paste")}>Paste label</button>
              <button data-on={src === "photo" ? 1 : 0} onClick={() => setSrc("photo")}>Photo</button>
              <button data-on={src === "off" ? 1 : 0} onClick={() => setSrc("off")}>OFF</button>
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
              <p className="of-hint">Per 100 g or 100 mL, from NEVO, FoodData Central, or the pack.</p>
              <div className="of-row" style={{ marginTop: 8 }}>
                {[["cho", "CHO g"], ["pro", "Prot g"], ["fat", "Fat g"]].map(([k, l]) => (
                  <div className="of-f" key={k}><span className="of-lab">{l}</span>
                    <input className="of-in" value={rec[k]} inputMode="decimal" onChange={(e) => set(k, e.target.value)} /></div>))}
              </div>
              <div className="of-row">
                {[["fibre", "Fibre g"], ["sugars", "Sugar g"], ["sfa", "SFA g"]].map(([k, l]) => (
                  <div className="of-f" key={k}><span className="of-lab">{l}</span>
                    <input className="of-in" value={rec[k]} inputMode="decimal" onChange={(e) => set(k, e.target.value)} /></div>))}
              </div>
              <div className="of-row">
                {[["salt", "Salt g"], ["k", "K mg"], ["p", "P mg"], ["kcal", "kcal"]].map(([k, l]) => (
                  <div className="of-f" key={k}><span className="of-lab">{l}</span>
                    <input className="of-in" value={rec[k]} inputMode="decimal" onChange={(e) => set(k, e.target.value)} /></div>))}
              </div>
              <span className="of-lab" style={{ marginTop: 6 }}>Ingredients list</span>
              <textarea className="of-ta" rows={3} value={rec.ing} onChange={(e) => set("ing", e.target.value)}
                        placeholder="paste for the additive scan" />
              <div className="of-row" style={{ marginTop: 9 }}>
                <select className="of-sel" value="" onChange={(e) => { const f = FIXTURES[e.target.value]; if (f) { setRec(f.v); setParsed(false); } }}>
                  <option value="">Load a test food…</option>
                  {FIXTURES.map((f, i) => <option key={i} value={i}>{f.n}</option>)}
                </select>
              </div>
              <button className="of-btn ghost" onClick={() => { setRec(BLANK); setParsed(false); setMsg(""); }}>Clear</button>
            </>)}

            {msg && <div className="of-warnbox">{msg}</div>}
          </div>

          <div className="of-sect">
            <div className="of-legend">Basis</div>
            <div className="of-row">
              <div className="of-f"><span className="of-lab">Portion g</span>
                <input className="of-in" value={portion} inputMode="decimal" onChange={(e) => setPortion(e.target.value)} /></div>
              <div className="of-f"><span className="of-lab">CHO per unit</span>
                <select className="of-sel" value={unit} onChange={(e) => setUnit(parseInt(e.target.value, 10))}>
                  <option value={15}>15 g · US</option><option value={12}>12 g · BE</option><option value={10}>10 g · KE/NL</option>
                </select></div>
            </div>
            <span className="of-lab">Carbohydrate group</span>
            <select className="of-sel" value={override} onChange={(e) => setOverride(e.target.value)}>
              <option value="">Auto{view ? `: ${GLABEL[view.auto]}` : ""}</option>
              {Object.entries(GLABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, fontSize: 12, color: "#5C6167", cursor: "pointer" }}>
              <input type="checkbox" checked={subFibre} onChange={(e) => setSubFibre(e.target.checked)} style={{ accentColor: "var(--signal)" }} />
              <span>Net off fibre when over 5 g</span>
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, fontSize: 12, color: "#5C6167", cursor: "pointer" }}>
              <input type="checkbox" checked={proTiers} onChange={(e) => setProTiers(e.target.checked)} style={{ accentColor: "var(--signal)" }} />
              <span>Protein list has fat tiers</span>
            </label>
            <p className="of-hint">
              On for a list with lean, medium-fat and high-fat protein, off for a single protein
              category. Naming only, the figures are the same either way.
            </p>
          </div>
        </div>

        {/* sheet */}
        <div className="of-sheet">
          <div className="of-shead">
            <h2>Decomposition</h2>
            {view && <span className="of-stamp">{r0(size)} g · {unit} g CHO per unit</span>}
          </div>

          {!view && (
            <p className="of-empty">
              Enter a food for its exchange decomposition and condition flags. Paste an ingredients list too, it
              also scans for phosphate and potassium additives.
            </p>
          )}

          {view && (<>
            <div className="of-pname">{rec.name || "Unnamed food"}</div>
            <div className="of-pbrand">
              {parsed ? "transcribed, check against pack" : "entered by hand"} · classified as {GLABEL[view.gid]}
              {override ? " (overridden)" : ""}
            </div>

            <div className="of-block">
              <div className="of-btitle">Ledger</div>
              <table className="of-ledger">
                <thead><tr><th>Step</th><th>CHO g</th><th>Protein g</th><th>Fat g</th></tr></thead>
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

              <div className="of-cards" style={{ marginTop: 14 }}>
                {view.dec.rounded.length === 0
                  ? <div className="of-card"><div className="k">Result</div><div className="v">0</div>
                      <div className="s">under half an exchange, free food</div></div>
                  : view.dec.rounded.map((o) => (
                      <div className="of-card" key={o.label}>
                        <div className="k">{o.label}</div><div className="v">{o.ex}</div>
                        <div className="s">exchange{o.ex === 1 ? "" : "s"}{o.gpe ? ` · ${r0(o.gpe)} g/ex` : ""}</div></div>))}
              </div>

              <div style={{ marginTop: 12 }}>
                <Line flag={Math.abs(view.drift) > 10 ? "w" : ""} name="Reconciliation"
                      sub={`${r0(view.pp.kcal)} kcal declared vs ${r0(view.rkcal)} kcal rebuilt from the rounded exchanges`}
                      value={`${view.drift >= 0 ? "+" : ""}${r1(view.drift)}`} unit="%" />
              </div>
              {Math.abs(view.drift) > 10 && (
                <Note kind="w" title="Drift above 10%">
                  Rounding to half exchanges has cost more than a tenth of the energy. For a food eaten in quantity,
                  count it in grams of carbohydrate instead of exchanges.
                </Note>)}
            </div>

            <div className="of-block">
              <div className="of-btitle">Per portion, condition flags</div>
              <Line flag={view.na > 500 ? "a" : view.na > 250 ? "w" : ""} name="Sodium"
                    sub={`${r1(view.pp.salt)} g salt equivalent · daily ceiling 2000 mg`} value={r0(view.na)} unit="mg" />
              <Line flag={view.pp.sugars > 15 ? "w" : ""} name="Sugars"
                    sub="total, not free sugars" value={r1(view.pp.sugars)} unit="g" />
              <Line flag={view.pp.fibre >= 3 ? "" : "w"} name="Fibre"
                    sub={`${r1((view.pp.fibre / Math.max(view.pp.kcal, 1)) * 1000)} g per 1000 kcal · target ≥ 14`}
                    value={r1(view.pp.fibre)} unit="g" />
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
                  differently-worded additive will slip past it.
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
              <b>Method.</b> CHO group drawn first at {unit} g per unit, its protein and fat netted off. Milk
              carries the fat on the label, its variant named by fat per exchange (≤3 g fat-free, 4-7 g
              reduced-fat, ≥8 g whole). Residual protein at 7 g per exchange
              {proTiers ? ", tier named by fat per exchange (≤3 g lean, 4-7 g medium, ≥8 g high)" : ""},
              carrying the fat on the label.
              Residual fat at 5 g. The g/ex figures use this food's own composition, not the portion size.<br />
              <b>Provenance.</b> Every figure comes from what you entered or transcribed. Label parsing extracts
              text, it doesn't estimate.<br />
              <b>Scan limits.</b> Matches E-numbers, and additive names in English, Dutch, German, French
              and Greek. Anything worded outside those lists is not detected.
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}
