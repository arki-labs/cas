/**
 * Shared types, errors and budgets (RFC §10–§12). Internal module: the public
 * names are re-exported by `index.ts` and the verb entries.
 */
import type { Expr, Language, ParseFailure, Span } from '@arki/expr';
import type { AbortSignalLike } from '@arki/expr/float';
import { MathError, ResourceLimitError } from '@arki/math/errors';
export type { AbortSignalLike } from '@arki/expr/float';
/** An expr AST, or a string parsed with expr's canonical `scientific` syntax. */
export type CasInput = Expr | string;
export type Relation = 'nonzero' | 'positive' | 'nonnegative' | 'negative';
/** What the caller knows about one variable's sign (RFC §6). v1 is real-only: every variable ranges over ℝ. */
export type Assumption = 'nonzero' | 'positive' | 'nonnegative' | 'negative';
/** Assumptions per variable name, for one call. */
export type Assumptions = Readonly<Record<string, Assumption>>;
/** A restriction the result relies on (RFC §6). `subject` is canonical, e.g. `x - 1`. */
export type Condition = {
    readonly subject: Expr;
    readonly relation: Relation;
    readonly reason: 'domain' | 'differentiable' | 'assumed';
};
/** Budgets (RFC §12). Each is a positive integer. */
export type CasLimits = {
    /** Nodes of the input tree, and of each output tree before printing. Default 5 000. */
    readonly nodes: number;
    /** Nesting depth of the input tree. Default 256. */
    readonly depth: number;
    /** Terms an expansion may produce, estimated before it runs. Default 10 000. */
    readonly terms: number;
    /** Degree in any one generator, checked before powers and products. Default 1 000. */
    readonly degree: number;
    /** Degree of the inputs of a polynomial gcd. Default 64. */
    readonly gcdDegree: number;
    /** Digits of any coefficient, estimated before multiplying; also the precision cap of π/e sign decisions. Default 1 000. */
    readonly digits: number;
    /** Arithmetic steps per call. Default 100 000. */
    readonly fuel: number;
    /** Highest derivative order, checked before differentiating. Default 10. */
    readonly order: number;
    /** Steps of one derivation, bounded before each order from the size of what it differentiates. Default 2 000. */
    readonly steps: number;
    /** Printed nodes across a derivation's steps, counted before any step is printed. Default 50 000. */
    readonly stepNodes: number;
    /** Degree of each square-free part `factor` splits over ℚ. Default 128. */
    readonly factorDegree: number;
    /** Digits of the largest coefficient `factor` splits over ℚ. Default 300. */
    readonly factorDigits: number;
    /** Digits of the modulus p^k that Hensel lifting reaches, computed before lifting. Default 2 000. */
    readonly liftDigits: number;
    /** Candidate products tried while recombining modular factors. Default 65 536. */
    readonly recombination: number;
};
export type CasOptions = {
    /** Functions and constants of the input. Default `scientific`. */
    readonly language?: Language;
    /** Signs the caller knows, per variable. A rewrite that relies on one returns it as a condition with reason `assumed`. */
    readonly assume?: Assumptions;
    readonly limits?: Partial<CasLimits>;
    /** Checked every 1 024 fuel units; the call throws `signal.reason` once it is aborted. */
    readonly signal?: AbortSignalLike;
    /** `'fraction'` (default) prints `x/50`; `'decimal'` prints a terminating rational as a decimal (`0.02*x`). */
    readonly numbers?: 'fraction' | 'decimal';
};
export type CasResult = {
    readonly result: Expr;
    readonly conditions: readonly Condition[];
};
/** Why a cas verb rejected its input. Apps translate messages by this code. */
export type CasErrorCode = 'unsupported-function' | 'not-differentiable' | 'not-in-domain' | 'bad-variable' | 'not-rational' | 'not-polynomial' | 'unsupported-constant';
/** The input is outside what a cas verb handles. Values never cause this; budgets throw `CasLimitError`. */
export declare class CasError extends MathError {
    readonly code: CasErrorCode;
    readonly remediation: string;
    /** Where in the input's `source` the problem is, when it has a place. */
    readonly span: Span | undefined;
    constructor(message: string, code: CasErrorCode, span?: Span);
}
export type CasBudget = keyof CasLimits;
/** An input went over one of its budgets. Thrown before the expensive work wherever a bound can be computed. */
export declare class CasLimitError extends ResourceLimitError {
    readonly budget: CasBudget;
    readonly limit: number;
    readonly actual: number;
    constructor(budget: CasBudget, limit: number, actual: number);
}
export declare const DEFAULT_LIMITS: CasLimits;
/** Per-call budgets and the abort signal. Created once per verb call, never shared. */
export declare class Budget {
    readonly limits: CasLimits;
    private readonly signal;
    private used;
    constructor(options: CasOptions);
    /** Throws when `actual` is over the `budget`. */
    check(budget: CasBudget, actual: number): void;
    /** Counts `units` of arithmetic; checks the signal every 1 024 units. */
    spend(units: number): void;
    private checkSignal;
}
/**
 * The tree from `parse`, or the error `parse` caught as the failure's `cause`: cas verbs return a result or throw, so
 * a `ParseError` (with its span) or `ExprLimitError` still reaches the caller as before.
 */
export declare function treeOrThrow(parsed: Expr | ParseFailure): Expr;
//# sourceMappingURL=core.d.ts.map