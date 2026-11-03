import { lostConditions } from './conditions.js';
import { differentiateOrders, FUNCTIONS, nonzeroConditions, treeSize } from './differentiate.js';
import { exprOf } from './emit.js';
import { atTextDoor } from './failures.js';
import { normalize, Readable, RULES } from './normal.js';
const NORMAL_PHASES = ['fold', 'expand', 'collect', 'cancel'];
/** Rules shown one by one after the normal form; `factor-out` is printing only and comes last. */
const KERNEL_RULES = RULES.filter(rule => !NORMAL_PHASES.includes(rule) && rule !== 'factor-out');
/** Every template key a derivation can emit, for apps to check their translations. */
export const TEMPLATE_KEYS = Object.freeze([
    'derivation',
    'derivation.order',
    'derivation.simplification',
    'derivative.constant',
    'derivative.variable',
    'derivative.sum',
    'derivative.constant-multiple',
    'derivative.constant-divisor',
    'derivative.product',
    'derivative.quotient',
    'derivative.power',
    'derivative.exponential',
    'derivative.exponential.e',
    'derivative.general-power',
    'derivative.logarithm',
    'derivative.logarithm.base',
    'derivative.root.sqrt',
    'derivative.root.cbrt',
    'derivative.root.nth',
    'derivative.absolute-value',
    'derivative.chain',
    'derivative.repeat',
    ...Object.keys(FUNCTIONS).map(fn => `derivative.function.${fn}`),
    'simplify.normal-form',
    ...KERNEL_RULES.map(rule => `simplify.${rule}`),
    'simplify.factor-out',
]);
const FUNCTION_FORMULAS = {
    sin: String.raw `(\sin u)' = \cos u`,
    cos: String.raw `(\cos u)' = -\sin u`,
    tan: String.raw `(\tan u)' = \sec^2 u`,
    sec: String.raw `(\sec u)' = \sec u \tan u`,
    csc: String.raw `(\csc u)' = -\csc u \cot u`,
    cot: String.raw `(\cot u)' = -\csc^2 u`,
    asin: String.raw `(\arcsin u)' = \frac{1}{\sqrt{1 - u^2}}`,
    acos: String.raw `(\arccos u)' = -\frac{1}{\sqrt{1 - u^2}}`,
    atan: String.raw `(\arctan u)' = \frac{1}{1 + u^2}`,
    asec: String.raw `(\operatorname{arcsec} u)' = \frac{1}{|u| \sqrt{u^2 - 1}}`,
    acsc: String.raw `(\operatorname{arccsc} u)' = -\frac{1}{|u| \sqrt{u^2 - 1}}`,
    acot: String.raw `(\operatorname{arccot} u)' = -\frac{1}{1 + u^2}`,
    sinh: String.raw `(\sinh u)' = \cosh u`,
    cosh: String.raw `(\cosh u)' = \sinh u`,
    tanh: String.raw `(\tanh u)' = \operatorname{sech}^2 u`,
    sech: String.raw `(\operatorname{sech} u)' = -\operatorname{sech} u \tanh u`,
    csch: String.raw `(\operatorname{csch} u)' = -\operatorname{csch} u \coth u`,
    coth: String.raw `(\coth u)' = -\operatorname{csch}^2 u`,
    asinh: String.raw `(\operatorname{arsinh} u)' = \frac{1}{\sqrt{u^2 + 1}}`,
    acosh: String.raw `(\operatorname{arcosh} u)' = \frac{1}{\sqrt{u^2 - 1}}`,
    atanh: String.raw `(\operatorname{artanh} u)' = \frac{1}{1 - u^2}`,
    asech: String.raw `(\operatorname{arsech} u)' = -\frac{1}{u \sqrt{1 - u^2}}`,
    acsch: String.raw `(\operatorname{arcsch} u)' = -\frac{1}{|u| \sqrt{1 + u^2}}`,
    acoth: String.raw `(\operatorname{arcoth} u)' = \frac{1}{1 - u^2}`,
};
const DERIVATIVE_FORMULAS = {
    constant: String.raw `c' = 0`,
    variable: String.raw `x' = 1`,
    sum: String.raw `(f \pm g)' = f' \pm g'`,
    'constant-multiple': String.raw `(c f)' = c f'`,
    product: String.raw `(f g)' = f' g + f g'`,
    quotient: String.raw `\left(\frac{f}{g}\right)' = \frac{f' g - f g'}{g^2}`,
    power: String.raw `(u^n)' = n u^{n - 1}`,
    exponential: String.raw `(a^u)' = a^u \ln a`,
    'general-power': String.raw `(f^g)' = f^g \left(g' \ln f + \frac{g f'}{f}\right)`,
    logarithm: String.raw `(\log_b u)' = \frac{1}{u \ln b}`,
    function: '',
    root: String.raw `(\sqrt[n]{u})' = \frac{1}{n \sqrt[n]{u}^{n - 1}}`,
    'absolute-value': String.raw `|u|' = \operatorname{sgn} u \quad (u \neq 0)`,
    chain: String.raw `(f(u))' = f'(u) \, u'`,
};
const SIMPLIFY_FORMULAS = {
    'integer-powers': String.raw `\left(u^{p/q}\right)^k = u^{k p / q}`,
    'fractional-powers': String.raw `u^a u^b = u^{a + b} \quad (u > 0)`,
    'sqrt-of-square': String.raw `\sqrt{u^2} = |u|`,
    'square-of-sqrt': String.raw `\left(\sqrt{u}\right)^2 = u`,
    'exp-ln': String.raw `e^{\ln u} = u`,
    'ln-exp': String.raw `\ln e^u = u`,
    'exp-product': String.raw `e^a e^b = e^{a + b}`,
    'abs-sign': String.raw `\frac{|u|}{u} = \operatorname{sgn} u`,
    parity: String.raw `f(-u) = \pm f(u)`,
    'special-values': String.raw `\sin 0 = 0, \ \cos 0 = 1, \ \ln 1 = 0`,
    'factor-out': String.raw `a b + a c = a (b + c)`,
};
/**
 * The rule's formula in LaTeX, language-neutral: `(f g)' = f' g + f g'`.
 * Empty for the container steps (`derivation`, `order`, `simplification`,
 * `normal-form`, `repeat`), whose meaning is their children.
 */
