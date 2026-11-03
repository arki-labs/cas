import type { Context } from './context.js';
import type { Poly } from './poly.js';
/** The sign of `p`, a polynomial in π and e only; `undefined` when the `digits` budget cannot decide it. */
export declare function constantSign(p: Poly, ctx: Context): -1 | 0 | 1 | undefined;
/** `p` in floating point, π and e as `Math.PI` and `Math.E`. */
export declare function constantFloat(p: Poly, ctx: Context): number;
//# sourceMappingURL=constants.d.ts.map