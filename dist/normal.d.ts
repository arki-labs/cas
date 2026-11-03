/**
 * The rule table of RFC §7 and the readable normal form, shared by
 * `simplify` and the derivative verbs: the rational-function normal form plus
 * the kernel rules, applied bottom-up to a fixed point, printed in the
 * readable normal form (RFC §5.4).
 *
 * Every rewrite keeps the value wherever the input is defined and the
 * caller's assumptions hold. A rewrite that would change the value somewhere
 * the input is defined runs only when the sign oracle proves it safe; a
 * restriction a rewrite removes comes back in `conditions` (RFC §6). Anything
 * not in the table is left alone. Coefficients live in ℚ[π, e] with π and e
 * treated as algebraically independent (see `constants.ts`).
 *
 * Internal module; `simplify` is re-exported by `@arki/cas/simplify`.
 */
import type { Node } from '@arki/expr';
import type { Domain } from './conditions.js';
import type { Context, RatFun } from './context.js';
import type { CasResult } from './core.js';
import { Emitter } from './emit.js';
/** The rule ids of RFC §7, in table order. The same ids label simplification steps in a derivation. */
export type SimplifyRule = 'fold' | 'expand' | 'collect' | 'cancel' | 'integer-powers' | 'fractional-powers' | 'sqrt-of-square' | 'square-of-sqrt' | 'exp-ln' | 'ln-exp' | 'exp-product' | 'abs-sign' | 'parity' | 'special-values' | 'factor-out';
export type SimplifyResult = CasResult & {
    /** The rules that changed something, in table order. */
    readonly applied: readonly SimplifyRule[];
};
export declare const RULES: readonly SimplifyRule[];
export declare class Simplifier {
    readonly applied: Set<SimplifyRule>;
    /** Variables whose assumptions a rewrite relied on, in order. */
    readonly assumed: Set<string>;
    private readonly ctx;
    private readonly plain;
    private readonly withAssumptions;
    private readonly values;
    private readonly argValues;
    private readonly order;
    /** The rules this run may use; `undefined` allows all. A derivation switches them on one by one to show each as a step. */
    private readonly rules;
    constructor(ctx: Context, rules?: ReadonlySet<SimplifyRule>);
    /**
     * True when `u` prints with a leading minus: the first printed terms of its
     * numerator and denominator have opposite signs. `f(-u)` is rewritten as
     * `±f(u)` by this test, which follows the printed order, so the choice is
     * the same on every run (the print order is a monomial order, so the sign
     * of a product's first term is the product of the factors' signs).
     */
    private isNegated;
    private allows;
    private note;
    /** Proven from the expression alone, or from the caller's assumptions (then recorded). Unknown proves nothing. */
    private prove;
    /** The value simplified to a fixed point. */
    value(r: RatFun): RatFun;
    /** Simplifies every kernel `r` reaches, innermost first, so `generatorValue` never recurses deeply. */
    private prepare;
    private generatorValue;
    /** `[u, q]` for a kernel that is a rational power of `u`: `u^q`, and `sqrt(u)` as `u^(1/2)` (one value). */
    private rationalPower;
    private args;
    /** One pass: each generator replaced by its simplified value, with the monomial rules. */
    private substitute;
    private poly;
    private pow;
    /**
     * `u^r`: a polynomial power for an integer `r`; for a half-integer `r = k/2`
     * the reduced power of `sqrt(u)` that `square-of-sqrt` keeps,
     * `u^((k - 1)/2)·sqrt(u)`; else the kernel `u^r` (through the rules).
     */
    private raise;
    /**
     * One term c·∏ gᵉ. Monomial rules: `sqrt(u)^2 → u` (`square-of-sqrt`),
     * `(u^(p/q))^k → u^(kp/q)` for an integer kp/q (`integer-powers`),
     * `exp(a)^m·exp(b)^n → exp(m·a + n·b)` (`exp-product`), and same-base
     * fractional powers combined when the base is proven positive
     * (`fractional-powers`).
     */
    private term;
    /** `b^n · b^(p/q) · …` as one power when b is proven positive, else the factors unchanged. */
    private fractional;
    /**
     * Value-level rules: `abs(u)/u → sign(u)`, `u/sqrt(u) → sqrt(u)` (`square-of-sqrt`; the
     * input already needs `u > 0` there) and exponentials moved out of the denominator.
     */
    private valueRules;
    /** a·b without recording phases: rewrites, not the input's arithmetic. */
    private times;
    /** The kernel `fn(args)` after the kernel rules; args are simplified already. */
    private kernel;
    /** `exp(0) → 1`, `exp(n) → e^n` (the coefficient), `exp(ln(u)) → u`. */
    private exp;
    /** `ln(1) → 0`, `ln(e) → 1`, `ln(e^k) → k`, `ln(exp(u)) → u`; `log(u)` is the natural log. */
    private ln;
    /** `sqrt` of an exact rational square, and `sqrt(c·w^2) → sqrt(c)·abs(w)` for polynomial squares. */
    private sqrt;
    /** `abs` of a rational; `abs(u) → u` or `-u` when the sign of `u` is proven or assumed. */
    private abs;
    /** The kernel `base^exponent`: `exp(a)^y → exp(a·y)`; `(u^a)^q` and `(g^m)^q` multiply out when the base is proven positive. */
    private power;
}
/**
 * The readable normal form (RFC §5.4): the numerator expanded, with a common
 * kernel factor pulled out (`exp(x)*(cos(x) - sin(x))`); one fraction over a
 * denominator printed as a product of its factors (`(x - 1)^2`). The factors
 * are the ones the input divided by, split further by content and by
 * repeated factors (gcd with each partial derivative); the printer does not
 * call `factor`, so a denominator is never split further than that.
 */
export declare class Readable extends Emitter {
    pulled: boolean;
    private readonly context;
    /** False prints the numerator without pulling out a common factor (`factor-out`). */
    private readonly factorOut;
    constructor(ctx: Context, factorOut?: boolean);
    node(r: RatFun): Node;
    private numerator;
    /**
     * The denominator as a product of factors, each printed with a positive
     * first term; `negative` says the numerator takes the sign. Signs follow
     * the printed order, not generator ids, so the output is the same however
     * the input was written.
     */
    private denominator;
    /** Coprime refinement of `den` by the input's divisors, each factor's partial derivatives and the other factors. */
    private factors;
}
/** A normalized value: `simplify`'s result, plus the simplified value for callers that keep computing with it. */
export type Normal = SimplifyResult & {
    readonly value: RatFun;
};
/**
 * `value` simplified by the rule table and printed in the readable normal
 * form. Every restriction of `domain()` (built after simplifying) the result no longer shows comes back
 * as a condition. `notes` collects the phases the arithmetic performs; pass
 * the set the input was read with. `rules` limits the rules this run may use,
 * and `factorOut: false` skips `factor-out`: a derivation switches rules on
 * one by one to show each as a step.
 */
export declare function normalize(ctx: Context, value: RatFun, domain: () => Domain, notes: Set<string>, rules?: ReadonlySet<SimplifyRule>, factorOut?: boolean): Normal;
//# sourceMappingURL=normal.d.ts.map