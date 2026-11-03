import type { Context, RatFun } from './context.js';
import type { Condition } from './core.js';
import type { Emitter } from './emit.js';
import type { Poly } from './poly.js';
export type Restriction = {
    readonly subject: RatFun;
    readonly relation: 'positive' | 'nonnegative';
};
/** `nonzero` holds polynomials (a value's non-zero numerator); `signed` holds values with their relation. */
export type Domain = {
    readonly nonzero: Poly[];
    readonly signed: Restriction[];
};
/**
 * The input's domain: the divisors before `divisors` and the restrictions of
 * the generators before `kernels`, from `firstDivisor` and `firstKernel` on
 * (a derivative reads one tree per order and collects each range once).
 */
export declare function inputDomain(ctx: Context, kernels?: number, divisors?: number, firstKernel?: number, firstDivisor?: number): Domain;
/** The restrictions a value shows: its denominators and its kernels' restrictions, recursively. */
export declare function valueDomain(ctx: Context, r: RatFun): Domain;
/**
 * The conditions a result carries (RFC §6): the input's restrictions it no
 * longer shows. `map` rewrites each subject the way the result was rewritten
 * (`simplify`), so a subject is compared and printed in the result's terms.
 * A subject that maps to zero means the input is defined nowhere.
 */
export declare function lostConditions(ctx: Context, input: Domain, value: RatFun, emitter: Emitter, map?: (r: RatFun) => RatFun): Condition[];
/**
 * Conditions from several sources as one list (RFC §6): `u ≥ 0` and `u ≠ 0`
 * with one reason become `u > 0`; of equal conditions the first is kept; and
 * a condition that another one implies on the same subject is dropped
 * (`x > 0` makes `x ≠ 0` and `x ≥ 0` redundant, whatever their reasons).
 */
export declare function mergeConditions(...lists: readonly (readonly Condition[])[]): Condition[];
//# sourceMappingURL=conditions.d.ts.map