/**
 * Per-call state (RFC §5.2): the generator table, the rational-function
 * normal form `RatFun`, and the divisors every result's conditions come from.
 * A context is built for one verb call and dropped afterwards; nothing is
 * cached across calls.
 *
 * Internal module.
 */
import type { Language, Node, Span } from '@arki/expr';
import type { Assumption, CasOptions } from './core.js';
import type { Poly } from './poly.js';
import { Budget } from './core.js';
import { constantValue } from './poly.js';
/**
 * A generator of the polynomial ring. Kernels are everything that is not
 * `+ - * / ^integer` over names, π, e and rationals (`sin(u)`, `exp(u)`,
 * `u^(1/2)`); they are keyed by the canonical print of their arguments, so
 * equal kernels are one generator. An atom is a constant printed as a bare
 * name (a host language's constant, or `i` in complex roots).
 */
export type Generator = {
    readonly kind: 'name';
    readonly name: string;
    readonly span: Span;
} | {
    readonly kind: 'pi';
} | {
    readonly kind: 'e';
} | {
    readonly kind: 'atom';
    readonly name: string;
    readonly span: Span;
} | {
    readonly kind: 'kernel';
    /** A function name, or `'^'` for a power `args[0]^args[1]` that is not a polynomial power. */
    readonly fn: string;
    readonly args: readonly RatFun[];
    readonly key: string;
    readonly span: Span;
    /** Free variable names inside the arguments. */
    readonly names: ReadonlySet<string>;
};
/** num/den with gcd(num, den) = 1 and den normalized: coprime integer coefficients, positive leading coefficient. */
export type RatFun = {
    readonly num: Poly;
    readonly den: Poly;
};
/**
 * The normal-form phases of `simplify` (RFC §7) that the arithmetic itself
 * performs. `Context.notes` records them when a verb asks for it.
 */
export type Phase = 'fold' | 'expand' | 'collect' | 'cancel';
export declare class Context {
    readonly budget: Budget;
    readonly language: Language;
    readonly numbers: 'fraction' | 'decimal';
    /** The caller's sign assumptions, by variable name (a `Map`, so `__proto__` is an ordinary name). */
    readonly assumptions: ReadonlyMap<string, Assumption>;
    /** Phases the arithmetic performed, when a verb records them (`simplify`). */
    notes: Set<string> | undefined;
    /** Values of nodes already read, by identity, when a verb reads trees that share subtrees (a raw derivative). */
    cache: Map<Node, RatFun> | undefined;
    readonly generators: Generator[];
    /** Every polynomial the input divides by: each must be non-zero where the input is defined. */
    readonly divisors: Poly[];
    private readonly ids;
    constructor(options: CasOptions);
    /** Throws `bad-variable` unless `variable` is a plain name that is neither a constant nor a function. */
    checkVariable(variable: string): void;
    private note;
    private intern;
    pi(): number;
    e(): number;
    name(name: string, span: Span): number;
    atom(name: string, span: Span): number;
    /** The id of a name if the input used it. */
    nameId(name: string): number | undefined;
    kernel(fn: string, args: readonly RatFun[], key: string, span: Span): number;
    /** Free variable names of a value, through kernel arguments. */
    namesIn(r: RatFun): Set<string>;
    /** True when every generator of `p` is π or e. */
    isConstant(p: Poly): boolean;
    fromPoly(p: Poly): RatFun;
    /** num/den in normal form: cancelled by the gcd, denominator normalized. */
    quotient(num: Poly, den: Poly): RatFun;
    add(a: RatFun, b: RatFun): RatFun;
    negate(a: RatFun): RatFun;
    multiply(a: RatFun, b: RatFun): RatFun;
    divide(a: RatFun, b: RatFun): RatFun;
    power(a: RatFun, n: number): RatFun;
    /** `fold` for literal arithmetic and `u + 0`; `collect` when like terms merged. */
    private noteSum;
    /**
     * `fold` for literal arithmetic (`3*x*2`, a number times a term that has a
     * coefficient already), `0*u` and `1*u`; `expand` when a sum is multiplied
     * out; `collect` for like powers.
     */
    private noteProduct;
    /** The generator `g` as a value. */
    generatorValue(g: number): RatFun;
}
/** The value of a rational constant (no generators), else `undefined`. */
export declare function rationalValue(r: RatFun): ReturnType<typeof constantValue>;
//# sourceMappingURL=context.d.ts.map