export function ruleFormula(rule) {
    switch (rule.kind) {
        case 'derivative': {
            if (rule.id === 'function')
                return FUNCTION_FORMULAS[rule.fn ?? ''] ?? '';
            if (rule.id === 'exponential' && rule.fn === 'exp')
                return String.raw `(e^u)' = e^u`;
            if (rule.id === 'logarithm' && rule.fn === 'ln')
                return String.raw `(\ln u)' = \frac{1}{u}`;
            if (rule.id === 'root' && rule.fn === 'sqrt')
                return String.raw `(\sqrt{u})' = \frac{1}{2 \sqrt{u}}`;
            if (rule.id === 'root' && rule.fn === 'cbrt')
                return String.raw `(\sqrt[3]{u})' = \frac{1}{3 \sqrt[3]{u}^2}`;
            return DERIVATIVE_FORMULAS[rule.id];
        }
        case 'simplify': {
            return SIMPLIFY_FORMULAS[rule.id] ?? '';
        }
        case 'derivation':
        case 'order':
        case 'repeat':
        case 'simplification':
        case 'normal-form': {
            return '';
        }
    }
}
function conditionKey(c) {
    return `${c.reason}:${c.relation}:${c.subject.source}`;
}
/** The differentiation tree as drafts; `repeat` keeps a link to the step it repeats. */
function fromRaw(step, order, run, seen) {
    const children = step.children.map(child => fromRaw(child, order, run, seen));
    const rule = step.rule === 'repeat'
        ? { kind: 'repeat', target: step.of === undefined ? undefined : seen.get(step.of) }
        : { kind: 'derivative', id: step.rule, ...(step.fn === undefined ? {} : { fn: step.fn }) };
    const conditions = step.nonzero === undefined ? [] : nonzeroConditions(run.ctx, [step.nonzero]);
    const draft = {
        rule,
        key: step.key,
        params: step.params,
        before: step.before,
        after: step.after,
        children,
        ...(conditions.length > 0 ? { conditions } : {}),
    };
    seen.set(step, draft);
    return draft;
}
/**
 * The simplification of one order as steps: the algebraic normal form, then
 * each applied rule switched on in table order, then `factor-out`. A stage
 * that leaves the text unchanged is omitted. Each step lists the conditions
 * it added.
 */
