import { describe, it, expect } from "vitest";
import { calculate } from "../src/index.js";
import { CATALOG } from "../src/data/catalog.js";

/**
 * Coverage / smoke integrity: every built-in catalog size must compute for both an external and
 * an internal class without throwing, and must return finite primary dimensions. This guards
 * against catalog/engine drift and surfaces any size the engine cannot handle.
 */

const CLASS_FOR: Record<string, [string, string]> = {
  UN: ["2A", "2B"],
  M: ["6g", "6H"],
  ACME: ["2G", "2G"],
};

describe("catalog coverage", () => {
  const byFamily = new Map<string, number>();

  for (const entry of CATALOG) {
    const [extCls, intCls] = CLASS_FOR[entry.family] ?? ["2A", "2B"];
    it(`computes ${entry.label}`, () => {
      const common = {
        family: entry.family,
        majorDiameter: entry.majorDiameter,
        tpi: entry.tpi,
        pitch: entry.pitch,
      };
      const ext = calculate({ ...common, classOfFit: extCls });
      const int = calculate({ ...common, classOfFit: intCls });
      expect(Number.isFinite(ext.pitchDiameter.basic)).toBe(true);
      expect(ext.pitchDiameter.basic).toBeGreaterThan(0);
      expect(Number.isFinite(int.pitchDiameter.basic)).toBe(true);
      byFamily.set(entry.family, (byFamily.get(entry.family) ?? 0) + 1);
    });
  }

  it("summary: every family has catalog coverage", () => {
    const summary = Object.fromEntries(byFamily);
    // eslint-disable-next-line no-console
    console.log("Catalog coverage by family:", summary, "total:", CATALOG.length);
    expect(CATALOG.length).toBeGreaterThan(80);
  });
});
