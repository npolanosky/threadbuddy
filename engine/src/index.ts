/**
 * Public entry point for the Threadpal-Web calculation engine.
 */

import type { ThreadInput, ThreadResult } from "./types.js";
import { deriveUN } from "./core/un.js";

export * from "./types.js";

export function calculate(input: ThreadInput): ThreadResult {
  switch (input.family) {
    case "UN":
    case "UNR":
    case "UNJ":
      return deriveUN(input);
    default:
      throw new Error(`Thread family not yet implemented: ${input.family}`);
  }
}
