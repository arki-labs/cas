/**
 * `@arki/cas/derivation` (RFC §9.2–§9.3): `derivative`'s result plus the
 * rule-by-rule derivation tree. Every rule application at every level is a
 * step with a stable rule, an i18n template key and its own `before`/`after`.
 * No English is built in: apps translate `template.key` and render `params`.
 *
 * Tree shape: the root has one `order` step per order. Each order has the
 * differentiation tree (children are the derivatives a rule needs; the chain
 * rule is its own step) and, when normalizing changed the text, a
 * `simplification` step. Its children are the algebraic normal form (one
 * step: `fold`, `expand`, `collect` and `cancel` are computed together) and
 * then each rule of the rule table that changed the expression, in table
 * order, shown by switching the rules on one at a time.
 */
import type { Expr } from '@arki/expr';
import type { CasInput, CasOptions, CasResult, Condition } from './core.js';
import type { DerivativeRule } from './differentiate.js';
import type { CasTextFailure } from './failures.js';
import type { SimplifyRule } from './normal.js';
export type { DerivativeRule } from './differentiate.js';
export type { SimplifyRule } from './normal.js';
/** The phases of the algebraic normal form, computed together in one step. */
export type NormalPhase = 'fold' | 'expand' | 'collect' | 'cancel';
export type StepRule = 
/** The root: all orders. */
{
    readonly kind: 'derivation';
    readonly order: number;
}
/** One order: its differentiation tree, then its simplification. */
 | {
    readonly kind: 'order';
    readonly order: number;
} | {
    readonly kind: 'derivative';
    readonly id: DerivativeRule;
    readonly fn?: string;
}
/** A subterm already derived in step `of`: derived once, shown once. */
 | {
    readonly kind: 'repeat';
    readonly of: number;
}
/** An order's normalization: its children are the phases below. */
 | {
    readonly kind: 'simplification';
} | {
    readonly kind: 'normal-form';
    readonly phases: readonly NormalPhase[];
} | {
    readonly kind: 'simplify';
    readonly id: SimplifyRule;
};
export type StepTemplate = {
    /** The translation key, one of `TEMPLATE_KEYS`: `'derivative.product'`, `'derivative.function.sin'`, `'simplify.exp-ln'`. */
    readonly key: string;
    /** Values the app renders: an `Expr` via `toLatex`; strings are names; numbers are orders and step indices. */
    readonly params: Readonly<Record<string, Expr | number | string>>;
};
export type DerivationStep = {
    /** Pre-order position, stable within one result; the root is 0. */
    readonly index: number;
    readonly rule: StepRule;
    readonly template: StepTemplate;
    /** The operand: for a derivative rule the function being differentiated; for a simplify rule the whole expression. */
    readonly before: Expr;
    /** The derivative of `before` (`fold` applied only), or the rewritten expression. */
    readonly after: Expr;
    readonly children: readonly DerivationStep[];
    /** Conditions this step introduced. */
    readonly conditions?: readonly Condition[];
};
export type Derivation = CasResult & {
    readonly steps: DerivationStep;
};
export type DerivationOptions = CasOptions & {
    /** How many times to differentiate. Default 1; at most the `order` budget (default 10). */
    readonly order?: number;
};
/** Every template key a derivation can emit, for apps to check their translations. */
export declare const TEMPLATE_KEYS: readonly string[];
/**
 * The rule's formula in LaTeX, language-neutral: `(f g)' = f' g + f g'`.
 * Empty for the container steps (`derivation`, `order`, `simplification`,
 * `normal-form`, `repeat`), whose meaning is their children.
 */
export declare function ruleFormula(rule: StepRule): string;
/**
 * `derivative`'s result and conditions, plus the derivation tree (RFC §9.3).
 * The result is computed exactly as `derivative` computes it.
 *
 * ```ts
 * const { result, steps } = derivation('sin(x^2)', 'x');
 * result.source; // '2 * x * cos(x^2)'
 * steps.children[0]?.children[0]?.rule; // { kind: 'derivative', id: 'chain' }
 * ```
 *
 * Budgets: `steps` is checked before each order from the size of what it
 * differentiates; `stepNodes` bounds the printed size of all steps and is
 * checked before any step is printed.
 */
export declare function derivation(input: Expr, variable: string, options?: DerivationOptions): Derivation;
export declare function derivation(input: CasInput, variable: string, options?: DerivationOptions): Derivation | CasTextFailure;
export type { CasInput, CasOptions, CasResult, Condition } from './core.js';
export type { CasTextFailure } from './failures.js';
//# sourceMappingURL=derivation.d.ts.map