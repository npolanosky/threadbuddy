/**
 * ThreadBuddy — UI controller.
 * Reads control state, calls the engine, and renders the dashboard (External/Internal dimensions,
 * MOW, tap-drill table, coating) reproducing the layout of the original ME ThreadPal.
 */

import {
  calculate,
  calculateCoating,
  measurementOverWires,
  wireConstant,
} from "../engine/src/index.js";
import type { ThreadFamily, ThreadResult, Limits, CoatingResult } from "../engine/src/index.js";
import { CATALOG, type CatalogEntry } from "../engine/src/data/catalog.js";

interface Variant { code: ThreadFamily; label: string; }
interface FamilyGroup {
  id: string;
  label: string;
  units: "inch" | "metric";
  catalogFamily: ThreadFamily;
  variants: Variant[];
  classesExt: string[];
  classesInt: string[];
}

const UNIFIED_EXT = ["1A", "2A", "3A"];
const UNIFIED_INT = ["1B", "2B", "3B"];
const METRIC_EXT = ["4g", "6g", "8g", "4h", "6h"];
const METRIC_INT = ["4H", "5H", "6H", "7H"];
const PROV = ["medium", "close", "free"];
const PIPE_CLS = ["std"];

const GROUPS: FamilyGroup[] = [
  { id: "unified", label: "Unified Series 60°", units: "inch", catalogFamily: "UN",
    variants: [{ code: "UN", label: "UN" }, { code: "UNR", label: "UNR" }, { code: "UNJ", label: "UNJ" }],
    classesExt: UNIFIED_EXT, classesInt: UNIFIED_INT },
  { id: "metric", label: "ISO Metric 60°", units: "metric", catalogFamily: "M",
    variants: [{ code: "M", label: "M" }, { code: "MJ", label: "MJ" }],
    classesExt: METRIC_EXT, classesInt: METRIC_INT },
  { id: "acme", label: "Acme 29°", units: "inch", catalogFamily: "ACME",
    variants: [{ code: "ACME", label: "General Purpose" }, { code: "STUB_ACME", label: "Stub" }],
    classesExt: ["2G", "3G", "4G"], classesInt: ["2G", "3G", "4G"] },
  { id: "whitworth", label: "Whitworth 55° (BSW/BSF)", units: "inch", catalogFamily: "WHITWORTH",
    variants: [{ code: "WHITWORTH", label: "Whitworth" }], classesExt: PROV, classesInt: PROV },
  { id: "trap", label: "ISO Trapezoidal 30°", units: "metric", catalogFamily: "TRAPEZOIDAL",
    variants: [{ code: "TRAPEZOIDAL", label: "Tr" }], classesExt: ["7e", "8e"], classesInt: ["7H", "8H"] },
  { id: "buttress", label: "Buttress 7°/45°", units: "inch", catalogFamily: "BUTTRESS",
    variants: [{ code: "BUTTRESS", label: "US Buttress" }, { code: "ISO_BUTTRESS", label: "ISO 3°/30°" }],
    classesExt: PROV, classesInt: PROV },
  { id: "npt", label: "American Taper Pipe NPT", units: "inch", catalogFamily: "NPT",
    variants: [{ code: "NPT", label: "NPT" }, { code: "NPTF", label: "NPTF (Dryseal)" }], classesExt: PIPE_CLS, classesInt: PIPE_CLS },
  { id: "nps", label: "American Straight Pipe NPSM/NPSL", units: "inch", catalogFamily: "NPSM",
    variants: [{ code: "NPSM", label: "NPSM" }, { code: "NPSL", label: "NPSL" }], classesExt: PIPE_CLS, classesInt: PIPE_CLS },
  { id: "bsp", label: "ISO Pipe BSPT/BSPP", units: "inch", catalogFamily: "BSPT",
    variants: [{ code: "BSPT", label: "BSPT (R)" }, { code: "BSPP", label: "BSPP (G)" }], classesExt: PIPE_CLS, classesInt: PIPE_CLS },
  { id: "unm", label: "Unified Miniature (UNM)", units: "metric", catalogFamily: "UNM",
    variants: [{ code: "UNM", label: "UNM" }], classesExt: METRIC_EXT, classesInt: METRIC_INT },
  { id: "sti", label: "STI Insert (Unified)", units: "inch", catalogFamily: "STI_UN",
    variants: [{ code: "STI_UN", label: "STI" }], classesExt: UNIFIED_EXT, classesInt: ["2B", "3B"] },
  { id: "stim", label: "STI Insert (Metric)", units: "metric", catalogFamily: "STI_M",
    variants: [{ code: "STI_M", label: "STI-M" }], classesExt: METRIC_EXT, classesInt: ["5H", "4H5H"] },
  { id: "pg", label: "Metric Conduit (Pg)", units: "metric", catalogFamily: "PG_CONDUIT",
    variants: [{ code: "PG_CONDUIT", label: "Pg" }], classesExt: METRIC_EXT, classesInt: METRIC_INT },
];

