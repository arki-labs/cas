/**
 * The sign oracle (RFC §6): small, sound and incomplete. It answers with the
 * set of signs a value can take where it is defined, so "unknown" is the full
 * set and never licenses a rewrite.
 *
 * | Value | Signs |
 * | --- | --- |
 * | a name | its assumption, else unknown |
 * | π, e | positive |
 * | a constant of ℚ[π, e] | rigorous, from `constantSign` (unknown past the `digits` budget) |
 * | `exp(u)`, `cosh(u)`, `u!` | positive |
 * | `abs(u)`, `sqrt(u)`, even roots, `u^(p/q)` | ≥ 0; > 0 when `u ≠ 0` (`u > 0` for roots) |
 * | `u^(p/q)` with p/q < 0 | positive |
 * | `sign`, `cbrt`, odd roots, `atan`, `asin`, `sinh`, `tanh`, `asinh`, `atanh` | the signs of `u` |
 * | `ln(u)`, `log(u)` | the signs of `u - 1` |
 * | `u^(2k)`, and any polynomial that is a perfect square (`x^2 - 2*x + 1`) | ≥ 0; > 0 when `u ≠ 0` |
 * | sums, products, quotients | by sign rules: non-negatives with one positive term are positive (`x^2 + 1`) |
 *
 * Each answer also names the variables whose assumptions it used, so a
 * rewrite can return them as `assumed` conditions.
 *
 * Internal module.
 */
import type { Context, RatFun } from './context.js';
import type { Assumption } from './core.js';
import type { Poly } from './poly.js';
/** A set of signs, as bits. */
export type Signs = number;
export declare const NEGATIVE = 1;
export declare const ZERO = 2;
export declare const POSITIVE = 4;
export declare const UNKNOWN = 7;
export type Fact = {
    readonly signs: Signs;
    readonly names: ReadonlySet<string>;
};
/** The relations a rewrite may ask the oracle to prove. */
export type Claim = 'positive' | 'nonnegative' | 'nonzero' | 'nonpositive' | 'negative';
/** True when every sign in `signs` satisfies `claim`. An empty set proves nothing. */
export declare function holds(signs: Signs, claim: Claim): boolean;
export declare class SignOracle {
    private readonly ctx;
    private readonly assumptions;
    private readonly memo;
    /** `assumptions` empty: proofs from the expression alone. */
    constructor(ctx: Context, assumptions: ReadonlyMap<string, Assumption>);
    /** The signs of a value where it is defined: its denominator is non-zero there. */
    value(r: RatFun): Fact;
    /** Terms are grouped by their part outside π and e, so `(pi - 3)*x^2` is decided by the sign of `pi - 3`. */
    poly(p: Poly): Fact;
    generator(g: number): Fact;
    private compute;
    private kernel;
    /** ≥ 0, and > 0 when `u` satisfies `claim`. */
    private atLeastZero;
}
//# sourceMappingURL=sign.d.ts.map