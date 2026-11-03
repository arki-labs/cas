import { differentiateOrders } from './differentiate.js';
import { atTextDoor } from './failures.js';
export function derivative(input, variable, options = {}) {
    return atTextDoor(typeof input === 'string', () => {
        const { result, conditions } = differentiateOrders(input, variable, options, false);
        return { result, conditions };
    });
}
//# sourceMappingURL=derivative.js.map