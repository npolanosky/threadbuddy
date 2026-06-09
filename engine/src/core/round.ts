/**
 * Rounding helpers.
 *
 * ASME B1.30 (and the ISO equivalents) specify that published thread table values are
 * rounded to a fixed number of decimal places using ordinary round-half-up. Reproducing
 * this rounding is essential to matching the standards' published tables exactly.
 *
 * JavaScript's Math.round is round-half-toward-+Infinity and is also vulnerable to binary
 * floating-point representation error (e.g. 1.005 stored as 1.00499999...). We use a small
 * epsilon nudge plus magnitude-based rounding so that exact halves round away from zero
 * deterministically.
 */

export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const factor = Math.pow(10, decimals);
  const shifted = value * factor;
  const sign = Math.sign(shifted);
  // Epsilon scaled to magnitude guards against 0.5 stored as 0.4999999999.
  const eps = Math.abs(shifted) * Number.EPSILON * 8 + Number.EPSILON;
  return (sign * Math.round(Math.abs(shifted) + eps)) / factor;
}

/** Round to 4 decimal places — the standard precision for inch thread tables (0.0001"). */
export const roundInch = (v: number): number => roundTo(v, 4);

/** Round to 4 decimal places — common precision for metric thread tables (0.0001 mm shown to 3-4). */
export const roundMetric = (v: number): number => roundTo(v, 4);

/** Cube root helper that preserves sign. */
export const cbrt = (x: number): number => Math.cbrt(x);
