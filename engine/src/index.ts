/**
 * Public entry point for the Threadpal-Web calculation engine.
 */

import type { ThreadInput, ThreadResult } from "./types.js";
import { deriveUN } from "./core/un.js";
import { deriveMetric } from "./core/metric.js";
import { deriveAcme } from "./core/acme.js";

export * from "./types.js";

export function calculate(input: ThreadInput): ThreadResult {
  switch (input.family) {
    case "UN":
    case "UNR":
    case "UNJ":
    case "UNM":
    case "STI_UN":
      return deriveUN(input);
    case "M":
    case "MJ":
    case "STI_M":
    case "PG_CONDUIT":
      return deriveMetric(input);
    case "ACME":
    case "STUB_ACME":
      return deriveAcme(input);
    default:
      throw new Error(`Thread family not yet implemented: ${input.family}`);
  }
}