function simplification(order, normal, run) {
    const ctx = run.ctx;
    const domain = () => order.domain;
    // Staged runs may divide by new polynomials; the divisors feed later printing, so they are dropped afterwards.
    const divisors = ctx.divisors.length;
    ctx.budget.check('nodes', treeSize(order.raw, new Map()));
    const rawText = exprOf(order.raw, ctx).source;
    // Restrictions the raw derivative already lost belong to differentiating (they are on the root), not to a simplify step.
    const known = new Set(lostConditions(ctx, order.domain, order.rawValue, new Readable(ctx)).map(c => conditionKey(c)));
    const stages = [];
    let previous;
    const stage = (rule, key, enabled, factorOut) => {
        const next = normalize(ctx, order.rawValue, domain, new Set(), enabled, factorOut);
        const added = next.conditions.filter(c => !known.has(conditionKey(c)));
        for (const c of added)
            known.add(conditionKey(c));
        const before = previous?.root ?? order.raw;
        if ((previous?.source ?? rawText) !== next.result.source) {
            stages.push({
                rule,
                key,
                params: {},
                before,
                after: next.result.root,
                children: [],
                ...(added.length > 0 ? { conditions: added } : {}),
            });
        }
        previous = next.result;
    };
    const enabled = new Set();
    const phases = NORMAL_PHASES.filter(phase => order.notes.has(phase));
    stage({ kind: 'normal-form', phases }, 'simplify.normal-form', enabled, false);
    for (const rule of KERNEL_RULES) {
        if (!normal.applied.includes(rule))
            continue;
        enabled.add(rule);
        stage({ kind: 'simplify', id: rule }, `simplify.${rule}`, enabled, false);
    }
    if (normal.applied.includes('factor-out'))
        stage({ kind: 'simplify', id: 'factor-out' }, 'simplify.factor-out', enabled, true);
    ctx.divisors.splice(divisors);
    if (stages.length === 0 || rawText === normal.result.source)
        return undefined;
    return {
        rule: { kind: 'simplification' },
        key: 'derivation.simplification',
        params: {},
        before: order.raw,
        after: normal.result.root,
        children: stages,
    };
}
export function derivation(input, variable, options = {}) {
    return atTextDoor(typeof input === 'string', () => derivationOrThrow(input, variable, options));
}
function derivationOrThrow(input, variable, options) {
    const run = differentiateOrders(input, variable, { ...options, simplify: true }, true);
    const drafts = [];
    for (const [i, order] of run.orders.entries()) {
        const normal = order.normal;
        const root = order.steps?.[0];
        if (normal === undefined || root === undefined)
            throw new Error('cas invariant: a derivation records and normalizes every order');
        const tree = fromRaw(root, order, run, new Map());
        const simplified = simplification(order, normal, run);
        drafts.push({
            rule: { kind: 'order', order: i + 1 },
            key: 'derivation.order',
            params: { order: i + 1 },
            before: order.input,
            after: normal.result.root,
            children: simplified === undefined ? [tree] : [tree, simplified],
        });
    }
    const first = run.orders[0];
    if (first === undefined)
        throw new Error('cas invariant: at least one order was differentiated');
    const top = {
        rule: { kind: 'derivation', order: run.orders.length },
        key: 'derivation',
        params: { order: run.orders.length, x: variable },
        before: first.input,
        after: run.result.root,
        children: drafts,
        ...(run.conditions.length > 0 ? { conditions: run.conditions } : {}),
    };
    checkPrintedSize(top, run);
    return { result: run.result, conditions: run.conditions, steps: materialize(top, run) };
}
/** The printed size of every step's trees, from the DAG, before any is printed. */
function checkPrintedSize(top, run) {
    const memo = new Map();
    let total = 0;
    const stack = [top];
    for (let draft = stack.pop(); draft !== undefined; draft = stack.pop()) {
        total += treeSize(draft.before, memo) + treeSize(draft.after, memo);
        for (const value of Object.values(draft.params))
            if (typeof value === 'object')
                total += treeSize(value, memo);
        stack.push(...draft.children);
    }
    run.ctx.budget.check('stepNodes', total);
}
/** Drafts to steps: pre-order indices, each tree printed once and shared. */
function materialize(top, run) {
    const printed = new Map();
    const print = (node) => {
        const known = printed.get(node);
        if (known !== undefined)
            return known;
        const expr = exprOf(node, run.ctx);
        printed.set(node, expr);
        return expr;
    };
    const indices = new Map();
    let next = 0;
    const build = (draft) => {
        const index = next++;
        indices.set(draft, index);
        const params = {};
        for (const [name, value] of Object.entries(draft.params))
            params[name] = typeof value === 'object' ? print(value) : value;
        // The repeated step comes earlier in pre-order, so its index is known.
        const rule = draft.rule.kind === 'repeat'
            ? { kind: 'repeat', of: draft.rule.target === undefined ? -1 : (indices.get(draft.rule.target) ?? -1) }
            : draft.rule;
        if (rule.kind === 'repeat')
            params.of = rule.of;
        const before = print(draft.before);
        const after = print(draft.after);
        const children = draft.children.map(child => build(child));
        return {
            index,
            rule,
            template: { key: draft.key, params },
            before,
            after,
            children,
            ...(draft.conditions === undefined ? {} : { conditions: draft.conditions }),
        };
    };
    return build(top);
}
//# sourceMappingURL=derivation.js.map