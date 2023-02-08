import { NullError } from './ErrorExt.js';

/**
 * If @param obj is null or undefined a @see NullError is thrown
 * @param obj
 * @param noun
 */
export function notNull(obj: unknown, noun?: string): void {
	if (obj === null || obj === undefined) throw new NullError(noun);
}
