import { inputDomain } from './conditions.js';
import { Context } from './context.js';
import { atTextDoor } from './failures.js';
import { normalize } from './normal.js';
import { inputExpr, read } from './read.js';
export function simplify(input, options = {}) {
    return atTextDoor(typeof input === 'string', () => {
        const ctx = new Context(options);
        const notes = new Set();
        ctx.notes = notes;
        const value = read(inputExpr(input, ctx).root, ctx);
        const [kernels, divisors] = [ctx.generators.length, ctx.divisors.length];
        const { result, conditions, applied } = normalize(ctx, value, () => inputDomain(ctx, kernels, divisors), notes);
        return { result, conditions, applied };
    });
}
//# sourceMappingURL=simplify.js.map