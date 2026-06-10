/**
 * Public entry point for the ThreadBuddy calculation engine.
 */

import type { ThreadInput, ThreadResult } from "./types.js";
import { deriveUN } from "./core/un.js";
import { deriveMetric } from "./core/metric.js";
import { deriveAcme } from "./core/acme.js";
import { deriveGeneric } from "./core/generic.js";
import { derivePipe } from "./core/pipe.js";

export * from "./types.js";
export { calculateCoating } from "./core/coating.js";
export { CATALOG, catalogByFamily, type CatalogEntry } from "./data/catalog.js";
export { bestWire, measurementOverWires, wireConstant } from "./core/geometry.js";

export function calculate(input: ThreadInput): ThreadResult {
  switch (input.family) {
    case "UN":
    case "UNR":
    case "UNJ":
    case "STI_UN":
      return deriveUN(input);
    case "M":
    case "MJ":
    case "STI_M":
    case "UNM": // ASME B1.10 Unified Miniature is millimetre-based
    case "PG_CONDUIT":
      return deriveMetric(input);
    case "ACME":
    case "STUB_ACME":
      return deriveAcme(input);
    case "WHITWORTH":
    case "TRAPEZOIDAL":
    case "BUTTRESS":
    case "ISO_BUTTRESS":
      return deriveGeneric(input);
    case "NPT":
    case "NPTF":
    case "NPSM":
    case "NPSL":
    case "BSPT":
    case "BSPP":
      return derivePipe(input);
    default:
      throw new Error(`Thread family not yet implemented: ${input.family}`);
  }
}
