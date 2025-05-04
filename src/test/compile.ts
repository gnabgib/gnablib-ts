/*! Copyright 2025 the gnablib contributors MPL-1.1 */
/**
 * Compile time type-checking for TypeScript
 *
 * Helpful if you maintain a TS project and aren't expecting external input (from a user or code).
 * Failures will be surfaced as TS compile errors (ts-expect).
 * Tests will be compiled-out when publishing to JS.
 */

// number, string, boolean, never

/**
 * Whether v is of type T, will manifest as a TS error
 * @param v
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function expect<T extends string | number | boolean>(v: T): void {}
