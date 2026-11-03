import { walk } from '@arki/expr';
import { inputDomain, lostConditions, mergeConditions } from './conditions.js';
import { Context, rationalValue } from './context.js';
import { CasError } from './core.js';
import { binary, Emitter, exprOf, numberNode } from './emit.js';
import { atTextDoor } from './failures.js';
import { coefficientsIn, constant, constantValue, degreeIn, divideExact, EMPTY, fromCoefficientsIn, generators, multiply, normalized, ONE, gcd as polyGcd, power, rationalContent, scale, } from './poly.js';
import { inputExpr, read } from './read.js';
import { rationalFactorization, rationalFactors, rationalIn, squareFreeParts } from './roots.js';
export { exactRoots } from './roots.js';
function load(input, options) {
    const ctx = new Context(options);
    return { ctx, value: read(inputExpr(input, ctx).root, ctx) };
}
/** The conditions a value carries: every restriction of the input it no longer shows (RFC §6). */
function conditionsOf(value, ctx, main) {
    return lostConditions(ctx, inputDomain(ctx), value, new Emitter(ctx, main));
}
/**
 * The span of the first divisor in pre-order, `/ u` or `u^-n`, whose value
 * `varies` accepts: where a quotient by the variable starts.
 */
function divisorSpan(root, ctx, varies) {
    let span;
    walk(root, node => {
        if (span !== undefined)
            return false;
        if (node.kind !== 'binary')
            return true;
        if (node.op === '/' && varies(read(node.right, ctx)))
            span = node.right.span;
        const exponent = node.op === '^' ? rationalValue(read(node.right, ctx)) : undefined;
        if (span === undefined && exponent?.isNegative() === true && varies(read(node.left, ctx)))
            span = node.span;
        return span === undefined;
    });
    return span;
}
/** The generator of `value` that comes first in the input, among those `test` accepts. */
function earliest(value, ctx, test) {
    let first;
    for (const g of new Set([...generators(value.num), ...generators(value.den)])) {
        const gen = ctx.generators[g];
        if (gen === undefined || gen.kind === 'pi' || gen.kind === 'e' || !test(gen))
            continue;
        if (first === undefined || gen.span.start < first.span.start)
            first = gen;
    }
    return first;
}
/** The first kernel or atom of a value, by source position. */
function firstKernel(value, ctx) {
    return earliest(value, ctx, gen => gen.kind !== 'name')?.span;
}
export function expand(input, options = {}) {
    return atTextDoor(typeof input === 'string', () => expandOrThrow(input, options));
}
function expandOrThrow(input, options) {
    const { ctx, value } = load(input, options);
    return { result: exprOf(new Emitter(ctx).node(value), ctx), conditions: conditionsOf(value, ctx) };
}
/** A polynomial grouped by powers of generator `x`: `(2*pi + 3)*x + y`. */
function collectedNode(emitter, p, x) {
    const parts = [];
    const coefficients = coefficientsIn(p, x);
    for (let i = coefficients.length - 1; i >= 0; i--) {
        const c = coefficients[i];
        if (c === undefined || c.size === 0)
            continue;
        const power = i === 0
            ? undefined
            : i === 1
                ? emitter.generatorNode(x)
                : binary('^', emitter.generatorNode(x), numberNode(String(i)));
        if (c.size === 1 || power === undefined) {
            parts.push(...emitter.parts(power === undefined ? c : fromCoefficientsIn([...Array.from({ length: i }, () => EMPTY), c], x)));
        }
        else {
            parts.push({ negative: false, node: () => binary('*', emitter.polyNode(c), power) });
        }
    }
    return emitter.join(parts);
}
export function collect(input, variable, options = {}) {
    return atTextDoor(typeof input === 'string', () => collectOrThrow(input, variable, options));
}
function collectOrThrow(input, variable, options) {
    const ctx = new Context(options);
    ctx.checkVariable(variable);
    const value = read(inputExpr(input, ctx).root, ctx);
    const x = ctx.nameId(variable);
    const emitter = new Emitter(ctx, x);
    const conditions = conditionsOf(value, ctx, x);
    if (x === undefined)
        return { result: exprOf(emitter.node(value), ctx), conditions };
    const [num, den] = constantValue(value.den) === undefined ? emitter.fractionParts(value) : [value.num, value.den];
    const top = collectedNode(emitter, num, x);
    const node = constantValue(den) === undefined ? binary('/', top, collectedNode(emitter, den, x)) : top;
    return { result: exprOf(node, ctx), conditions };
}
export function rationalize(input, options = {}) {
    return atTextDoor(typeof input === 'string', () => rationalizeOrThrow(input, options));
}
function rationalizeOrThrow(input, options) {
    const { ctx, value } = load(input, options);
    const span = firstKernel(value, ctx);
    if (span !== undefined)
        throw new CasError('the input is not a rational function: it holds a function call or a non-integer power', 'not-rational', span);
    const emitter = new Emitter(ctx);
    const [num, den] = emitter.fractionParts(value);
    return {
        numerator: exprOf(emitter.polyNode(num), ctx),
        denominator: exprOf(emitter.polyNode(den), ctx),
        conditions: conditionsOf(value, ctx),
    };
}
export function gcd(a, b, options = {}) {
    return atTextDoor(typeof a === 'string' || typeof b === 'string', () => gcdOrThrow(a, b, options));
}
function gcdOrThrow(a, b, options) {
    const ctx = new Context(options);
    const inputs = [inputExpr(a, ctx).root, inputExpr(b, ctx).root];
    const [x, y] = [read(inputs[0], ctx), read(inputs[1], ctx)];
    for (const [k, value] of [x, y].entries()) {
        const which = k === 0 ? 'first' : 'second';
        const untested = untestedConstant(value, ctx);
        if (untested !== undefined)
            throw new CasError(`gcd: the ${which} input has an untested constant`, 'unsupported-constant', untested);
        if (constantValue(value.den) === undefined) {
            const span = divisorSpan(inputs[k === 0 ? 0 : 1], ctx, r => constantValue(r.num) === undefined);
            throw new CasError(`gcd: the ${which} input is a quotient`, 'not-polynomial', span);
        }
    }
    let g = polyGcd(x.num, y.num, ctx.budget);
    const emitter = new Emitter(ctx);
    // "Leading" is the term that prints first: the internal leading term depends on generator ids.
    const first = emitter.firstTerm(g);
    if (first !== undefined) {
        const content = rationalContent(g);
        const unit = generators(g).size === 1 ? first.c : first.c.isNegative() ? content.negated() : content;
        g = scale(g, unit.inverse());
    }
    const conditions = mergeConditions(conditionsOf(x, ctx), conditionsOf(y, ctx));
    return { result: exprOf(emitter.polyNode(g), ctx), conditions };
}
function coefficientOf(r, emitter, ctx) {
    const rational = rationalValue(r);
    return { value: exprOf(emitter.node(r), ctx), rational: rational ?? null };
}
/**
 * The span of the first constant cas cannot zero-test (`sqrt(2)`, `ln(2)`,
 * `exp(1/2)`): only rationals, π and e have a zero test, and `factor` and
 * `gcd` must decide zero (`sqrt(2)^2 - 2` is 0, but as a free symbol it is not).
 */
