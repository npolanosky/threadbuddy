/**
 * ThreadBuddy — UI controller.
 * Reads control state, calls the engine, and renders the dashboard (External/Internal dimensions,
 * MOW, tap-drill table, coating) reproducing the layout of the original ME ThreadPal.
 */

import { calculate, calculateCoating } from "../engine/src/index.js";
import type { ThreadFamily, ThreadResult, Limits } from "../engine/src/index.js";
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
    variants: [{ code: "STI_UN", label: "STI" }], classesExt: UNIFIED_EXT, classesInt: UNIFIED_INT },
  { id: "stim", label: "STI Insert (Metric)", units: "metric", catalogFamily: "STI_M",
    variants: [{ code: "STI_M", label: "STI-M" }], classesExt: METRIC_EXT, classesInt: METRIC_INT },
  { id: "pg", label: "Metric Conduit (Pg)", units: "metric", catalogFamily: "PG_CONDUIT",
    variants: [{ code: "PG_CONDUIT", label: "Pg" }], classesExt: METRIC_EXT, classesInt: METRIC_INT },
];

const STANDARD_SRC: Record<string, string> = {
  UN: "ASME B1.1-2003", UNR: "ASME B1.1-2003", UNJ: "SAE AS8879C-2003",
  M: "ISO 965-1 / ASME B1.13M-2005", MJ: "ASME B1.21M-1997", STI_M: "ISO 965 (insert basis)",
  ACME: "ASME B1.5-1997", STUB_ACME: "ASME B1.5-1997",
  WHITWORTH: "BS 84:1956", TRAPEZOIDAL: "ISO 2901:1993",
  BUTTRESS: "ASME B1.9-1973", ISO_BUTTRESS: "DIN 513-1985",
  NPT: "ASME B1.20.1", NPTF: "ASME B1.20.1 / B1.20.3", NPSM: "ASME B1.20.1", NPSL: "ASME B1.20.1",
  BSPT: "ISO 7-1:1994", BSPP: "ISO 7-1:1994", UNM: "ASME B1.10-1958", STI_UN: "STI manufacturer ref",
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
  sizes.forEach((e, idx) => sel.add(new Option(e.label, String(idx))));
  const def = sizes.findIndex((e) => e.label.startsWith("1/2-13") || e.label.startsWith("M10 x 1.5"));
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
function fmt(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return "—";
  return conv(v).toFixed(displayUnits() === "metric" ? 3 : 4);
}
const tol = (l?: Limits): string =>
  l && Number.isFinite(l.max) && Number.isFinite(l.min) ? fmt(l.max - l.min) : "—";
const mean = (l?: Limits): string =>
  l && Number.isFinite(l.max) && Number.isFinite(l.min) ? fmt((l.max + l.min) / 2) : "—";
const setText = (id: string, t: string): void => { $(id).textContent = t; };

// ---- Render ----
function render(rExt: ThreadResult | null, rInt: ThreadResult | null, src: ThreadResult): void {
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
    renderWires(rExt);
  }
  renderCoating(rExt, rInt);
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
    renderTapDrill(rInt);
  }
  setText("o-pitch", fmt(src.pitch));
  setText("o-lead", fmt(src.lead));
  const useHelix = radio("anglename") === "helix";
  setText("angleLabel", useHelix ? "Helix angle" : "Lead angle");
  setText("o-leadangle", Number.isFinite(src.leadAngleDeg) ? src.leadAngleDeg.toFixed(3) + "°" : "—");

  const notes = $("notes");
  notes.innerHTML = "";
  for (const n of new Set([...(rExt?.notes ?? []), ...(rInt?.notes ?? [])])) {
    const li = document.createElement("li"); li.textContent = n; notes.appendChild(li);
  }
  setText("standard-src", "Governing standard: " + (STANDARD_SRC[variant] ?? "—"));
}

function renderWires(r: ThreadResult): void {
  const w = r.wires;
  setText("mow-max", fmt(w?.mow.max));
  setText("mow-min", fmt(w?.mow.min));
  setText("wire-best", fmt(w?.bestWire));
  setText("wire-max", fmt(w?.maxWire));
  setText("wire-min", fmt(w?.minWire));
  setText("wire-const", fmt(w?.constantBest));
  const alt = $("alt-mow");
  if (w?.alternate) {
    alt.textContent = `${fmt(w.alternate.mow.max)} / ${fmt(w.alternate.mow.min)}`;
    alt.classList.toggle("warn", w.alternate.belowMajor);
  } else { alt.textContent = "—"; alt.classList.remove("warn"); }
}

