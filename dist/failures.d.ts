/**
 * Verbs that take a string read outside text, so they return failures; the
 * same verbs given an `Expr` the caller built keep result-or-throw. The thrown
 * error is the failure's `cause`, and a string that does not parse returns the failure `parse` returned. A bad `variable`, a bad option and an
 * aborted signal are bugs or the caller's own stop, so they are thrown on.
 * Internal module: the public names are re-exported by `index.ts`.
 */
import type { ParseFailure } from '@arki/expr';
import type { FailureOf } from '@arki/failure';
/** Carries the failure `parse` returned for a string out of `inputExpr`, so the text door can return it unchanged. Never escapes a verb. */
export declare class ParseRefused extends Error {
    readonly failure: ParseFailure;
    constructor(failure: ParseFailure);
}
/**
 * The text parses, but the verb does not handle it: a function it cannot differentiate (`floor(x)`), a non-polynomial given to `factor`, a kernel given to `rationalize`. `cause` is the `CasError`, with `code` and `span`.
 *
 * @fix Show the user the span from `cause` and the reason from `cause.code`; do not retry the same text.
 * @verify cd packages/cas && bun run vitest run src/text.test.ts
 */
export declare const UnsupportedText: import("@arki/failure").FailureDefinition<"cas.unsupported_text", undefined>;
/**
 * The text went over a cas budget (terms, degree, digits, fuel, order, steps, factor sizes). `cause` is the `CasLimitError` with `budget`, `limit` and `actual`.
 *
 * @fix Reject the input as too large, or raise `options.limits` on purpose.
 * @verify cd packages/cas && bun run vitest run src/text.test.ts
 */
export declare const OverCasBudget: import("@arki/failure").FailureDefinition<"cas.over_budget", undefined>;
/**
 * The text parses, but the expression has no value: `x/0`, or an overflow. `cause` is the `@arki/math` error.
 *
 * @fix Show the user that the expression has no value; read `cause.code` for which rule.
 * @verify cd packages/cas && bun run vitest run src/text.test.ts
 */
export declare const NoCasValue: import("@arki/failure").FailureDefinition<"cas.no_value", undefined>;
/** What a verb returns for a string it cannot work with besides {@link ParseFailure}. The one list; {@link CasTextFailure} is derived from it. */
export declare const CAS_TEXT_FAILURES: readonly [import("@arki/failure").FailureDefinition<"cas.unsupported_text", undefined>, import("@arki/failure").FailureDefinition<"cas.over_budget", undefined>, import("@arki/failure").FailureDefinition<"cas.no_value", undefined>];
/** A failure value returned by a cas verb given a string: `parse`'s own failure, or one of {@link CAS_TEXT_FAILURES}. */
export type CasTextFailure = ParseFailure | FailureOf<(typeof CAS_TEXT_FAILURES)[number]>;
/** Runs a verb. When `text` is true the input was a string, so a thrown parse, budget or value error becomes its returned failure. */
export declare function atTextDoor<T>(text: boolean, run: () => T): T | CasTextFailure;
//# sourceMappingURL=failures.d.ts.map