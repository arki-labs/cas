/**
 * The differentiator (RFC §9.1) and the loop over orders that `derivative`
 * and `derivation` share (§9.2).
 *
 * It works rule by rule on the expr tree, so a derivation can show each
 * rule. Every subtree gets a structural id (hash-consing), and a derivative
 * is memoized per id, so each distinct subterm is derived once and the cost
 * is linear in the DAG, not in the unfolded tree. The raw derivative has
 * `fold` applied only; each order is then normalized by the rule table.
 * Steps are recorded only when the caller passes a list to record into:
 * `derivative` never does, so a rule costs one check.
 *
 * Internal module.
 */
import type { Expr, Node } from '@arki/expr';
import type { Rational } from '@arki/math/rational';
import type { Domain } from './conditions.js';
import type { RatFun } from './context.js';
import type { CasInput, CasOptions, Condition } from './core.js';
import type { Normal } from './normal.js';
import { Context } from './context.js';
/** The differentiation rules of RFC §9.3. */
export type DerivativeRule = 'constant' | 'variable' | 'sum' | 'constant-multiple' | 'product' | 'quotient' | 'power' | 'exponential' | 'general-power' | 'logarithm' | 'function' | 'root' | 'absolute-value' | 'chain';
/**
 * One rule application as the differentiator records it. Steps hold trees,
 * not printed text, so a derivation can check its budgets before printing.
 */
export type RawStep = {
    readonly rule: DerivativeRule | 'repeat';
    /** The function a `function`, `logarithm`, `root`, `exponential` or `absolute-value` step differentiates. */
    readonly fn: string | undefined;
    readonly key: string;
    readonly params: Readonly<Record<string, Node | string>>;
    readonly before: Node;
    after: Node;
    readonly children: RawStep[];
    /** For `repeat`: the step that derived this subterm first. */
    readonly of: RawStep | undefined;
    /** For `absolute-value`: the rule holds where this is non-zero. */
    readonly nonzero: Node | undefined;
};
/**
 * Builds trees with `fold` (RFC §7): literal arithmetic, `0*u`, `u + 0`,
 * `1*u`, `u^1`, `u/1`. Nothing else is rewritten, so a step shows the
 * textbook form of its rule.
 */
declare class Fold {
    private readonly decimal;
    constructor(ctx: Context);
    value(q: Rational): Node;
    negate(a: Node): Node;
    plus(a: Node, b: Node): Node;
    minus(a: Node, b: Node): Node;
    times(a: Node, b: Node): Node;
    over(a: Node, b: Node): Node;
    pow(a: Node, b: Node): Node;
}
/**
 * Derivatives of one order with respect to one variable. One instance per
 * order: ids and the memo belong to the tree being differentiated.
 */
export declare class Differentiator {
    /** The `u` of every `abs(u)` differentiated: its derivative holds where `u ≠ 0`. */
    readonly nonzero: Node[];
    private readonly fold;
    private readonly variable;
    /** False after the first order: those trees are cas output, so a span would not point into the caller's text. */
    private readonly spans;
    private readonly ids;
    private readonly idOf;
    private readonly varying;
    private readonly memo;
    constructor(ctx: Context, variable: string, spans: boolean);
    /** Distinct subterms seen so far: the size of the DAG. */
    get size(): number;
    /** The structural id of a subtree; groups and unary `+` share their operand's id. Recursion is bounded by the depth budget. */
    id(node: Node): number;
    private intern;
    private shape;
    /** True when the subtree contains the variable. */
    varies(node: Node): boolean;
    /** The raw derivative of `node`; each rule application goes into `into` when the caller records steps. */
    derive(node: Node, into: RawStep[] | undefined): Node;
    private leaf;
    private plan;
    private binary;
    /** `(f ± g ± …)' = f' ± g' ± …`: one step for the whole chain of `+` and `-`. */
    private sum;
    /** `(c·f)' = c·f'` for a factor `c` without the variable. */
    private scaled;
    private power;
    /**
     * A rule for the outer function at `u`. When `u` is not the variable
     * itself, the chain rule is its own step, with the outer rule and `u'` as
     * children: `sin(x^2)` is `chain` over `function` and `power`.
     */
    private outer;
    private call;
    private unsupported;
}
type Outer = (u: Node, f: Fold) => Node;
/** f'(u) for the functions of the `function` rule; the chain rule multiplies by u'. */
export declare const FUNCTIONS: Readonly<Record<string, Outer>>;
/** One order of a run: what was differentiated, the raw derivative, its steps and its normal form. */
export type Order = {
    /** The tree this order differentiates: the input, then each previous order's result. */
    readonly input: Node;
    readonly raw: Node;
    readonly rawValue: RatFun;
    /** The differentiation tree, when steps were recorded: one root step. */
    readonly steps: readonly RawStep[] | undefined;
    /** The domain of the input and of every raw derivative up to this order. */
    readonly domain: Domain;
    /** The phases reading the raw derivative performed. */
    readonly notes: ReadonlySet<string>;
    /** The normalized derivative; `undefined` for a last order left raw (`simplify: false`). */
    readonly normal: Normal | undefined;
};
export type Run = {
    readonly ctx: Context;
    readonly orders: readonly Order[];
    readonly result: Expr;
    readonly conditions: readonly Condition[];
};
/** A derivation's step budget for one order: one rule step plus one possible `chain` step per DAG node, and 16 simplify steps. */
export declare function stepBound(dagNodes: number): number;
/** Unfolded size of a tree that may share subtrees, without unfolding it. */
export declare function treeSize(node: Node, memo: Map<Node, number>): number;
/**
 * Differentiates `order` times, normalizing between orders. The conditions
 * cover the input's domain (a derivative exists only where the function is
 * defined), every raw derivative's domain, and `u ≠ 0` for each `abs(u)`
 * (reason `differentiable`). `record` keeps the steps for a derivation, with
 * the `steps` budget checked before each order.
 */
export declare function differentiateOrders(input: CasInput, variable: string, options: CasOptions & {
    readonly order?: number;
    readonly simplify?: boolean;
}, record: boolean): Run;
/** `u ≠ 0` for each `abs(u)`, unless the sign oracle proves it from the expression and the caller's assumptions. */
export declare function nonzeroConditions(ctx: Context, subjects: readonly Node[]): Condition[];
export {};
//# sourceMappingURL=differentiate.d.ts.map