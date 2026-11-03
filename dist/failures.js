import { defineFailure } from '@arki/failure';
import { InvalidArgumentError, MathError, ResourceLimitError } from '@arki/math/errors';
import { CasError } from './core.js';
/** Carries the failure `parse` returned for a string out of `inputExpr`, so the text door can return it unchanged. Never escapes a verb. */
export class ParseRefused extends Error {
    failure;
    constructor(failure) {
        super('cas read a string that does not parse');
        this.failure = failure;
    }
}
/**
 * The text parses, but the verb does not handle it: a function it cannot differentiate (`floor(x)`), a non-polynomial given to `factor`, a kernel given to `rationalize`. `cause` is the `CasError`, with `code` and `span`.
 *
 * @fix Show the user the span from `cause` and the reason from `cause.code`; do not retry the same text.
 * @verify cd packages/cas && bun run vitest run src/text.test.ts
 */
export const UnsupportedText = /* @__PURE__ */ defineFailure('cas.unsupported_text', {
    status: 400,
    message: 'The expression is outside what this verb handles.',
    remediation: 'Change the expression at the span of the cause; read cause.code for the reason.',
});
/**
 * The text went over a cas budget (terms, degree, digits, fuel, order, steps, factor sizes). `cause` is the `CasLimitError` with `budget`, `limit` and `actual`.
 *
 * @fix Reject the input as too large, or raise `options.limits` on purpose.
 * @verify cd packages/cas && bun run vitest run src/text.test.ts
 */
export const OverCasBudget = /* @__PURE__ */ defineFailure('cas.over_budget', {
    status: 400,
    message: 'The expression is over a cas budget.',
    remediation: 'Shorten the expression, or raise the budget in options.limits on purpose.',
});
/**
 * The text parses, but the expression has no value: `x/0`, or an overflow. `cause` is the `@arki/math` error.
 *
 * @fix Show the user that the expression has no value; read `cause.code` for which rule.
 * @verify cd packages/cas && bun run vitest run src/text.test.ts
 */
export const NoCasValue = /* @__PURE__ */ defineFailure('cas.no_value', {
    status: 400,
    message: 'The expression has no value.',
    remediation: 'Change the expression so no divisor is zero and no result overflows.',
});
/** What a verb returns for a string it cannot work with besides {@link ParseFailure}. The one list; {@link CasTextFailure} is derived from it. */
export const CAS_TEXT_FAILURES = [UnsupportedText, OverCasBudget, NoCasValue];
function textFailure(error) {
    if (error instanceof ParseRefused)
        return error.failure;
    if (error instanceof CasError && error.code !== 'bad-variable')
        return UnsupportedText({ cause: error });
    if (error instanceof ResourceLimitError)
        return OverCasBudget({ cause: error });
    if (error instanceof MathError && !(error instanceof InvalidArgumentError) && !(error instanceof CasError)) {
        return NoCasValue({ cause: error });
    }
    throw error;
}
/** Runs a verb. When `text` is true the input was a string, so a thrown parse, budget or value error becomes its returned failure. */
export function atTextDoor(text, run) {
    if (!text)
        return run();
    try {
        return run();
    }
    catch (error) {
        return textFailure(error);
    }
}
//# sourceMappingURL=failures.js.map