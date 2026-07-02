import { describe, it, expect } from "vitest";
import { calculate, calculateCoating } from "../src/index.js";

/**
 * Profile-differentiation fixtures: ensure J profiles, UNR, and the straight pipe families are
 * computed distinctly from their base families, per the governing standards.
 */

describe("M vs MJ — ISO metric (M10 x 1.5)", () => {
  const m = calculate({ family: "M", majorDiameter: 10, pitch: 1.5, classOfFit: "6H" });
  const mj = calculate({ family: "MJ", majorDiameter: 10, pitch: 1.5, classOfFit: "6H" });
  it("MJ has the controlled external root radius 0.15011–0.18042P", () => {
    expect(mj.rootRadius!.min).toBeCloseTo(0.15011 * 1.5, 3);
    expect(mj.rootRadius!.max).toBeCloseTo(0.18042 * 1.5, 3);
  });
  it("MJ internal minor diameter is increased relative to M", () => {
    expect(mj.minorDiameter.internal!.min).toBeGreaterThan(m.minorDiameter.internal!.min);
    expect(mj.minorDiameter.internal!.min).toBeCloseTo(10 - 0.97428 * 1.5, 3);
  });
  it("MJ designation uses the MJ prefix", () => expect(mj.designation.startsWith("MJ")).toBe(true));
});

describe("UN / UNR / UNJ — Unified (1/4-20)", () => {
  const p = 0.05;
  const un = calculate({ family: "UN", majorDiameter: 0.25, tpi: 20, classOfFit: "2B" });
  const unr = calculate({ family: "UNR", majorDiameter: 0.25, tpi: 20, classOfFit: "2B" });
  const unj = calculate({ family: "UNJ", majorDiameter: 0.25, tpi: 20, classOfFit: "2B" });

  it("UN has no minimum root radius; UNR mandates 0.108P", () => {
    expect(Number.isFinite(un.rootRadius!.min)).toBe(false);
    expect(unr.rootRadius!.min).toBeCloseTo(0.108 * p, 4);
  });
  it("UNJ has the controlled root radius 0.15011–0.18042P", () => {
    expect(unj.rootRadius!.min).toBeCloseTo(0.15011 * p, 4);
    expect(unj.rootRadius!.max).toBeCloseTo(0.18042 * p, 4);
  });
  it("UNR internal minor equals UN; UNJ internal minor is increased", () => {
    expect(unr.minorDiameter.internal!.min).toBeCloseTo(un.minorDiameter.internal!.min, 4);
    expect(unj.minorDiameter.internal!.min).toBeGreaterThan(un.minorDiameter.internal!.min);
  });
});

describe("Unified internal minor diameter tolerance (ASME B1.1)", () => {
  const r = calculate({ family: "UN", majorDiameter: 0.5, tpi: 13, classOfFit: "2B" });
  it("1/2-13 2B internal minor max is now populated (~0.4336)", () => {
    expect(r.minorDiameter.internal!.max).toBeCloseTo(0.4336, 3);
    expect(r.minorDiameter.internal!.max).toBeGreaterThan(r.minorDiameter.internal!.min);
  });
});

describe("Acme nut (internal) dimensions — 1-5 GP", () => {
  const r = calculate({ family: "ACME", majorDiameter: 1.0, tpi: 5, classOfFit: "2G" });
  it("nut minor min = 0.800 (D - p)", () => expect(r.minorDiameter.internal!.min).toBeCloseTo(0.8, 3));
  it("nut major min = 1.020 (D + 0.020 clearance)", () => expect(r.majorDiameter.internal!.min).toBeCloseTo(1.02, 3));
  it("nut pitch min = 0.900 (basic)", () => expect(r.pitchDiameter.internal!.min).toBeCloseTo(0.9, 3));
  it("nut minor/major maxima are populated (tolerances present)", () => {
    expect(Number.isFinite(r.minorDiameter.internal!.max)).toBe(true);
    expect(Number.isFinite(r.majorDiameter.internal!.max)).toBe(true);
  });
});

describe("coating includes the minor diameter", () => {
  const r = calculate({ family: "UN", majorDiameter: 0.5, tpi: 13, classOfFit: "2A" });
  const c = calculateCoating({ result: r, hand: "external", thickness: 0.0003, mode: "coating" });
  it("computes before/after minor, growing by 2·t", () => {
    expect(Number.isFinite(c.after.minor.max)).toBe(true);
    expect(c.after.minor.max - c.before.minor.max).toBeCloseTo(0.0006, 4);
  });
});

describe("NPSM vs NPSL — straight pipe (1/2, OD 0.840, 14 TPI)", () => {
  const npsm = calculate({ family: "NPSM", majorDiameter: 0.84, tpi: 14, classOfFit: "std" });
  const npsl = calculate({ family: "NPSL", majorDiameter: 0.84, tpi: 14, classOfFit: "std" });
  it("NPSM external pitch dia max ~ 0.7769 (NPT gauge plane)", () => {
    expect(npsm.pitchDiameter.external!.max).toBeCloseTo(0.7769, 3);
  });
  it("NPSL external pitch dia max ~ 0.7963 and larger than NPSM", () => {
    expect(npsl.pitchDiameter.external!.max).toBeCloseTo(0.7963, 3);
    expect(npsl.pitchDiameter.external!.max).toBeGreaterThan(npsm.pitchDiameter.external!.max);
  });
});
