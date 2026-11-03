/**
 * Output (RFC §5.4): a value becomes a canonical tree, is printed with expr's
 * `print` and parsed again, so a result is an ordinary `Expr` whose source is
 * canonical text and `parse(print(r))` holds by construction.
 *
 * Sums: descending degree in the main variable, then other names, kernels and
 * atoms, then π and e, the rational constant last. Products: the coefficient,
 * then π, e, the main variable, other names, kernels, atoms. A quotient is one
 * fraction with integer coefficients on both sides. Negative terms print as
 * subtraction.
 *
 * Internal module.
 */
import type { Expr, Node, Span } from '@arki/expr';
import { Rational } from '@arki/math/rational';
import type { Context, RatFun } from './context.js';
import type { Monomial, Poly, Term } from './poly.js';
/** The span of a node cas built: it points nowhere in the input. */
export declare const NOWHERE: Span;
export declare function numberNode(raw: string): Node;
export declare function binary(op: '+' | '-' | '*' | '/' | '^', left: Node, right: Node): Node;
export declare function minus(arg: Node): Node;
/** A term or group of a sum; `node(true)` builds it with its minus sign inside. */
export type Part = {
    readonly negative: boolean;
    readonly node: (negative: boolean) => Node;
};
export declare function product(factors: readonly Node[]): Node;
/** The decimal text of a non-negative rational if it terminates (`1/50` → `0.02`), else `undefined`. */
export declare function decimalText(c: Rational): string | undefined;
export declare class Emitter {
    private readonly ctx;
    private readonly main;
    private readonly byName;
    private orderedFor;
    private productOrder;
    private additionOrder;
    /**
     * `main` leads sums and products. Without `byName`, the main variable is
     * the first name in source order and names keep source order. With
     * `byName`, names are ordered by name and the main variable is the first
     * of them, so the output does not depend on how the input was written
     * (`simplify`, kernel keys).
     */
    constructor(ctx: Context, main?: number, byName?: boolean);
    /** Generator ids in product order, recomputed when the call has interned new generators since. */
    private get factorOrder();
    /** Generator ids in sum-ordering priority: π and e rank last, so `2*pi*x + 3*x + pi + 1`. */
    private get sumOrder();
    private order;
    private compareTerms;
    /** The term that prints first in a sum: canonical, unlike the internal leading term, which depends on generator ids. */
    firstTerm(p: Poly): Term | undefined;
    /** A literal or a fraction of two; `negative` puts the minus on the numerator, as the parser reads `-1 / 4`. */
    private rationalNode;
    /** The term c·m for c > 0; `negative` puts the minus on its first factor, as the parser reads `-2 * x`. */
    private termNode;
    /** The factors `g^e` of a monomial, in product order. */
    monomialFactors(m: Monomial): Node[];
    /** Parts joined as a sum: the first one signed in place, the rest by `+` and `-`. */
    join(parts: readonly Part[]): Node;
    /** The terms of a sum in canonical order. */
    parts(p: Poly): Part[];
    /** A polynomial as a sum in canonical order. */
    polyNode(p: Poly): Node;
    /** Numerator and denominator scaled to integer coefficients. */
    fractionParts(r: RatFun): readonly [Poly, Poly];
    /** A value as one fraction with integer coefficients on both sides, or a sum when the denominator is 1. */
    node(r: RatFun): Node;
    generatorNode(g: number): Node;
}
/** Canonical text of a tree. Checks the `nodes` budget first. */
export declare function textOf(node: Node, ctx: Context): string;
/** The tree as a canonical `Expr`: printed, then parsed again. */
export declare function exprOf(node: Node, ctx: Context): Expr;
//# sourceMappingURL=emit.d.ts.map