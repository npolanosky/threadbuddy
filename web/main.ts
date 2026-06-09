/**
 * ThreadPal Web — UI controller.
 * Reads control state, calls the calculation engine, and renders results into the dashboard,
 * faithfully reproducing the layout of the original ME ThreadPal main window.
 */

import { calculate } from "../engine/src/index.js";
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

const GROUPS: FamilyGroup[] = [
  {
    id: "unified", label: "Unified Series 60°", units: "inch", catalogFamily: "UN",
    variants: [{ code: "UN", label: "UN" }, { code: "UNR", label: "UNR" }, { code: "UNJ", label: "UNJ" }],
    classesExt: ["1A", "2A", "3A"], classesInt: ["1B", "2B", "3B"],
  },
  {
    id: "metric", label: "ISO Metric 60°", units: "metric", catalogFamily: "M",
    variants: [{ code: "M", label: "M" }, { code: "MJ", label: "MJ" }],
    classesExt: ["4g", "6g", "8g", "4h", "6h"], classesInt: ["4H", "5H", "6H", "7H"],
  },
  {
    id: "acme", label: "Acme 29°", units: "inch", catalogFamily: "ACME",
    variants: [{ code: "ACME", label: "General Purpose" }, { code: "STUB_ACME", label: "Stub" }],
    classesExt: ["2G", "3G", "4G"], classesInt: ["2G", "3G", "4G"],
  },
];

const STANDARD_SRC: Record<string, string> = {
  UN: "ASME B1.1-2003", UNR: "ASME B1.1-2003", UNJ: "SAE AS8879C-2003",
  M: "ISO 965-1 / ASME B1.13M-2005", MJ: "ASME B1.21M-1997 / ISO 5855",
  ACME: "ASME B1.5-1997", STUB_ACME: "ASME B1.5-1997",
};

