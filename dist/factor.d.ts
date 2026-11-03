import type { Budget } from './core.js';
/** Ascending integer coefficients, no trailing zeros. */
export type Zx = bigint[];
/** f divided by the gcd of its coefficients, with a positive leading coefficient. */
export declare function primitive(f: Zx): Zx;
/**
 * Yun's square-free decomposition of a primitive f over ℤ, with heuristic
 * gcds: parts (primitive, positive leading coefficient) with multiplicities,
 * whose product is f. `undefined` when a heuristic gcd gives up.
 */
export declare function squareFree(f: Zx, budget: Budget): [Zx, number][] | undefined;
/**
 * The irreducible factors over ℤ of a square-free primitive f (degree ≥ 1,
 * positive leading coefficient), each primitive with a positive leading
 * coefficient. Their product is f.
 */
export declare function irreducibleFactors(f: Zx, budget: Budget): Zx[];
//# sourceMappingURL=factor.d.ts.map