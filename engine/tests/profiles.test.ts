import { describe, it, expect } from "vitest";
import { calculate } from "../src/index.js";

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
