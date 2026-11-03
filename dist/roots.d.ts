/**
 * `exactRoots` (RFC §8.3): closed forms for parts of degree 1 and 2, over
 * ℚ(π, e). A factor `x^k` gives the root 0; a polynomial of degree ≥ 3 is
 * split into square-free parts (Yun), and with rational coefficients each
 * part into its irreducible factors over ℚ (`factor.ts`, Zassenhaus). Parts
 * of degree ≤ 2 are solved exactly; the rest are returned as `numeric`, with
 * float coefficients for `@arki/math/polynomial` `polynomialRoots`.
 *
 * Internal module; re-exported by `@arki/cas/polynomial`.
 */
import type { Expr } from '@arki/expr';
import type { CasOptions } from './core.js';
import type { Poly } from './poly.js';
import type { PolynomialForm } from './polynomial.js';
import { Context } from './context.js';
export type ExactRoots = {
    /** Closed-form roots; `real: false` for complex ones, which print with `i`. */
    readonly roots: readonly {
        readonly value: Expr;
        readonly multiplicity: number;
        readonly real: boolean;
    }[];
    /** Parts with no closed form here, ascending float coefficients, for a numeric solver. */
    readonly numeric: readonly {
        readonly coefficients: readonly number[];
        readonly multiplicity: number;
    }[];
    /** False when `numeric` is non-empty. */
    readonly exact: boolean;
};
/** Square-free parts of f in x, with multiplicities (Yun's algorithm). */
export declare function squareFreeParts(f: Poly, x: number, ctx: Context): (readonly [Poly, number])[];
/**
 * The irreducible factors over ℚ of a square-free polynomial in x alone
 * (rational coefficients), each with coprime integer coefficients and a
 * positive leading coefficient. Checks `factorDegree` and `factorDigits`
 * first; lifting and recombination check their own budgets.
 */
export declare function rationalFactors(part: Poly, x: number, ctx: Context): Poly[];
/**
 * The complete factorization over ℚ of a polynomial in x alone: irreducible
 * factors with multiplicities, up to a rational constant. The square-free
 * split uses heuristic gcds (no coefficient growth); if one gives up, the
 * remainder-sequence split of `squareFreeParts` is used instead.
 */
export declare function rationalFactorization(p: Poly, x: number, ctx: Context): (readonly [Poly, number])[];
/** True when every generator of `p` is `x`: its coefficients are rational. */
export declare function rationalIn(p: Poly, x: number): boolean;
/**
 * Closed-form roots of a `polynomialIn` result: rational and quadratic-surd
 * roots over ℚ, and roots in ℚ(π, e) and its square roots for π/e
 * coefficients (`pi*x = 1` → `1/pi`). A quadratic whose discriminant's sign
 * the `digits` budget cannot decide goes to `numeric`. Zero-testing assumes π
 * and e are algebraically independent (standard, unproven; see the README).
 */
export declare function exactRoots(form: PolynomialForm, options?: CasOptions): ExactRoots;
//# sourceMappingURL=roots.d.ts.map