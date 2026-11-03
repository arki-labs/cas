import type { Condition } from './core.js';
export type { AbortSignalLike, Assumption, Assumptions, CasBudget, CasErrorCode, CasInput, CasLimits, CasOptions, CasResult, Condition, Relation, } from './core.js';
export { CasError, CasLimitError, DEFAULT_LIMITS } from './core.js';
export type { CasTextFailure } from './failures.js';
export { CAS_TEXT_FAILURES, NoCasValue, OverCasBudget, UnsupportedText } from './failures.js';
/** `x \neq 0`, `x > 0`, `x \geq 0`, `x < 0`: math notation, so apps need no translation for it. */
export declare function conditionToLatex(condition: Condition): string;
//# sourceMappingURL=index.d.ts.map