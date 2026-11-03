import { parse, scientific } from '@arki/expr';
import { isFailure } from '@arki/failure';
import { DivisionByZeroError, InvalidArgumentError } from '@arki/math/errors';
import { Budget, CasError } from './core.js';
import { add, constant, constantValue, divideExact, gcd, generator, generators, isZero, leadingTerm, multiply, negate, ONE, power, rationalContent, scale, } from './poly.js';
const UNIT = constant(ONE);
const ASSUMPTIONS = new Set(['nonzero', 'positive', 'nonnegative', 'negative']);
export class Context {
    budget;
    language;
    numbers;
    /** The caller's sign assumptions, by variable name (a `Map`, so `__proto__` is an ordinary name). */
    assumptions;
    /** Phases the arithmetic performed, when a verb records them (`simplify`). */
    notes;
    /** Values of nodes already read, by identity, when a verb reads trees that share subtrees (a raw derivative). */
    cache;
    generators = [];
    /** Every polynomial the input divides by: each must be non-zero where the input is defined. */
    divisors = [];
    ids = new Map();
    constructor(options) {
        this.budget = new Budget(options);
        this.language = options.language ?? scientific;
        this.numbers = options.numbers ?? 'fraction';
        const assumptions = new Map();
        for (const [name, assumption] of Object.entries(options.assume ?? {})) {
            // Options may come from JSON: check the value at run time, whatever the type says.
            const value = assumption;
            if (!ASSUMPTIONS.has(value)) {
                throw new InvalidArgumentError(`assume.${name} must be nonzero, positive, nonnegative or negative, got ${String(value)}`);
            }
            this.checkVariable(name);
            assumptions.set(name, assumption);
        }
        this.assumptions = assumptions;
    }
    /** Throws `bad-variable` unless `variable` is a plain name that is neither a constant nor a function. */
    checkVariable(variable) {
        let ok = false;
        const parsed = parse(variable, { language: this.language });
        if (!isFailure(parsed)) {
            const root = parsed.root;
            ok = root.kind === 'name' && root.name === variable && this.language.constantSpec(variable) === undefined;
        }
        if (!ok || this.language.functionSpec(variable) !== undefined) {
            throw new CasError(`"${variable}" cannot be a variable: it is not a name, or it is a constant or function`, 'bad-variable');
        }
    }
    note(phase) {
        this.notes?.add(phase);
    }
    intern(key, make) {
        const known = this.ids.get(key);
        if (known !== undefined)
            return known;
        const id = this.generators.length;
        this.generators.push(make());
        this.ids.set(key, id);
        return id;
    }
    pi() {
        return this.intern('pi', () => ({ kind: 'pi' }));
    }
    e() {
        return this.intern('e', () => ({ kind: 'e' }));
    }
    name(name, span) {
        return this.intern(`name:${name}`, () => ({ kind: 'name', name, span }));
    }
    atom(name, span) {
        return this.intern(`atom:${name}`, () => ({ kind: 'atom', name, span }));
    }
    /** The id of a name if the input used it. */
    nameId(name) {
        return this.ids.get(`name:${name}`);
    }
    kernel(fn, args, key, span) {
        return this.intern(`kernel:${key}`, () => {
            const names = new Set();
            for (const arg of args)
                for (const n of this.namesIn(arg))
                    names.add(n);
            return { kind: 'kernel', fn, args, key, span, names };
        });
    }
    /** Free variable names of a value, through kernel arguments. */
    namesIn(r) {
        const out = new Set();
        for (const g of [...generators(r.num), ...generators(r.den)]) {
            const gen = this.generators[g];
            if (gen?.kind === 'name')
                out.add(gen.name);
            else if (gen?.kind === 'kernel')
                for (const n of gen.names)
                    out.add(n);
        }
        return out;
    }
    /** True when every generator of `p` is π or e. */
    isConstant(p) {
        for (const g of generators(p)) {
            const kind = this.generators[g]?.kind;
            if (kind !== 'pi' && kind !== 'e')
                return false;
        }
        return true;
    }
    // ---- RatFun arithmetic ----
    fromPoly(p) {
        return { num: p, den: UNIT };
    }
    /** num/den in normal form: cancelled by the gcd, denominator normalized. */
    quotient(num, den) {
        if (isZero(den))
            throw new DivisionByZeroError('cas: division by zero');
        if (isZero(num))
            return { num, den: UNIT };
        let n = num;
        let d = den;
        if (constantValue(d) === undefined) {
            const g = gcd(n, d, this.budget);
            if (constantValue(g) === undefined) {
                this.note('cancel');
                n = divideExact(n, g, this.budget) ?? n;
                d = divideExact(d, g, this.budget) ?? d;
            }
        }
        const dc = constantValue(d);
        if (dc !== undefined)
            return { num: scale(n, dc.inverse()), den: UNIT };
        const content = rationalContent(d);
        const unit = leadingTerm(d)?.c.isNegative() === true ? content.negated() : content;
        return { num: scale(n, unit.inverse()), den: scale(d, unit.inverse()) };
    }
    add(a, b) {
        if (this.notes !== undefined)
            this.noteSum(a, b);
        if (constantValue(a.den) !== undefined && constantValue(b.den) !== undefined)
            return this.fromPoly(add(a.num, b.num));
        return this.quotient(add(multiply(a.num, b.den, this.budget), multiply(b.num, a.den, this.budget)), multiply(a.den, b.den, this.budget));
    }
    negate(a) {
        return { num: negate(a.num), den: a.den };
    }
    multiply(a, b) {
        if (this.notes !== undefined)
            this.noteProduct(a, b);
        const num = multiply(a.num, b.num, this.budget);
        if (constantValue(a.den) !== undefined && constantValue(b.den) !== undefined)
            return this.fromPoly(num);
        return this.quotient(num, multiply(a.den, b.den, this.budget));
    }
    divide(a, b) {
        if (isZero(b.num))
            throw new DivisionByZeroError('cas: division by zero');
        // `fold` when a number divides a coefficient (`6*x/2`, not `x/2`; `6/4`, not `3/2`), or for a
        // fraction as divisor: dividing by it multiplies by its reciprocal (`1/x^-1` is `x`).
        const [ra, rb] = [rationalValue(a), rationalValue(b)];
        // An integer fraction in lowest terms with a positive denominator (`3/2`) is printed as it was written.
        const written = ra?.isInteger() === true && rb?.isInteger() === true && ra.times(rb.inverse()).denominator === rb.numerator;
        const literal = rb !== undefined && !written && scaled(a);
        if (literal || constantValue(b.den) === undefined)
            this.note('fold');
        this.divisors.push(b.num);
        return this.quotient(multiply(a.num, b.den, this.budget), multiply(a.den, b.num, this.budget));
    }
    power(a, n) {
        if (n === 0 || n === 1 || rationalValue(a) !== undefined)
            this.note('fold');
        else if (a.num.size > 1 || a.den.size > 1)
            this.note('expand');
        if (n >= 0)
            return { num: power(a.num, n, this.budget), den: power(a.den, n, this.budget) };
        if (isZero(a.num))
            throw new DivisionByZeroError('cas: zero to a negative power');
        this.divisors.push(a.num);
        return this.quotient(power(a.den, -n, this.budget), power(a.num, -n, this.budget));
    }
    /** `fold` for literal arithmetic and `u + 0`; `collect` when like terms merged. */
    noteSum(a, b) {
        const ra = rationalValue(a);
        const rb = rationalValue(b);
        if ((ra !== undefined && rb !== undefined) || ra?.isZero() === true || rb?.isZero() === true)
            this.note('fold');
        else if (add(a.num, b.num).size < a.num.size + b.num.size)
            this.note('collect');
    }
    /**
     * `fold` for literal arithmetic (`3*x*2`, a number times a term that has a
     * coefficient already), `0*u` and `1*u`; `expand` when a sum is multiplied
     * out; `collect` for like powers.
     */
    noteProduct(a, b) {
        const ra = rationalValue(a);
        const rb = rationalValue(b);
        const trivial = (r) => r !== undefined && (r.isZero() || r.eq(ONE));
        if ((ra !== undefined && rb !== undefined) ||
            trivial(ra) ||
            trivial(rb) ||
            (ra !== undefined && scaled(b)) ||
            (rb !== undefined && scaled(a))) {
            this.note('fold');
            return;
        }
        if (a.num.size > 1 || b.num.size > 1)
            this.note('expand');
        const shared = [...generators(a.num), ...generators(a.den)].some(g => generators(b.num).has(g) || generators(b.den).has(g));
        if (shared)
            this.note('collect');
    }
    /** The generator `g` as a value. */
    generatorValue(g) {
        return this.fromPoly(generator(g));
    }
}
/** A term of `r` has a coefficient other than 1, so a number multiplying or dividing `r` folds into it. */
function scaled(r) {
    return [...r.num.values(), ...r.den.values()].some(t => !t.c.eq(ONE));
}
/** The value of a rational constant (no generators), else `undefined`. */
export function rationalValue(r) {
    return constantValue(r.den) === undefined ? undefined : constantValue(r.num);
}
//# sourceMappingURL=context.js.map