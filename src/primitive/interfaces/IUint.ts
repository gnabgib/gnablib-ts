/*! Copyright 2025 the gnablib contributors MPL-1.1 */

interface IShiftOps<T> {
	/** Shift bits left by `by`, return results, can exceed bit width (will zero) */
	lShift(by: number): T;
	/** Rotate bits left by `by`, bring the outgoing bits in on the right & return results, can exceed bit width */
	lRot(by: number): T;
	/** Arithmetic shift bits right by `by`, return results, can exceed bit width */
	rShift(by: number): T;
	/** Rotate bits right by `by`, bring the outgoing bits in on the left & return results, can exceed bit width */
	rRot(by: number): T;
}
interface IShiftEqOps<T> {
	/** Shift internal bits left by `by`, return self, can exceed bit width (will zero) */
	lShiftEq(by: number): T;
	/** Rotate internal bits left by `by`, bring the outgoing bits in on the right & return self, can exceed bit width */
	lRotEq(by: number): T;
	/** Arithmetically internally shift bits right by `by`, return self, can exceed bit width */
	rShiftEq(by: number): T;
	/** Rotate internal bits right by `by`, bring the outgoing bits in on the left  & return self, can exceed bit width */
	rRotEq(by: number): T;
}
interface ILogicOps<T> {
	/** Return `this` ⊕ `o` */
	xor(o: T): T;
	/** Return `this` ∨ `o` */
	or(o: T): T;
	/** Return `this` ∧ `o`*/
	and(o: T): T;
	/** Return ¬ `this` */
	not(): T;
}
interface ILogicEqOps<T> {
	/** `this` ⊕= `o`, return self */
	xorEq(o: T): T;
	/** `this` ∨= `o`, return self */
	orEq(o: T): T;
	/**  `this` ∧= `o`,return self */
	andEq(o: T): T;
	/** ¬ `this`, return self */
	notEq(): T;
}
interface IArithOps<T> {
	/** Return `this` + `o`*/
	add(o: T): T;
	/** Return `this` - `o`*/
	sub(o: T): T;
	/** Return `this` * `o` */
	mul(o: T): T;
}
interface IArithSignOps<T> extends IArithOps<T> {
	/** Whether this value is negative */
	get negative(): boolean;
	/** Return absolute value */
	abs(): T;
}
interface IArithEqOps<T> {
	/** `this` += `o`, return self */
	addEq(o: T): T;
	/** `this` -= `o`, return self */
	subEq(o: T): T;
	/** `this` *= `o`, return self */
	mulEq(o: T): T;
}
interface IArithEqSignOps<T> extends IArithEqOps<T> {
	/** Whether this value is negative */
	get negative(): boolean;
	/** Make value absolute, return self */
	absEq(): T;
}
interface IComparable<T> {
	/** Whether `this` == `o` */
	eq(o: T): boolean;
	/** Whether `this` > `o` */
	gt(o: T): boolean;
	/** Whether `this` >= `o` */
	gte(o: T): boolean;
	/** Whether `this` < `o` */
	lt(o: T): boolean;
	/** Whether `this` <= `o` */
	lte(o: T): boolean;
}
export interface ICtComparable<T> {
	/** Whether `this` == `o` in **constant time** */
	ctEq(o: T): boolean;
	/** Whether `this` > `o` in **constant time** */
	ctGt(o: T): boolean;
	/** Whether `this` is >= `o` in **constant time** */
	ctGte(o: T): boolean;
	/** Whether `this` < `o` in **constant time** */
	ctLt(o: T): boolean;
	/** Whether `this` <= `o` in **constant time** */
	ctLte(o: T): boolean;
	/** Return a copy of `this` or `o` (if `other`) **constant time** */
	ctSwitch(o: T, other: boolean): T;
}
interface IBasic<T> {
	/** Number of 32bit elements required */
	get size32(): number;
	/** Create a **copy** of this element */
	clone(): T;
	/** Create a **copy** of the `Uint32Array` within, little endian order */
	clone32(): Uint32Array;
	/** Create a **copy** of internal value as a big-endian stream of bytes */
	toBytesBE(): Uint8Array;
	//?toBytesLE():Uint8Array;
	toString(): string;
	/** Get the least significant byte */
	getByte(idx: number): number;

	//Statics
	// 	static fromInt(n:number):T;
	// 	static fromI32s(...ns:number[]):T;
	// 	static fromBytesBE(b:Uint8Array,pos=0):T;
	//	?static fromBytesLE(b:Uint8Array,pos=0):T;
	// 	static mount(b:Uint32Array,pos:number):T;//repl: fromArray|fromBuffer

	//(opt) mut():INumMut<T>

	// x toMinBytesBE(): Uint8Array;
	// x toBytesLE():Uint8Array;
	// x toMinBytesLE(): Uint8Array;
	// x static get max():T;
	// x static fromBytesLE(src:Uint8Array,pos=0):T;
}
interface IBasicMut<T, Tro> {
	/** Update value, return self */
	set(v: Tro): T;
	/** Zero this value */
	zero(): T;
}
/** Int numbers should implement this @hidden */
export interface IInt<T>
	extends IBasic<T>,
		IShiftOps<T>,
		ILogicOps<T>,
		IArithOps<T>,
		IArithSignOps<T>,
		IComparable<T> {}
/** Uint numbers should implement this @hidden */
export interface IUint<T>
	extends IBasic<T>,
		IShiftOps<T>,
		ILogicOps<T>,
		IArithOps<T>,
		IComparable<T> {}
/** Int mutable numbers should implement this @hidden */
export interface IIntMut<T, Tro>
	extends IInt<Tro>,
		IBasicMut<T, Tro>,
		IShiftEqOps<T>,
		ILogicEqOps<T>,
		IArithEqSignOps<T> {}
/** Uint mutable numbers should implement this @hidden */
export interface IUintMut<T, Tro>
	extends IUint<Tro>,
		IBasicMut<T, Tro>,
		IShiftEqOps<T>,
		ILogicEqOps<T>,
		IArithEqOps<T> {}
