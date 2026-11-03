import { isFailure, UnexpectedFailure } from '@arki/failure';
import { InvalidArgumentError, MathError, ResourceLimitError } from '@arki/math/errors';
const REMEDIATION = {
    'unsupported-function': 'Remove the function at `span` or compute this case numerically.',
    'not-differentiable': 'Differentiate where the input is differentiable.',
    'not-in-domain': 'Remove the value at `span`; v1 works over the reals.',
    'bad-variable': 'Pass a name that is not a constant or function of the language.',
    'not-rational': 'Pass an input built from + - * / and integer powers only.',
    'not-polynomial': 'Pass a polynomial: no division by the variable and no function of it at `span`.',
    'unsupported-constant': 'Replace the constant at `span` with a name: cas tests zero only for rationals, π and e.',
};
/** The input is outside what a cas verb handles. Values never cause this; budgets throw `CasLimitError`. */
export class CasError extends MathError {
    code;
    remediation;
    /** Where in the input's `source` the problem is, when it has a place. */
    span;
    constructor(message, code, span) {
        super(message);
        this.code = code;
        this.remediation = REMEDIATION[code];
        this.span = span === undefined ? undefined : { start: span.start, end: span.end };
    }
}
/** An input went over one of its budgets. Thrown before the expensive work wherever a bound can be computed. */
export class CasLimitError extends ResourceLimitError {
    budget;
    limit;
    actual;
    constructor(budget, limit, actual) {
        super(`cas ${budget} budget exceeded: ${actual} > ${limit}`);
        this.budget = budget;
        this.limit = limit;
        this.actual = actual;
    }
}
export const DEFAULT_LIMITS = Object.freeze({
    nodes: 5000,
    depth: 256,
    terms: 10_000,
    degree: 1000,
    gcdDegree: 64,
    digits: 1000,
    fuel: 100_000,
    order: 10,
    steps: 2000,
    stepNodes: 50_000,
    factorDegree: 128,
    factorDigits: 300,
    liftDigits: 2000,
    recombination: 65_536,
});
const BUDGETS = [
    'nodes',
    'depth',
    'terms',
    'degree',
    'gcdDegree',
    'digits',
    'fuel',
    'order',
    'steps',
    'stepNodes',
    'factorDegree',
    'factorDigits',
    'liftDigits',
    'recombination',
];
const SIGNAL_INTERVAL = 1024;
/** Per-call budgets and the abort signal. Created once per verb call, never shared. */
export class Budget {
    limits;
    signal;
    used = 0;
    constructor(options) {
        this.limits = resolveLimits(options.limits);
        this.signal = options.signal;
        this.checkSignal();
    }
    /** Throws when `actual` is over the `budget`. */
    check(budget, actual) {
        const limit = this.limits[budget];
        if (actual > limit)
            throw new CasLimitError(budget, limit, actual);
    }
    /** Counts `units` of arithmetic; checks the signal every 1 024 units. */
    spend(units) {
        const before = Math.floor(this.used / SIGNAL_INTERVAL);
        this.used += units;
        if (this.used > this.limits.fuel)
            throw new CasLimitError('fuel', this.limits.fuel, this.used);
        if (Math.floor(this.used / SIGNAL_INTERVAL) !== before)
            this.checkSignal();
    }
    checkSignal() {
        if (this.signal?.aborted === true)
            throw this.signal.reason;
    }
}
function resolveLimits(limits) {
    if (limits === undefined)
        return DEFAULT_LIMITS;
    const resolved = { ...DEFAULT_LIMITS };
    for (const key of BUDGETS) {
        const value = limits[key];
        if (value === undefined)
            continue;
        if (!Number.isSafeInteger(value) || value < 1) {
            throw new InvalidArgumentError(`limits.${key} must be a positive integer, got ${String(value)}`);
        }
        resolved[key] = value;
    }
    return resolved;
}
/**
 * The tree from `parse`, or the error `parse` caught as the failure's `cause`: cas verbs return a result or throw, so
 * a `ParseError` (with its span) or `ExprLimitError` still reaches the caller as before.
 */
export function treeOrThrow(parsed) {
    if (!isFailure(parsed))
        return parsed;
    if (parsed.cause instanceof Error)
        throw parsed.cause;
    throw new UnexpectedFailure(parsed);
}
//# sourceMappingURL=core.js.map