function untestedConstant(value, ctx) {
    return earliest(value, ctx, gen => gen.kind === 'atom' || (gen.kind === 'kernel' && gen.names.size === 0))?.span;
}
function offenderOf(value, variable, ctx) {
    const gen = earliest(value, ctx, g => g.kind !== 'name' || g.name !== variable);
    if (gen === undefined)
        return undefined;
    const reason = gen.kind === 'name' || (gen.kind === 'kernel' && !gen.names.has(variable) && gen.names.size > 0)
        ? 'other-variable'
        : gen.kind === 'kernel' && gen.names.has(variable)
            ? 'transcendental'
            : 'unsupported-constant';
    return { reason, span: gen.span };
}
export function polynomialIn(input, variable, options = {}) {
    return atTextDoor(typeof input === 'string', () => polynomialInOrThrow(input, variable, options));
}
function polynomialInOrThrow(input, variable, options) {
    const ctx = new Context(options);
    ctx.checkVariable(variable);
    const value = read(inputExpr(input, ctx).root, ctx);
    const offender = offenderOf(value, variable, ctx);
    if (offender !== undefined)
        return { kind: 'other', reason: offender.reason, span: offender.span };
    const x = ctx.nameId(variable);
    const emitter = new Emitter(ctx, x);
    const conditions = conditionsOf(value, ctx, x);
    const split = (p) => (x === undefined ? (p.size === 0 ? [] : [p]) : coefficientsIn(p, x));
    if (x !== undefined && degreeIn(value.den, x) > 0) {
        const [num, den] = emitter.fractionParts(value);
        const toCoefficients = (p) => split(p).map(c => coefficientOf(ctx.fromPoly(c), emitter, ctx));
        return { kind: 'rational', numerator: toCoefficients(num), denominator: toCoefficients(den), conditions };
    }
    const coefficients = split(value.num).map(c => coefficientOf(c.size === 0 ? ctx.fromPoly(c) : ctx.quotient(c, value.den), emitter, ctx));
    return { kind: 'polynomial', coefficients, conditions };
}
/**
 * `p` with the term that prints first made positive: with `x` as the main
 * variable, that is the leading coefficient in `x`, by its own first printed
 * term (the internal leading term depends on generator ids).
 */
