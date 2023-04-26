/*! Copyright 2023 gnabgib MPL-2.0 */

//Take all of this with a grain of salt, (T|J)S sort of ignore (you'll get a TS error, but you can still mutate)
type TypedArrayMutableProperties =
	| 'copyWithin' //Mutates internal
	| 'fill' //Mutates internal
	| 'reverse' //Mutates internal
	| 'set' //Mutates internal
	| 'sort' //Mutates internal
	//We need to hide 'buffer' otherwise you can build a new TypedArray from the buffer and mutate
	| 'buffer'
	//We need to hide 'subarray' otherwise you can build a new TypedArray from the subarray (or its buffer) and mutate
	| 'subarray';

export interface ReadonlyUint8ClampedArray
	extends Omit<Uint8ClampedArray, TypedArrayMutableProperties> {
	readonly [n: number]: number;
}
export interface ReadonlyUint8Array
	extends Omit<Uint8Array, TypedArrayMutableProperties> {
	readonly [n: number]: number;
}
export interface ReadonlyUint16Array
	extends Omit<Uint16Array, TypedArrayMutableProperties> {
	readonly [n: number]: number;
}
export interface ReadonlyUint32Array
	extends Omit<Uint32Array, TypedArrayMutableProperties> {
	readonly [n: number]: number;
}
export interface ReadonlyInt8Array
	extends Omit<Int8Array, TypedArrayMutableProperties> {
	readonly [n: number]: number;
}
export interface ReadonlyInt16Array
	extends Omit<Int16Array, TypedArrayMutableProperties> {
	readonly [n: number]: number;
}
export interface ReadonlyInt32Array
	extends Omit<Int32Array, TypedArrayMutableProperties> {
	readonly [n: number]: number;
}
export interface ReadonlyFloat32Array
	extends Omit<Float32Array, TypedArrayMutableProperties> {
	readonly [n: number]: number;
}
export interface ReadonlyFloat64Array
	extends Omit<Float64Array, TypedArrayMutableProperties> {
	readonly [n: number]: number;
}

export type ReadonlyTypedArray =
	| ReadonlyInt8Array
	| ReadonlyUint8Array
	| ReadonlyUint8ClampedArray
	| ReadonlyInt16Array
	| ReadonlyUint16Array
	| ReadonlyInt32Array
	| ReadonlyUint32Array
	| ReadonlyFloat32Array
	| ReadonlyFloat64Array;
