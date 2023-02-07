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

export * from './ReadonlyTypedArray';

// @ts-expect-error: es2016 doesn't support BigInt64Array
interface BigInt64Array extends BigInt64Array {}
// @ts-expect-error: es2016 doesn't support BigUint64Array
interface BigUint64Array extends BigUint64Array {}

export interface ReadonlyBigInt64Array
	extends Omit<BigInt64Array, TypedArrayMutableProperties> {
	readonly [n: number]: bigint;
}
export interface ReadonlyBigUint64Array
	extends Omit<BigUint64Array, TypedArrayMutableProperties> {
	readonly [n: number]: bigint;
}