function positiveIn(p, emitter) {
    return emitter.firstTerm(p)?.c.isNegative() === true ? scale(p, ONE.negated()) : p;
}
export function factor(input, variable, options = {}) {
    return atTextDoor(typeof input === 'string', () => factorOrThrow(input, variable, options));
}
function factorOrThrow(input, variable, options) {
    const ctx = new Context(options);
    ctx.checkVariable(variable);
    const root = inputExpr(input, ctx).root;
    const value = read(root, ctx);
    const x = ctx.nameId(variable);
    const emitter = new Emitter(ctx, x);
    const conditions = conditionsOf(value, ctx, x);
    const offender = offenderOf(value, variable, ctx);
    const untested = untestedConstant(value, ctx);
    if (untested !== undefined) {
        throw new CasError('factor: the input has an untested constant', 'unsupported-constant', untested);
    }
    if (offender?.reason === 'transcendental') {
        throw new CasError(`factor takes a polynomial in ${variable}: it holds a function of it`, 'not-polynomial', offender.span);
    }
    if (x !== undefined && degreeIn(value.den, x) > 0) {
        const span = divisorSpan(root, ctx, r => degreeIn(r.num, x) > 0);
        throw new CasError(`factor takes a polynomial in ${variable}: it divides by ${variable}`, 'not-polynomial', span);
    }
    if (x === undefined || degreeIn(value.num, x) === 0) {
        return { content: exprOf(emitter.node(value), ctx), factors: [], complete: true, conditions };
    }
    // A square-free part with rational coefficients factors completely; one irreducible over ℚ stays
    // irreducible when transcendental constants (other names, π, e) join the coefficients.
    let complete = true;
    const found = [];
    if (rationalIn(value.num, x)) {
        for (const [p, multiplicity] of rationalFactorization(value.num, x, ctx))
            found.push({ p, multiplicity });
    }
    else {
        for (const [part, multiplicity] of squareFreeParts(value.num, x, ctx)) {
            const rational = rationalIn(normalized(part), x);
            // Parts come from the primitive part, so they are primitive (Gauss's lemma): one of degree 1 is irreducible.
            complete &&= rational || degreeIn(part, x) === 1;
            const pieces = rational ? rationalFactors(part, x, ctx) : [positiveIn(normalized(part), emitter)];
            for (const p of pieces)
                found.push({ p, multiplicity });
        }
    }
    let product = constant(ONE);
    for (const { p, multiplicity } of found)
        product = multiply(product, power(p, multiplicity, ctx.budget), ctx.budget);
    const rest = divideExact(value.num, product, ctx.budget);
    if (rest === undefined)
        throw new Error('cas invariant: the factors do not divide the input');
    const sorted = found
        .map(({ p, multiplicity }) => ({ factor: exprOf(emitter.polyNode(p), ctx), multiplicity, degree: degreeIn(p, x) }))
        .sort((a, b) => a.degree - b.degree || (a.factor.source < b.factor.source ? -1 : 1));
    return {
        content: exprOf(emitter.node(ctx.quotient(rest, value.den)), ctx),
        factors: sorted.map(({ factor: f, multiplicity }) => ({ factor: f, multiplicity })),
        complete,
        conditions,
    };
}
//# sourceMappingURL=polynomial.js.map