function renderTapDrill(r: ThreadResult): void {
  setText("tap-theo", fmt(r.tapDrillInfo?.theoretical));
  const tbody = $("drill-rows");
  tbody.innerHTML = "";
  const metric = displayUnits() === "metric";
  for (const c of r.tapDrillInfo?.candidates ?? []) {
    const tr = document.createElement("tr");
    const dia = metric ? c.mm.toFixed(3) : c.inch.toFixed(4);
    tr.innerHTML = `<td>${c.name}</td><td>${dia}</td><td>${c.percent}%</td>`;
    if (c.percent >= 65 && c.percent <= 80) tr.classList.add("good-row");
    tbody.appendChild(tr);
  }
  if (!r.tapDrillInfo) tbody.innerHTML = `<tr><td colspan="3">—</td></tr>`;
}

function renderCoating(rExt: ThreadResult | null, rInt: ThreadResult | null): void {
  const thk = parseFloat($<HTMLInputElement>("coatThk").value);
  const ids = ["coat-maj-bmax", "coat-maj-bmin", "coat-maj-amax", "coat-maj-amin",
    "coat-pd-bmax", "coat-pd-bmin", "coat-pd-amax", "coat-pd-amin"];
  const hand = radio("coatHand") as "external" | "internal";
  const r = hand === "external" ? rExt : rInt;
  const present = hand === "external" ? r?.majorDiameter.external : r?.majorDiameter.internal;
  if (!r || !Number.isFinite(thk) || thk <= 0 || !present) {
    ids.forEach((id) => setText(id, "—"));
    return;
  }
  const c = calculateCoating({ result: r, hand, thickness: thk, mode: radio("coatMode") as "coating" | "polishing" });
  setText("coat-maj-bmax", fmt(c.before.major.max)); setText("coat-maj-bmin", fmt(c.before.major.min));
  setText("coat-maj-amax", fmt(c.after.major.max)); setText("coat-maj-amin", fmt(c.after.major.min));
  setText("coat-pd-bmax", fmt(c.before.pitch.max)); setText("coat-pd-bmin", fmt(c.before.pitch.min));
  setText("coat-pd-amax", fmt(c.after.pitch.max)); setText("coat-pd-amin", fmt(c.after.pitch.min));
}

// ---- Inputs ----
function readInput(classOfFit: string, withAltWire: boolean) {
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
  if (withAltWire) {
    const aw = parseFloat($<HTMLInputElement>("altWire").value);
    if (Number.isFinite(aw) && aw > 0) base.alternateWire = group.units === displayUnits() ? aw : (displayUnits() === "metric" ? aw / 25.4 : aw * 25.4);
  }
  return base;
}

function recompute(): void {
  const major = parseFloat($<HTMLInputElement>("major").value);
  if (!Number.isFinite(major) || major <= 0) return;
  let rExt: ThreadResult | null = null;
  let rInt: ThreadResult | null = null;
  try { rExt = calculate(readInput($<HTMLSelectElement>("classExternal").value, true)); } catch (e) { console.warn(e); }
  try { rInt = calculate(readInput($<HTMLSelectElement>("classInternal").value, false)); } catch (e) { console.warn(e); }
  const src = rExt ?? rInt;
  if (src) render(rExt, rInt, src);
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
  ["major", "tpi", "pitch", "starts", "loe", "percent", "altWire", "coatThk"].forEach((id) =>
    $(id).addEventListener("input", () => {
      if (["major", "tpi", "pitch"].includes(id)) $<HTMLSelectElement>("size").value = "custom";
      recompute();
    }));
  ["classExternal", "classInternal"].forEach((id) => $(id).addEventListener("change", recompute));
  document.querySelectorAll('input[name="units"],input[name="anglename"],input[name="tapType"],input[name="coatMode"],input[name="coatHand"],#sharpRoot')
    .forEach((el) => el.addEventListener("change", recompute));
  $("resetWire").addEventListener("click", () => { $<HTMLInputElement>("altWire").value = ""; recompute(); });
  $("printBtn").addEventListener("click", () => window.print());
}

init();
