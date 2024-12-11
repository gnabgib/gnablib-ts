/*! Copyright 2023 the gnablib contributors MPL-1.1 */

type TypedArrayMutableProperties =
	| 'copyWithin' //Mutates internal
	| 'fill' //Mutates internal
	| 'reverse' //Mutates internal
	| 'set' //Mutates internal
	| 'sort' //Mutates internal
	//We need to hide 'buffer' otherwise you can build a new TypedArray from the buffer and mutate
	| 'buffer'
	//We need to hide 'subarray' otherwise you can build a new TypedArray from the subarray (or it's buffer) and mutate
	| 'subarray';

export * from './ReadonlyTypedArray.js';

export interface ReadonlyBigInt64Array
	extends Omit<BigInt64Array, TypedArrayMutableProperties> {
	readonly [n: number]: bigint;
}
export interface ReadonlyBigUint64Array
	extends Omit<BigUint64Array, TypedArrayMutableProperties> {
	readonly [n: number]: bigint;
}
