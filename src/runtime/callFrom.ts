/*! Copyright 2024 the gnablib contributors MPL-1.1 */

/**
 * Return the last place to call this (not this method, but this method's caller).
 * Outputs the line in engine-format (not converted to StackEntries) to avoid 
 * circular references.
 * 
 * @param back Stack-distance back from caller to go, 0 means caller, 1 means caller's caller etc
 * @param stack Stack to parse, leave empty to have it auto generated
 * @returns 
 */
export function callFrom(back=1,stack?: string): string {
	//Unfortunately some duplicate code from StackTrace
	if (!stack) {
		stack = new Error().stack;
		/* c8 ignore next - this engine might not support stack, but we can't easily test this path*/
		if (!stack) return '';
		back+=1;
	}
	const lines = stack.split('\n');
	let ptr = 0;
	if (lines[0].startsWith('Error')) ptr++;
	ptr += back;
	return lines[ptr];
}
