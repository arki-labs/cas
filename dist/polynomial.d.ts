/**
 * `@arki/cas/polynomial` (RFC §8.1): polynomial and rational-function verbs.
 * Coefficients live in ℚ[π, e], with π and e treated as algebraically
 * independent (see `constants.ts`): every verb that zero-tests relies on that
 * standard, unproven assumption.
 */
import type { Expr, Span } from '@arki/expr';
import type { Rational } from '@arki/math/rational';
import type { CasInput, CasOptions, CasResult, Condition } from './core.js';
import type { CasTextFailure } from './failures.js';
export { exactRoots } from './roots.js';
export type { ExactRoots } from './roots.js';
export type { CasTextFailure } from './failures.js';
/** One coefficient: a canonical expression in ℚ(π, e), and its value when it is rational. */
export type Coefficient = {
    readonly value: Expr;
    readonly rational: Rational | null;
};
export type PolynomialIn = {
    readonly kind: 'polynomial';
    /** Ascending; `[]` for the zero polynomial. */
    readonly coefficients: readonly Coefficient[];
    readonly conditions: readonly Condition[];
} | {
    readonly kind: 'rational';
    readonly numerator: readonly Coefficient[];
    /** The roots of the denominator are excluded. */
    readonly denominator: readonly Coefficient[];
    readonly conditions: readonly Condition[];
} | {
    readonly kind: 'other';
    /** `transcendental`: a kernel contains the variable; `unsupported-constant`: `sqrt(2)`, `ln(2)`…; `other-variable`: another free name. */
    readonly reason: 'transcendental' | 'unsupported-constant' | 'other-variable';
    /** The first offending node of the input. */
    readonly span: Span;
};
export type PolynomialForm = Extract<PolynomialIn, {
    readonly kind: 'polynomial';
}>;
/**
 * Products and integer powers of sums multiplied out; like terms collected.
 * A quotient comes back as one fraction, cancelled by the gcd (the
 * `rationalize` form). Kernels (`sin(x)`, `sqrt(x)`) stay atoms.
 */
export declare function expand(input: Expr, options?: CasOptions): CasResult;
export declare function expand(input: CasInput, options?: CasOptions): CasResult | CasTextFailure;
/** Grouped by powers of `variable`: `(2*pi + 3)*x + y`. Coefficients may hold other names, π, e and kernels. */
export declare function collect(input: Expr, variable: string, options?: CasOptions): CasResult;
export declare function collect(input: CasInput, variable: string, options?: CasOptions): CasResult | CasTextFailure;
export type Rationalized = {
    readonly numerator: Expr;
    readonly denominator: Expr;
    readonly conditions: readonly Condition[];
};
/** One fraction `numerator/denominator` with polynomial parts, cancelled by the gcd. Throws `not-rational` on a kernel. */
export declare function rationalize(input: Expr, options?: CasOptions): Rationalized;
export declare function rationalize(input: CasInput, options?: CasOptions): Rationalized | CasTextFailure;
/**
 * The gcd of two polynomials over ℚ: monic when it has one generator,
 * otherwise with coprime integer coefficients and the term that prints
 * first positive (`x - pi`). Generators include names, π, e and kernels.
 */
export declare function gcd(a: Expr, b: Expr, options?: CasOptions): CasResult;
export declare function gcd(a: CasInput, b: CasInput, options?: CasOptions): CasResult | CasTextFailure;
/**
 * The input as a polynomial in `variable` with coefficients in ℚ(π, e).
 * It answers a question, so "not a polynomial" is a result, not an error:
 * `rational` gives numerator and denominator coefficients after cancellation,
 * `other` says why and where. Conditions list the divisors the result no
 * longer shows (`x/x - 1` is `[]` with `x ≠ 0`).
 */
export declare function polynomialIn(input: Expr, variable: string, options?: CasOptions): PolynomialIn;
export declare function polynomialIn(input: CasInput, variable: string, options?: CasOptions): PolynomialIn | CasTextFailure;
export type Factored = {
    /** The constant factor: a rational, or for coefficients in other names, π or e, the part without the variable. */
    readonly content: Expr;
    /** Factors in the variable, by degree then text, each with coprime integer coefficients and a positive leading coefficient. */
    readonly factors: readonly {
        readonly factor: Expr;
        readonly multiplicity: number;
    }[];
    /**
     * True when every factor is irreducible. Each square-free part with
     * rational coefficients (after the content, which may hold other names, π
     * or e) is factored completely over ℚ. A part whose coefficients still
     * involve other names, π or e stays whole, and `complete` is false (v1 has
     * no multivariate factoring), unless it has degree 1 in the variable: such
     * a part is primitive, so it is irreducible (`x^2 + 2xy + y^2` is
     * `(x + y)^2`, complete).
     */
    readonly complete: boolean;
    /** Restrictions of the input the factored form no longer shows (`x/x*(x - 1)`: x ≠ 0). */
    readonly conditions: readonly Condition[];
};
/**
 * `input` as content times a product of factors in `variable` (RFC §8.2).
 * Rational coefficients are factored completely over ℚ by Zassenhaus's
 * algorithm; every factor returned is proven irreducible, and a budget that
 * runs out (`factorDegree`, `factorDigits`, `liftDigits`, `recombination`)
 * throws `CasLimitError` instead of returning a partial answer.
 *
 * ```ts
 * factor('x^4 - 5x^2 + 4', 'x'); // content 1; x - 2, x - 1, x + 1, x + 2; complete
 * factor('2x^3 - 2x', 'x'); // content 2; x, x - 1, x + 1
 * factor('x^4 + 1', 'x'); // x^4 + 1 (irreducible over ℚ)
 * factor('y*x^2 - y', 'x'); // content y; x - 1, x + 1; complete
 * factor('x^2 - y', 'x'); // x^2 - y stays whole; complete: false
 * ```
 *
 * Throws `CasError` `not-polynomial`, with the span of the offending part,
 * when the input is not a polynomial in the variable (a quotient by it, or a
 * function of it such as `sin(x)`).
 */
export declare function factor(input: Expr, variable: string, options?: CasOptions): Factored;
export declare function factor(input: CasInput, variable: string, options?: CasOptions): Factored | CasTextFailure;
//# sourceMappingURL=polynomial.d.ts.map