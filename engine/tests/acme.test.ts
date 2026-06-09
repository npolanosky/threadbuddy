import { describe, it, expect } from "vitest";
import { calculate } from "../src/index.js";

/**
 * Acme fixtures (ASME B1.5). Basic geometry validated; tolerances provisional.
 */

describe("1.000-5 General Purpose Acme basic geometry", () => {
  const r = calculate({ family: "ACME", majorDiameter: 1.0, tpi: 5, classOfFit: "4G" });
  it("basic pitch diameter = 0.9000 (D - 0.5p)", () => {
    expect(r.pitchDiameter.basic).toBe(0.9);
  });
  it("basic minor diameter = 0.8000 (D - p)", () => {
    expect(r.minorDiameter.basic).toBe(0.8);
  });
  it("thread angle is 29 degrees", () => {
    expect(r.threadAngleDeg).toBe(29);
  });
  it("4-start lead = 0.8 and lead angle ~15.80° at basic PD", () => {
    const r4 = calculate({ family: "ACME", majorDiameter: 1.0, tpi: 5, classOfFit: "4G", starts: 4 });
    expect(r4.lead).toBeCloseTo(0.8, 6);
    // Original ME ThreadPal reports 15.865° (allowance-adjusted PD); standard basic-PD value:
    expect(r4.leadAngleDeg).toBeCloseTo(15.8, 1);
  });
});

describe("Stub Acme geometry", () => {
  const r = calculate({ family: "STUB_ACME", majorDiameter: 1.0, tpi: 5, classOfFit: "2G" });
  it("stub thread height = 0.3p = 0.06", () => {
    expect(r.threadHeight).toBeCloseTo(0.06, 4);
  });
  it("stub basic pitch diameter = D - 0.3p = 0.94", () => {
    expect(r.pitchDiameter.basic).toBeCloseTo(0.94, 4);
  });
});
