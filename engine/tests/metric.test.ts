import { describe, it, expect } from "vitest";
import { calculate } from "../src/index.js";

/**
 * Metric M-profile fixtures (ISO 965-1 / ASME B1.13M).
 * Basic dimensions are exact and authoritative. Tolerance limits are computed (see notes) and
 * checked to looser precision pending ISO R40 table encoding.
 */

describe("M10 x 1.5 basic dimensions (exact)", () => {
  const r = calculate({ family: "M", majorDiameter: 10, pitch: 1.5, classOfFit: "6g" });
  it("basic pitch diameter = 9.0257", () => {
    expect(r.pitchDiameter.basic).toBeCloseTo(9.0257, 3);
  });
  it("basic internal minor (external root reference) computed", () => {
    // external minor d3 = 10 - 1.226870*1.5 = 8.1597
    expect(r.minorDiameter.basic).toBeCloseTo(8.1597, 3);
  });
  it("fundamental deviation es(g) at P=1.5 = -0.032 mm", () => {
    expect(r.allowance).toBeCloseTo(0.032, 3);
  });
  it("6g pitch diameter max = 8.994 (basic - 0.032)", () => {
    expect(r.pitchDiameter.external!.max).toBeCloseTo(8.994, 3);
  });
});

describe("M10 x 1.5 internal 6H", () => {
  const r = calculate({ family: "M", majorDiameter: 10, pitch: 1.5, classOfFit: "6H" });
  it("internal pitch diameter min = basic (H position, zero deviation)", () => {
    expect(r.pitchDiameter.internal!.min).toBeCloseTo(9.0257, 3);
  });
  it("internal minor diameter min = 8.376 (D1 basic)", () => {
    expect(r.minorDiameter.internal!.min).toBeCloseTo(8.376, 2);
  });
});