// ---- DOM helpers ----
const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
const radio = (name: string): string =>
  (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value;

// ---- State ----
let group: FamilyGroup = GROUPS[0];
let variant: ThreadFamily = group.variants[0].code;

function currentSizes(): CatalogEntry[] {
  return CATALOG.filter((e) => e.family === group.catalogFamily);
}

// ---- Population ----
function populateFamily(): void {
  const sel = $<HTMLSelectElement>("family");
  sel.innerHTML = "";
  for (const g of GROUPS) {
    const o = document.createElement("option");
    o.value = g.id;
    o.textContent = g.label;
    sel.appendChild(o);
  }
}

function populateVariants(): void {
  const row = $("variantRow");
  row.innerHTML = "";
  group.variants.forEach((v, i) => {
    const lbl = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "variant";
    input.value = v.code;
    if (i === 0) input.checked = true;
    input.addEventListener("change", () => {
      variant = v.code;
      recompute();
    });
    lbl.appendChild(input);
    lbl.appendChild(document.createTextNode(" " + v.label));
    row.appendChild(lbl);
  });
  variant = group.variants[0].code;
}

function populateSizes(): void {
  const sel = $<HTMLSelectElement>("size");
  sel.innerHTML = "";
  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = "— Custom / type below —";
  sel.appendChild(custom);
  currentSizes().forEach((e, idx) => {
    const o = document.createElement("option");
    o.value = String(idx);
    o.textContent = e.label;
    sel.appendChild(o);
  });
  // Default to a familiar size if present.
  const sizes = currentSizes();
  const def = sizes.findIndex((e) => e.label.startsWith("1/2-13") || e.label.startsWith("M10"));
  sel.value = def >= 0 ? String(def) : "custom";
  if (def >= 0) applySize(sizes[def]);
}

function populateClasses(): void {
  const ext = $<HTMLSelectElement>("classExternal");
  const int = $<HTMLSelectElement>("classInternal");
  ext.innerHTML = "";
  int.innerHTML = "";
  group.classesExt.forEach((c) => ext.add(new Option(c, c)));
  group.classesInt.forEach((c) => int.add(new Option(c, c)));
  // Sensible defaults.
  ext.value = group.id === "metric" ? "6g" : group.id === "acme" ? "2G" : "2A";
  int.value = group.id === "metric" ? "6H" : group.id === "acme" ? "2G" : "2B";
}

function applySize(e: CatalogEntry): void {
  $<HTMLInputElement>("major").value = String(e.majorDiameter);
  if (e.tpi !== undefined) $<HTMLInputElement>("tpi").value = String(e.tpi);
  if (e.pitch !== undefined) $<HTMLInputElement>("pitch").value = String(e.pitch);
}

// ---- Units / formatting ----
function displayUnits(): "inch" | "metric" {
  return radio("units") as "inch" | "metric";
}
/** Convert a length from the family's native unit to the chosen display unit. */
function conv(v: number): number {
  if (!Number.isFinite(v)) return v;
  const d = displayUnits();
  if (group.units === d) return v;
  return group.units === "inch" ? v * 25.4 : v / 25.4;
}
function fmt(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return "—";
  const d = displayUnits();
  return conv(v).toFixed(d === "metric" ? 3 : 4);
}
function fmtAngle(v: number): string {
  return Number.isFinite(v) ? v.toFixed(3) + "°" : "—";
}
function tol(l?: Limits): string {
  return l && Number.isFinite(l.max) && Number.isFinite(l.min) ? fmt(l.max - l.min) : "—";
}
function mean(l?: Limits): string {
  return l && Number.isFinite(l.max) && Number.isFinite(l.min) ? fmt((l.max + l.min) / 2) : "—";
}

// ---- Render ----
function setText(id: string, text: string): void { $(id).textContent = text; }

function render(rExt: ThreadResult | null, rInt: ThreadResult | null, rAngleSrc: ThreadResult): void {
  // External
  if (rExt) {
    setText("desig-ext", rExt.designation);
    setText("ext-allow", fmt(rExt.allowance));
    setText("ext-maj-max", fmt(rExt.majorDiameter.external?.max));
    setText("ext-maj-min", fmt(rExt.majorDiameter.external?.min));
    setText("ext-maj-x", mean(rExt.majorDiameter.external));
    setText("ext-pd-max", fmt(rExt.pitchDiameter.external?.max));
    setText("ext-pd-min", fmt(rExt.pitchDiameter.external?.min));
    setText("ext-pd-x", tol(rExt.pitchDiameter.external));
    setText("ext-min-max", fmt(rExt.minorDiameter.external?.max));
    setText("ext-min-min", fmt(rExt.minorDiameter.external?.min));
    setText("ext-min-x", "—");
    setText("ext-height", fmt(rExt.threadHeight));
    // MOW
    if (rExt.wires) {
      setText("mow-limits", `${fmt(rExt.wires.mow.max)} / ${fmt(rExt.wires.mow.min)}`);
      setText("wire-best", fmt(rExt.wires.bestWire));
      setText("wire-maxmin", `${fmt(rExt.wires.maxWire)} / ${fmt(rExt.wires.minWire)}`);
      setText("wire-const", fmt(rExt.wires.constantBest));
    }
  }
  // Internal
  if (rInt) {
    setText("desig-int", rInt.designation);
    setText("int-min-min", fmt(rInt.minorDiameter.internal?.min));
    setText("int-min-max", fmt(rInt.minorDiameter.internal?.max));
    setText("int-min-x", tol(rInt.minorDiameter.internal));
    setText("int-pd-min", fmt(rInt.pitchDiameter.internal?.min));
    setText("int-pd-max", fmt(rInt.pitchDiameter.internal?.max));
    setText("int-pd-x", tol(rInt.pitchDiameter.internal));
    setText("int-maj-min", fmt(rInt.majorDiameter.internal?.min));
    setText("int-maj-max", fmt(rInt.majorDiameter.internal?.max));
    setText("int-tap", fmt(rInt.tapDrill));
  }
  // Starts / pitch / lead / angle
  setText("o-pitch", fmt(rAngleSrc.pitch));
  setText("o-lead", fmt(rAngleSrc.lead));
  const useHelix = radio("anglename") === "helix";
  setText("angleLabel", useHelix ? "Helix angle" : "Lead angle");
  setText("o-leadangle", fmtAngle(useHelix ? rAngleSrc.helixAngleDeg : rAngleSrc.leadAngleDeg));

  // Notes & source
  const notes = $("notes");
  notes.innerHTML = "";
  const allNotes = new Set([...(rExt?.notes ?? []), ...(rInt?.notes ?? [])]);
  for (const n of allNotes) {
    const li = document.createElement("li");
    li.textContent = n;
    notes.appendChild(li);
  }
  setText("standard-src", "Governing standard: " + (STANDARD_SRC[variant] ?? "—"));
}

// ---- Inputs ----
function readInput(classOfFit: string) {
  const major = parseFloat($<HTMLInputElement>("major").value);
  const starts = parseInt($<HTMLInputElement>("starts").value || "1", 10);
  const loeRaw = parseFloat($<HTMLInputElement>("loe").value);
  const base: any = { family: variant, majorDiameter: major, classOfFit, starts };
  if (Number.isFinite(loeRaw)) base.lengthOfEngagement = loeRaw;
  if (group.units === "metric") base.pitch = parseFloat($<HTMLInputElement>("pitch").value);
  else base.tpi = parseFloat($<HTMLInputElement>("tpi").value);
  return base;
}

function recompute(): void {
  const major = parseFloat($<HTMLInputElement>("major").value);
  if (!Number.isFinite(major) || major <= 0) return;
  const clsExt = $<HTMLSelectElement>("classExternal").value;
  const clsInt = $<HTMLSelectElement>("classInternal").value;
  let rExt: ThreadResult | null = null;
  let rInt: ThreadResult | null = null;
  try { rExt = calculate(readInput(clsExt)); } catch (e) { console.warn(e); }
  try { rInt = calculate(readInput(clsInt)); } catch (e) { console.warn(e); }
  const src = rExt ?? rInt;
  if (src) render(rExt, rInt, src);
}

// ---- Wiring ----
function onFamilyChange(): void {
  const id = $<HTMLSelectElement>("family").value;
  group = GROUPS.find((g) => g.id === id) ?? GROUPS[0];
  // Toggle inch/metric input fields.
  const metric = group.units === "metric";
  $("tpiField").classList.toggle("hidden", metric);
  $("pitchField").classList.toggle("hidden", !metric);
  setText("majorLabel", metric ? "Major (mm)" : "Major (in)");
  // Match display units to family by default.
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
  ["major", "tpi", "pitch", "starts", "loe"].forEach((id) =>
    $(id).addEventListener("input", () => {
      $<HTMLSelectElement>("size").value = "custom";
      recompute();
    }),
  );
  ["classExternal", "classInternal"].forEach((id) => $(id).addEventListener("change", recompute));
  document.querySelectorAll('input[name="units"],input[name="anglename"],input[name="hand"]').forEach((el) =>
    el.addEventListener("change", recompute),
  );
  $("printBtn").addEventListener("click", () => window.print());
}

init();
