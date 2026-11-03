import { Rational } from '@arki/math/rational';
import type { Budget } from './core.js';
export type Monomial = readonly number[];
export type Term = {
    readonly m: Monomial;
    readonly c: Rational;
};
/** Monomial key → term. Never holds a zero coefficient; the zero polynomial is the empty map. */
export type Poly = ReadonlyMap<string, Term>;
export declare const ZERO: Rational;
export declare const ONE: Rational;
/** The zero polynomial. */
export declare const EMPTY: Poly;
export declare function constant(c: Rational): Poly;
/** `g^exponent` for generator id `g`. */
export declare function generator(g: number, exponent?: number): Poly;
/** The single term c·m. */
export declare function fromTerm(m: Monomial, c: Rational): Poly;
/** A key equal for equal polynomials, whatever order their terms were built in. */
export declare function polyKey(p: Poly): string;
export declare function isZero(p: Poly): boolean;
/** The value of a polynomial without generators, else `undefined`. */
export declare function constantValue(p: Poly): Rational | undefined;
export declare function add(a: Poly, b: Poly): Poly;
export declare function negate(p: Poly): Poly;
export declare function subtract(a: Poly, b: Poly): Poly;
export declare function scale(p: Poly, c: Rational): Poly;
/** The most digits in any coefficient (numerator plus denominator). */
export declare function maxDigits(p: Poly): number;
/** The highest exponent of any generator. */
export declare function maxDegree(p: Poly): number;
/** Checks the product's degree, digits and size before multiplying. */
export declare function multiply(a: Poly, b: Poly, budget: Budget): Poly;
/** `p^n` for an integer n ≥ 0. Every budget is checked from the exponent before any arithmetic. */
export declare function power(p: Poly, n: number, budget: Budget): Poly;
/** Ids of the generators `p` uses. */
export declare function generators(p: Poly): Set<number>;
export declare function degreeIn(p: Poly, g: number): number;
/** Coefficients of `p` as a polynomial in `g`, ascending; each is free of `g`. `[]` for zero. */
export declare function coefficientsIn(p: Poly, g: number): Poly[];
/** Σ cᵢ·gⁱ from ascending coefficients free of `g`. */
export declare function fromCoefficientsIn(coefficients: readonly Poly[], g: number): Poly;
/** Lexicographic order with the highest generator id most significant. */
export declare function compareMonomials(a: Monomial, b: Monomial): number;
/** The term with the greatest monomial in `compareMonomials` order. */
export declare function leadingTerm(p: Poly): Term | undefined;
/** The positive rational c with p/c having coprime integer coefficients. */
export declare function rationalContent(p: Poly): Rational;
/** `p` scaled to coprime integer coefficients with a positive leading coefficient. */
export declare function normalized(p: Poly): Poly;
/** `a / b` when `b` divides `a` exactly, else `undefined`. Recursion depth is the number of generators of `b`. */
export declare function divideExact(a: Poly, b: Poly, budget: Budget): Poly | undefined;
/** ∂p/∂g. */
export declare function derivativeIn(p: Poly, g: number): Poly;
/** `p` divided by its content in `g` (the gcd of its coefficients), normalized. */
export declare function primitiveIn(p: Poly, g: number, budget: Budget): Poly;
/**
 * The gcd of two polynomials over ℚ, normalized (coprime integer
 * coefficients, positive leading coefficient); 1 when they are coprime.
 * Generators are variables, π and e included (RFC §8.1).
 */
export declare function gcd(a: Poly, b: Poly, budget: Budget): Poly;
/** The product of the distinct irreducible factors of `p`, up to a constant. */
export declare function squareFreePart(p: Poly, budget: Budget): Poly;
/** Evaluates `p` in floating point, with `value(g)` for each generator. */
export declare function toFloat(p: Poly, value: (g: number) => number): number;
export declare function rationalSqrt(c: Rational): Rational | undefined;
/**
 * The square root of a polynomial over ℚ when it is a perfect square, else
 * `undefined`: term by term from the leading term, each new term strictly
 * smaller in the monomial order.
 */
export declare function polySqrt(p: Poly, budget: Budget): Poly | undefined;
//# sourceMappingURL=poly.d.ts.map