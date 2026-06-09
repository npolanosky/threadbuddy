import { describe, it, expect } from "vitest";
import { calculate } from "../src/index.js";
import { fundamentalHeight, leadAngleDeg } from "../src/core/geometry.js";

/**
 * Integrity fixtures for Unified inch threads (ASME B1.1-2003).
 * Reference values are published table rows; matching them to 0.0001" proves the engine
 * reproduces the standard exactly (with ASME B1.30 rounding and LE = basic major diameter).
 */

describe("UN 1/2-13 UNC external (ASME B1.1, LE=D)", () => {
  const r2a = calculate({ family: "UN", majorDiameter: 0.5, tpi: 13, classOfFit: "2A" });

  it("basic pitch diameter = 0.4500", () => {
    expect(r2a.pitchDiameter.basic).toBe(0.45);
  });
  it("allowance = 0.0015", () => {
    expect(r2a.allowance).toBe(0.0015);
  });
  it("2A pitch diameter limits = 0.4485 / 0.4435", () => {
    expect(r2a.pitchDiameter.external).toEqual({ max: 0.4485, min: 0.4435 });
  });
  it("2A major diameter limits = 0.4985 / 0.4876", () => {
    expect(r2a.majorDiameter.external).toEqual({ max: 0.4985, min: 0.4876 });
  });
});

describe("UN 1/2-13 UNC class 3A (zero allowance)", () => {
  const r3a = calculate({ family: "UN", majorDiameter: 0.5, tpi: 13, classOfFit: "3A" });
  it("3A pitch diameter max = basic (no allowance)", () => {
    expect(r3a.pitchDiameter.external!.max).toBe(0.45);
  });
  it("3A pitch diameter limits = 0.4500 / 0.4463", () => {
    // 3A PD tol = 0.75 * 2A tol (0.0050) = 0.0037 (rounded)
    expect(r3a.pitchDiameter.external).toEqual({ max: 0.45, min: 0.4463 });
  });
});

describe("UN 1/2-13 UNC internal 2B (ASME B1.1)", () => {
  const r2b = calculate({ family: "UN", majorDiameter: 0.5, tpi: 13, classOfFit: "2B" });
  it("2B pitch diameter limits = 0.4565 / 0.4500", () => {
    expect(r2b.pitchDiameter.internal).toEqual({ max: 0.4565, min: 0.45 });
  });
  it("internal minor diameter min = 0.4167 (tap-drill basis)", () => {
    expect(r2b.minorDiameter.internal!.min).toBe(0.4167);
  });
});

describe("geometry invariants", () => {
  it("fundamental height H = 0.866025 * p", () => {
    expect(fundamentalHeight(0.05, 60)).toBeCloseTo(0.04330127, 8);
  });
  it("UN pitch diameter identity: d2 = D - 0.649519 p", () => {
    const r = calculate({ family: "UN", majorDiameter: 1.0, tpi: 8, classOfFit: "2A" });
    expect(r.pitchDiameter.basic).toBeCloseTo(1.0 - 0.649519 * (1 / 8), 4);
  });
  it("lead angle of single-start 1.0-8 UN at (unrounded) basic PD", () => {
    const r = calculate({ family: "UN", majorDiameter: 1.0, tpi: 8, classOfFit: "2A" });
    // Engine computes the angle at the full-precision basic pitch diameter.
    const expected = leadAngleDeg(1 / 8, 1.0 - 0.6495190528 / 8);
    expect(r.leadAngleDeg).toBeCloseTo(expected, 6);
  });
});
