/*! Copyright 2025 the gnablib contributors MPL-1.1 */
/**
 * Runtime type-checking for TypeScript & JavaScript
 *
 * If you can be sure the code will only be used by TypeScript libraries without external
 * input (user or code) {@link compile.expect} might be a better choice.
 *
 * Failures will be surfaced as an TypeError
 *
 * Helpful if you maintain a TS project and aren't expecting external input (from a user or code).
 * Failures will be surfaced as TS compile errors (ts-expect).
 * Tests will be compiled-out when publishing to JS.
 */

//Typeof: "undefined"|"object"|"boolean"|"number"|"bigint"|"string"|"symbol"|"function"
// primitive: undefined|boolean|number|string
// Note Null=object

// number, string, boolean, never
export const safe = {
	/** Make sure an unknown value is a number */
	num(v: unknown, allowNull = false): number {
		const t = typeof v;
		if (t == 'number') return v as number;
		if (allowNull && v === undefined) return undefined!;
		throw new TypeError(`Expecting number, got ${t}=${v}`);
	},
	/** Make sure an unknown value is an integer */
	int(v: unknown, allowNull = false): number {
		const t = typeof v;
		if (t == 'number') {
			if (Number.isInteger(v)) return v as number;
		} else if (allowNull && v === undefined) return undefined!;
		throw new TypeError(`Expecting integer, got ${t}=${v}`);
	},
	/** Make sure an unknown value is a string */
	str(v: unknown, allowNull = false): string {
		const t = typeof v;
		if (t == 'string') return v as string;
		// //Sqlite (or the driver) will return undefined when it's an empty string
		// if (v===undefined) return allowNull?undefined!:''
		if (allowNull && v === undefined) return undefined!;
		throw new TypeError(`Expecting string, got ${t}=${v}`);
	},
	/** Make sure an unknown value is bool */
	bool(v: unknown, allowNull = false): boolean {
		const t = typeof v;
		if (t == 'boolean') return v as boolean;
		if (allowNull && v === undefined) return undefined!;
		throw new TypeError(`Expecting boolean, got ${t}=${v}`);
	},
};
