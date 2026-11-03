/**
 * Input (RFC §5.1): an expr AST becomes a `RatFun` over the call's
 * generators. Groups are transparent; literals are read exactly from `raw`
 * (`0.01` is 1/100); `pi` and `e` are generators; `i` is rejected (v1 is
 * real-only); anything that is not `+ - * / ^integer` becomes a kernel.
 *
 * Internal module.
 */
import type { Expr, Node, Span } from '@arki/expr';
import type { Context, RatFun } from './context.js';
import type { CasInput } from './core.js';
/** Parses a string, or checks a given AST against the `nodes` and `depth` budgets (without recursion). */
export declare function inputExpr(input: CasInput, ctx: Context): Expr;
/** The kernel `fn(args)` as a value; equal kernels are one generator. */
export declare function kernelValue(fn: string, args: readonly RatFun[], span: Span, ctx: Context): RatFun;
/**
 * Reads a node. Recursion is bounded by the input's depth, checked by
 * `inputExpr`. With `ctx.cache` set, a shared subtree is read once.
 */
export declare function read(node: Node, ctx: Context): RatFun;
//# sourceMappingURL=read.d.ts.map