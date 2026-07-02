import { describe, it, expect } from "vitest";
import { calculate } from "../src/index.js";

/**
 * NPT taper-pipe fixtures (ASME B1.20.1), validated against the original ME ThreadPal display
 * for 1/16-27 NPT (OD 0.3125):
 *   pitch  pipe-face 0.2712, gage-notch 0.2812
 *   major  pipe-face 0.2985, gage-notch 0.3085
 *   minor  pipe-face 0.2439, gage-notch 0.2539
 *   height (mean) 0.0273; tap drill 0.2420 (C); L1 0.160, L2 0.2611, L4 0.2875
 */

describe("1/16-27 NPT taper pipe", () => {
  const r = calculate({ family: "NPT", majorDiameter: 0.3125, tpi: 27, classOfFit: "std" });
  const t = r.taper!;

  it("produces a taper result", () => expect(t).toBeTruthy());
  it("pitch diameter pipe-face = 0.2712, gage-notch = 0.2812", () => {
    expect(t.external.pitch.pipeFace).toBeCloseTo(0.2712, 4);
    expect(t.external.pitch.gageNotch).toBeCloseTo(0.2812, 4);
  });
  it("major diameter pipe-face = 0.2985, gage-notch = 0.3085", () => {
    expect(t.external.major.pipeFace).toBeCloseTo(0.2985, 3);
    expect(t.external.major.gageNotch).toBeCloseTo(0.3085, 3);
  });
  it("minor diameter pipe-face = 0.2439, gage-notch = 0.2539", () => {
    expect(t.external.minor.pipeFace).toBeCloseTo(0.2439, 3);
    expect(t.external.minor.gageNotch).toBeCloseTo(0.2539, 3);
  });
  it("internal minor: pipe-end-L1 = 0.2439, pipe-face = 0.2539", () => {
    expect(t.internal.minor.pipeEndL1).toBeCloseTo(0.2439, 3);
    expect(t.internal.minor.pipeFace).toBeCloseTo(0.2539, 3);
  });
  it("height (mean) = 0.0273", () => expect(t.heightMean).toBeCloseTo(0.0273, 4));
  it("tap drill = C (0.2420)", () => {
    expect(t.internal.tapDrill).toBeCloseTo(0.242, 3);
    expect(t.internal.tapDrillName).toBe("C");
  });
  it("engagement lengths L1/L2/L4 = 0.160 / 0.2611 / 0.2875", () => {
    expect(t.lengths.L1).toBeCloseTo(0.16, 3);
    expect(t.lengths.L2).toBeCloseTo(0.2611, 3);
    expect(t.lengths.L4).toBeCloseTo(0.2875, 3);
  });
  it("taper half-angle = atan(1/32) = 1.790° per side", () => {
    expect(t.taperAngleDeg).toBeCloseTo(1.7899, 3);
  });
});

describe("NPT vs NPTF are handled distinctly (ASME B1.20.1 vs B1.20.3)", () => {
  const npt = calculate({ family: "NPT", majorDiameter: 0.3125, tpi: 27, classOfFit: "std" }).taper!;
  const nptf = calculate({ family: "NPTF", majorDiameter: 0.3125, tpi: 27, classOfFit: "std" }).taper!;

  it("share identical pitch diameters (correct per standard)", () => {
    expect(nptf.external.pitch.pipeFace).toBeCloseTo(npt.external.pitch.pipeFace, 4);
    expect(nptf.external.pitch.gageNotch).toBeCloseTo(npt.external.pitch.gageNotch, 4);
  });
  it("NPTF has a fuller (larger) minor — roots truncated more, so they differ", () => {
    expect(nptf.external.minor.pipeFace).not.toBeCloseTo(npt.external.minor.pipeFace, 4);
    expect(nptf.external.minor.pipeFace).toBeGreaterThan(npt.external.minor.pipeFace);
  });
  it("NPTF crest and root truncations differ from each other", () => {
    expect(nptf.truncation.crest.min).not.toBeCloseTo(nptf.truncation.root.min, 4);
  });
});