const STANDARD_SRC: Record<string, string> = {
  UN: "ASME B1.1-2003", UNR: "ASME B1.1-2003", UNJ: "SAE AS8879C-2003",
  M: "ISO 965-1 / ASME B1.13M-2005", MJ: "ASME B1.21M-1997", STI_M: "ASME B18.29.2M-2005",
  ACME: "ASME B1.5-1997", STUB_ACME: "ASME B1.5-1997",
  WHITWORTH: "BS 84:1956", TRAPEZOIDAL: "ISO 2901:1993",
  BUTTRESS: "ASME B1.9-1973", ISO_BUTTRESS: "DIN 513-1985",
  NPT: "ASME B1.20.1", NPTF: "ASME B1.20.1 / B1.20.3", NPSM: "ASME B1.20.1", NPSL: "ASME B1.20.1",
  BSPT: "ISO 7-1:1994", BSPP: "ISO 7-1:1994", UNM: "ASME B1.10-1958", STI_UN: "ASME B18.29.1-2010",
  PG_CONDUIT: "DIN 40430-1971",
};

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const radio = (name: string): string =>
  (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value;

let group: FamilyGroup = GROUPS[0];
let variant: ThreadFamily = group.variants[0].code;

const currentSizes = (): CatalogEntry[] => CATALOG.filter((e) => e.family === group.catalogFamily);

// ---- Population ----
function populateFamily(): void {
  const sel = $<HTMLSelectElement>("family");
  sel.innerHTML = "";
  for (const g of GROUPS) sel.add(new Option(g.label, g.id));
}

function populateVariants(): void {
  const row = $("variantRow");
  row.innerHTML = "";
  variant = group.variants[0].code;
  if (group.variants.length < 2) { row.classList.add("hidden"); return; }
  row.classList.remove("hidden");
  group.variants.forEach((v, i) => {
    const lbl = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio"; input.name = "variant"; input.value = v.code; input.checked = i === 0;
    input.addEventListener("change", () => { variant = v.code; recompute(); });
    lbl.append(input, document.createTextNode(" " + v.label));
    row.appendChild(lbl);
  });
}

function populateSizes(): void {
  const sel = $<HTMLSelectElement>("size");
  sel.innerHTML = "";
  sel.add(new Option("— Custom / type below —", "custom"));
  const sizes = currentSizes();
  if (group.id === "stim") {
    // Metric STI spans coarse + fine pitch series — group them under labelled headings.
    let seriesSeen = "";
    let og: HTMLOptGroupElement | null = null;
    sizes.forEach((e, idx) => {
      if (e.series !== seriesSeen) {
        seriesSeen = e.series;
        og = document.createElement("optgroup");
        og.label = e.series === "fine" ? "Fine pitch" : "Coarse pitch";
        sel.add(og);
      }
      og!.appendChild(new Option(e.label, String(idx)));
    });
  } else {
    sizes.forEach((e, idx) => sel.add(new Option(e.label, String(idx))));
  }
  const pref =
    group.id === "stim" ? "M6 x 1" :
    group.id === "unm" ? "1.00" :
    group.units === "metric" ? "M10 x 1.5" :
    "1/4-20";
  const def = sizes.findIndex((e) => e.label.startsWith(pref));
  if (def >= 0) { sel.value = String(def); applySize(sizes[def]); }
  else if (sizes.length) { sel.value = "0"; applySize(sizes[0]); }
  else sel.value = "custom";
}

function populateClasses(): void {
  const ext = $<HTMLSelectElement>("classExternal");
  const int = $<HTMLSelectElement>("classInternal");
  ext.innerHTML = ""; int.innerHTML = "";
  group.classesExt.forEach((c) => ext.add(new Option(c, c)));
  group.classesInt.forEach((c) => int.add(new Option(c, c)));
  ext.value = group.classesExt.includes("2A") ? "2A"
    : group.classesExt.includes("6g") ? "6g" : group.classesExt[0];
  int.value = group.classesInt.includes("2B") ? "2B"
    : group.classesInt.includes("6H") ? "6H" : group.classesInt[0];
}

function applySize(e: CatalogEntry): void {
  $<HTMLInputElement>("major").value = String(e.majorDiameter);
  if (e.tpi !== undefined) $<HTMLInputElement>("tpi").value = String(e.tpi);
  if (e.pitch !== undefined) $<HTMLInputElement>("pitch").value = String(e.pitch);
}

// ---- Units / formatting ----
const displayUnits = (): "inch" | "metric" => radio("units") as "inch" | "metric";
function conv(v: number): number {
  if (!Number.isFinite(v)) return v;
  const d = displayUnits();
  if (group.units === d) return v;
  return group.units === "inch" ? v * 25.4 : v / 25.4;
}
/** Convert a user-entered display-unit value back to the family's native unit. */
function convToNative(v: number): number {
  if (!Number.isFinite(v)) return v;
  const d = displayUnits();
  if (group.units === d) return v;
  return group.units === "inch" ? v / 25.4 : v * 25.4;
}
function fmt(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return "—";
  return conv(v).toFixed(displayUnits() === "metric" ? 3 : 4);
}
const tol = (l?: Limits): string =>
  l && Number.isFinite(l.max) && Number.isFinite(l.min) ? fmt(l.max - l.min) : "—";
const mean = (l?: Limits): string =>
  l && Number.isFinite(l.max) && Number.isFinite(l.min) ? fmt((l.max + l.min) / 2) : "—";
const setText = (id: string, t: string): void => { $(id).textContent = t; };

// External-panel (and measurement-over-wires) output field ids — blanked when there is no
// external member to report, e.g. for STI insert families where only the tapped hole is defined.
const EXTERNAL_FIELD_IDS = [
  "desig-ext", "ext-allow", "ext-maj-max", "ext-maj-min", "ext-maj-mean", "ext-maj-tol",
  "ext-pd-max", "ext-pd-min", "ext-pd-mean", "ext-pd-tol", "ext-min-max", "ext-min-min",
  "ext-min-mean", "ext-flat", "ext-rr-max", "ext-rr-min", "ext-height", "ext-pdo",
];
const WIRE_FIELD_IDS = ["mow-max", "mow-min", "wire-best", "wire-max", "wire-min", "wire-const"];
const blankFields = (ids: string[]): void => ids.forEach((id) => setText(id, "—"));

// ---- Fusion Pitch Diameter Offset (thread milling) ----
// Diametric offset for Autodesk Fusion's Thread toolpath. The ideal-tool baseline is
// major − minor = 2 × radial thread height. With a real thread mill, the NYC CNC / Saunders
// method corrects for the tool's crest ("tip flat" c):  external 1.4·base − √3·c ;
// internal 1.2·base − √3·c (model at the drilled minor). The tip flat is measured, or estimated
// as Ø ÷ 100 (their rule of thumb for cutters up to 0.5"; ≈ the best fit to their tool data).
function toolCrest(): { crest: number; source: "measured" | "estimated" } | null {
  const measured = convToNative(parseFloat($<HTMLInputElement>("tmFlat").value));
  if (Number.isFinite(measured) && measured > 0) return { crest: measured, source: "measured" };
  const dia = convToNative(parseFloat($<HTMLInputElement>("tmDia").value));
  if (Number.isFinite(dia) && dia > 0) return { crest: dia / 100, source: "estimated" };
  return null;
}
function fusionPdo(
  radialHeight: number,
  hand: "external" | "internal",
  tc: ReturnType<typeof toolCrest>,
): number {
  const base = 2 * radialHeight;
  if (!tc) return base;
  const mult = hand === "external" ? 1.4 : 1.2;
  return mult * base - Math.sqrt(3) * tc.crest;
}

// ---- Render ----
function render(rExt: ThreadResult | null, rInt: ThreadResult | null, src: ThreadResult): void {
  const tc = toolCrest();
  setText("tm-flat-used", tc ? `${fmt(tc.crest)} ${tc.source === "estimated" ? "(est)" : "(meas)"}` : "—");
  if (rExt) {
    setText("desig-ext", rExt.designation);
    setText("ext-allow", fmt(rExt.allowance));
    setText("ext-maj-max", fmt(rExt.majorDiameter.external?.max));
    setText("ext-maj-min", fmt(rExt.majorDiameter.external?.min));
    setText("ext-maj-mean", mean(rExt.majorDiameter.external));
    setText("ext-maj-tol", tol(rExt.majorDiameter.external));
    setText("ext-pd-max", fmt(rExt.pitchDiameter.external?.max));
    setText("ext-pd-min", fmt(rExt.pitchDiameter.external?.min));
    setText("ext-pd-mean", mean(rExt.pitchDiameter.external));
    setText("ext-pd-tol", tol(rExt.pitchDiameter.external));
    setText("ext-min-max", fmt(rExt.minorDiameter.external?.max));
    setText("ext-min-min", fmt(rExt.minorDiameter.external?.min));
    setText("ext-min-mean", mean(rExt.minorDiameter.external));
    setText("ext-flat", fmt(rExt.flatAtRoot?.external));
    setText("ext-rr-max", fmt(rExt.rootRadius?.max));
    setText("ext-rr-min", fmt(rExt.rootRadius?.min));
    setText("ext-height", fmt(rExt.threadHeight));
    setText("ext-pdo", fmt(fusionPdo(rExt.threadHeight, "external", tc)));
  } else {
    blankFields(EXTERNAL_FIELD_IDS);
  }
  // Coating for the external thread feeds the optional MOW "use coating" recompute.
  const coatExt = rExt ? getCoating(rExt, "external") : null;
  if (rExt) renderWires(rExt, coatExt);
  else blankFields(WIRE_FIELD_IDS);
  renderCoating(rExt, rInt);
  // Highlight Starts/Lead panel when multi-start or a custom length of engagement is set.
  const startsChanged = (src.starts ?? 1) !== 1 || $<HTMLInputElement>("loe").value.trim() !== "";
  $("panel-starts").classList.toggle("changed", startsChanged);

  // Tapered pipe layout swap (NPT/NPTF/BSPT): special fields, disabled %/LoE/form-tap.
  const taper = rExt?.taper ?? rInt?.taper ?? null;
  document.body.classList.toggle("taper", !!taper);
  $<HTMLInputElement>("loe").disabled = !!taper;
  if (taper) {
    renderTaper(taper);
    setText("tp-thread-angle", `${src.threadAngleDeg}° form`);
  }
  if (rInt) {
    setText("desig-int", rInt.designation);
    setText("int-min-min", fmt(rInt.minorDiameter.internal?.min));
    setText("int-min-max", fmt(rInt.minorDiameter.internal?.max));
    setText("int-min-mean", mean(rInt.minorDiameter.internal));
    setText("int-min-tol", tol(rInt.minorDiameter.internal));
    setText("int-pd-min", fmt(rInt.pitchDiameter.internal?.min));
    setText("int-pd-max", fmt(rInt.pitchDiameter.internal?.max));
    setText("int-pd-mean", mean(rInt.pitchDiameter.internal));
    setText("int-pd-tol", tol(rInt.pitchDiameter.internal));
    setText("int-maj-min", fmt(rInt.majorDiameter.internal?.min));
    setText("int-maj-max", fmt(rInt.majorDiameter.internal?.max));
    setText("int-flat", fmt(rInt.flatAtRoot?.internal));
    setText("int-height", fmt(rInt.threadHeight));
    setText("int-pdo", fmt(fusionPdo(rInt.threadHeight, "internal", tc)));
    renderTapDrill(rInt);
  }
  setText("o-pitch", fmt(src.pitch));
  setText("o-lead", fmt(src.lead));
  const useHelix = radio("anglename") === "helix";
  setText("angleLabel", useHelix ? "Helix angle" : "Lead angle");
  const angVal = useHelix ? src.helixAngleDeg : src.leadAngleDeg;
  setText("o-leadangle", Number.isFinite(angVal) ? angVal.toFixed(3) + "°" : "—");

  const notes = $("notes");
  notes.innerHTML = "";
  for (const n of new Set([...(rExt?.notes ?? []), ...(rInt?.notes ?? [])])) {
    const li = document.createElement("li"); li.textContent = n; notes.appendChild(li);
  }
  setText("standard-src", "Governing standard: " + (STANDARD_SRC[variant] ?? "—"));
}

function renderWires(r: ThreadResult, coatExt: CoatingResult | null): void {
  const w = r.wires;
  const maxBox = $("mow-max");
  const minBox = $("mow-min");
  if (!w || !r.pitchDiameter.external) {
    ["mow-max", "mow-min", "wire-best", "wire-max", "wire-min", "wire-const"].forEach((id) => setText(id, "—"));
    maxBox.classList.remove("changed");
    minBox.classList.remove("changed");
    return;
  }
  setText("wire-best", fmt(w.bestWire));
  setText("wire-max", fmt(w.maxWire));
  setText("wire-min", fmt(w.minWire));

  // Effective wire: user alternate (display→native) if set, else the best wire.
  const altRaw = parseFloat($<HTMLInputElement>("altWire").value);
  const altSet = Number.isFinite(altRaw) && altRaw > 0;
  const wire = altSet ? convToNative(altRaw) : w.bestWire;

  // Effective pitch diameter: coating-adjusted (pre-process) limits if "use coating" is on.
  const useCoat = $<HTMLInputElement>("useCoating").checked && !!coatExt;
  const pd = useCoat ? coatExt!.before.pitch : r.pitchDiameter.external;
  const angle = r.threadAngleDeg;

  const mowMax = measurementOverWires(pd.max, wire, r.pitch, angle);
  const mowMin = measurementOverWires(pd.min, wire, r.pitch, angle);
  setText("mow-max", fmt(mowMax));
  setText("mow-min", fmt(mowMin));
  setText("wire-const", fmt(wireConstant(wire, r.pitch, angle)));

  const changed = altSet || useCoat;
  maxBox.classList.toggle("changed", changed);
  minBox.classList.toggle("changed", changed);
}

/** Fill the tapered-pipe (NPT/NPTF/BSPT) display fields. */
function renderTaper(t: NonNullable<ThreadResult["taper"]>): void {
  const range = (l: Limits): string => `${fmt(l.min)}–${fmt(l.max)}`;
  setText("tp-pipedia", fmt(t.pipeDiameter));
  setText("tp-maj-face", fmt(t.external.major.pipeFace));
  setText("tp-maj-gage", fmt(t.external.major.gageNotch));
  setText("tp-pd-face", fmt(t.external.pitch.pipeFace));
  setText("tp-pd-gage", fmt(t.external.pitch.gageNotch));
  setText("tp-min-face", fmt(t.external.minor.pipeFace));
  setText("tp-min-gage", fmt(t.external.minor.gageNotch));
  setText("tp-rad-crest", t.radii ? fmt(t.radii.crest.max) : "—");
  setText("tp-rad-root", t.radii ? fmt(t.radii.root.max) : "—");
  setText("tp-height", fmt(t.heightMean));
  // Diametric Fusion PDO for taper pipe, tool-adjusted like the standard families.
  const tc = toolCrest();
  setText("tp-ext-pdo", fmt(fusionPdo(t.heightMean, "external", tc)));
  setText("tp-int-pdo", fmt(fusionPdo(t.heightMean, "internal", tc)));
  setText("tp-imin-l1", fmt(t.internal.minor.pipeEndL1));
  setText("tp-imin-face", fmt(t.internal.minor.pipeFace));
  setText("tp-ipd-gage", fmt(t.internal.pitchGageNotch));
  setText("tp-tapdrill", `${fmt(t.internal.tapDrill)} (${t.internal.tapDrillName})`);
  setText("tp-tapdepth", fmt(t.internal.tapDepthRef));
  setText("tp-flat-crest", range(t.flat.crest));
  setText("tp-flat-root", range(t.flat.root));
  setText("tp-trunc-crest", range(t.truncation.crest));
  setText("tp-trunc-root", range(t.truncation.root));
  setText("tp-l1", fmt(t.lengths.L1));
  setText("tp-l2", fmt(t.lengths.L2));
  setText("tp-l3", fmt(t.lengths.L3));
  setText("tp-l4", fmt(t.lengths.L4));
  setText("tp-taper-angle", Number.isFinite(t.taperAngleDeg) ? t.taperAngleDeg.toFixed(3) + "° / side" : "—");
  // 2-wire measurement over wires at the gauge notch.
  if (t.mowGageNotch !== undefined) {
    setText("mow-max", fmt(t.mowGageNotch));
    setText("mow-min", "—");
  }
}

/** Build a coating result for a result+hand from the current coating inputs, or null. */
function getCoating(r: ThreadResult | null, hand: "external" | "internal"): CoatingResult | null {
  if (!r) return null;
  const thk = convToNative(parseFloat($<HTMLInputElement>("coatThk").value));
  if (!Number.isFinite(thk) || thk <= 0) return null;
  const tolRaw = convToNative(parseFloat($<HTMLInputElement>("coatTol").value));
  const present = hand === "external" ? r.majorDiameter.external : r.majorDiameter.internal;
  if (!present || !Number.isFinite(present.max)) return null;
  return calculateCoating({
    result: r, hand, thickness: thk,
    tolerance: Number.isFinite(tolRaw) ? tolRaw : 0,
    mode: radio("coatMode") as "coating" | "polishing",
  });
}

function renderTapDrill(r: ThreadResult): void {
  setText("tap-theo", fmt(r.tapDrillInfo?.theoretical));
  const tbody = $("drill-rows");
  tbody.innerHTML = "";
  const info = r.tapDrillInfo;
  if (!info) { tbody.innerHTML = `<tr><td colspan="3">—</td></tr>`; return; }
  const metric = displayUnits() === "metric";
  const nativeVal = (c: (typeof info.candidates)[number]): number => (r.units === "metric" ? c.mm : c.inch);
  // Recommended = the candidate closest to the theoretical hole diameter.
  let recIdx = 0;
  let best = Infinity;
  info.candidates.forEach((c, i) => {
    const d = Math.abs(nativeVal(c) - info.theoretical);
    if (d < best) { best = d; recIdx = i; }
  });
  const rows: HTMLTableRowElement[] = [];
  info.candidates.forEach((c, i) => {
    const tr = document.createElement("tr");
    const dia = metric ? c.mm.toFixed(3) : c.inch.toFixed(4);
    tr.innerHTML = `<td>${c.name}</td><td>${dia}</td><td>${c.percent}%</td>`;
    if (c.percent >= 65 && c.percent <= 80) tr.classList.add("good-row");
    if (i === recIdx) tr.classList.add("recommended");
    tbody.appendChild(tr);
    rows.push(tr);
  });
  // Center the recommended drill in the scroll viewport.
  const scroll = document.getElementById("drill-scroll");
  const rec = rows[recIdx];
  if (scroll && rec) scroll.scrollTop = Math.max(0, rec.offsetTop - (scroll.clientHeight - rec.offsetHeight) / 2);
}

function renderCoating(rExt: ThreadResult | null, rInt: ThreadResult | null): void {
  const ids = ["coat-maj-bmax", "coat-maj-bmin", "coat-maj-amax", "coat-maj-amin",
    "coat-pd-bmax", "coat-pd-bmin", "coat-pd-amax", "coat-pd-amin",
    "coat-min-bmax", "coat-min-bmin", "coat-min-amax", "coat-min-amin"];
  const hand = radio("coatHand") as "external" | "internal";
  const c = getCoating(hand === "external" ? rExt : rInt, hand);
  if (!c) {
    ids.forEach((id) => setText(id, "—"));
    $("panel-coating").classList.remove("changed");
    return;
  }
  setText("coat-maj-bmax", fmt(c.before.major.max)); setText("coat-maj-bmin", fmt(c.before.major.min));
  setText("coat-maj-amax", fmt(c.after.major.max)); setText("coat-maj-amin", fmt(c.after.major.min));
  setText("coat-pd-bmax", fmt(c.before.pitch.max)); setText("coat-pd-bmin", fmt(c.before.pitch.min));
  setText("coat-pd-amax", fmt(c.after.pitch.max)); setText("coat-pd-amin", fmt(c.after.pitch.min));
  setText("coat-min-bmax", fmt(c.before.minor.max)); setText("coat-min-bmin", fmt(c.before.minor.min));
  setText("coat-min-amax", fmt(c.after.minor.max)); setText("coat-min-amin", fmt(c.after.minor.min));
  $("panel-coating").classList.add("changed");
}

// ---- Inputs ----
function readInput(classOfFit: string) {
  const major = parseFloat($<HTMLInputElement>("major").value);
  const starts = parseInt($<HTMLInputElement>("starts").value || "1", 10);
  const loe = parseFloat($<HTMLInputElement>("loe").value);
  const percent = parseFloat($<HTMLInputElement>("percent").value);
  const base: any = {
    family: variant, majorDiameter: major, classOfFit, starts,
    sharpRoot: $<HTMLInputElement>("sharpRoot").checked,
    tapType: radio("tapType"),
  };
  if (Number.isFinite(loe)) base.lengthOfEngagement = loe;
  if (Number.isFinite(percent)) base.targetPercent = percent;
  if (group.units === "metric") base.pitch = parseFloat($<HTMLInputElement>("pitch").value);
  else base.tpi = parseFloat($<HTMLInputElement>("tpi").value);
  return base;
}

function recompute(): void {
  const major = parseFloat($<HTMLInputElement>("major").value);
  if (!Number.isFinite(major) || major <= 0) return;
  let rExt: ThreadResult | null = null;
  let rInt: ThreadResult | null = null;
  try { rExt = calculate(readInput($<HTMLSelectElement>("classExternal").value)); } catch (e) { console.warn(e); }
  try { rInt = calculate(readInput($<HTMLSelectElement>("classInternal").value)); } catch (e) { console.warn(e); }
  // STI insert families define only the tapped hole; there is no external member to report.
  if (group.id === "sti" || group.id === "stim") rExt = null;
  const src = rExt ?? rInt;
  if (src) render(rExt, rInt, src);
}

/** Reset every control to its default state (Unified 1/4-20 UNC, 2A/2B, inch). */
function resetToDefaults(): void {
  $<HTMLSelectElement>("family").value = "unified";
  $<HTMLInputElement>("starts").value = "1";
  $<HTMLInputElement>("loe").value = "";
  $<HTMLInputElement>("percent").value = "75";
  $<HTMLInputElement>("altWire").value = "";
  $<HTMLInputElement>("coatThk").value = "";
  $<HTMLInputElement>("coatTol").value = "";
  $<HTMLInputElement>("tmDia").value = "";
  $<HTMLInputElement>("tmFlat").value = "";
  $<HTMLInputElement>("sharpRoot").checked = false;
  $<HTMLInputElement>("useCoating").checked = false;
  const pick = (name: string, val: string): void => {
    const el = document.querySelector(`input[name="${name}"][value="${val}"]`) as HTMLInputElement | null;
    if (el) el.checked = true;
  };
  pick("units", "inch"); pick("anglename", "lead"); pick("tapType", "cut");
  pick("coatMode", "coating"); pick("coatHand", "external");
  onFamilyChange(); // repopulates variants/classes/sizes (defaults to 1/4-20, 2A/2B) and recomputes
}

// ---- Wiring ----
function onFamilyChange(): void {
  group = GROUPS.find((g) => g.id === $<HTMLSelectElement>("family").value) ?? GROUPS[0];
  const metric = group.units === "metric";
  $("tpiField").classList.toggle("hidden", metric);
  $("pitchField").classList.toggle("hidden", !metric);
  setText("majorLabel", metric ? "Major (mm)" : "Major (in)");
  (document.querySelector(`input[name="units"][value="${group.units}"]`) as HTMLInputElement).checked = true;
  populateVariants();
  populateClasses();
  populateSizes();
  recompute();
}

function init(): void {
  populateFamily();
  onFamilyChange();
  $("family").addEventListener("change", onFamilyChange);
  $("size").addEventListener("change", () => {
    const v = $<HTMLSelectElement>("size").value;
    if (v !== "custom") applySize(currentSizes()[parseInt(v, 10)]);
    recompute();
  });
  ["major", "tpi", "pitch", "starts", "loe", "percent", "altWire", "coatThk", "coatTol", "tmDia", "tmFlat"].forEach((id) =>
    $(id).addEventListener("input", () => {
      if (["major", "tpi", "pitch"].includes(id)) $<HTMLSelectElement>("size").value = "custom";
      recompute();
    }));
  ["classExternal", "classInternal"].forEach((id) => $(id).addEventListener("change", recompute));
  document.querySelectorAll('input[name="units"],input[name="anglename"],input[name="tapType"],input[name="coatMode"],input[name="coatHand"],#sharpRoot,#useCoating')
    .forEach((el) => el.addEventListener("change", recompute));
  $("resetWire").addEventListener("click", () => { $<HTMLInputElement>("altWire").value = ""; $<HTMLInputElement>("useCoating").checked = false; recompute(); });
  $("resetTm").addEventListener("click", () => { $<HTMLInputElement>("tmDia").value = ""; $<HTMLInputElement>("tmFlat").value = ""; recompute(); });
  $("resetAll").addEventListener("click", resetToDefaults);
  $("printBtn").addEventListener("click", () => window.print());

  // Tap-Sensei popup: shown on hover/focus via CSS; click toggles it for touch devices.
  const senseiWrap = $("sensei-wrap");
  const senseiPop = $("sensei-pop");
  senseiWrap.addEventListener("click", (e) => { e.stopPropagation(); senseiPop.classList.toggle("show"); });
  document.addEventListener("click", () => senseiPop.classList.remove("show"));
}

init();

// Register the service worker for offline / installable PWA use.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {/* offline support is best-effort */});
  });
}

// "Install as desktop app" button — appears only when the browser offers PWA installation.
let deferredInstall: any = null;
const installBtn = document.getElementById("installBtn") as HTMLButtonElement | null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstall = e;
  if (installBtn) installBtn.hidden = false;
});
installBtn?.addEventListener("click", async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  try { await deferredInstall.userChoice; } catch { /* user dismissed */ }
  deferredInstall = null;
  installBtn.hidden = true;
});
window.addEventListener("appinstalled", () => { if (installBtn) installBtn.hidden = true; });
