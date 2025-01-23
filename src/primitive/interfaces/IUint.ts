/*! Copyright 2025 the gnablib contributors MPL-1.1 */

/** This is basically internal to make sure the I/U* numbers have the same features @hidden */
export interface IShiftOps<T> {
	/** Shift bits left by `by` places & return results */
	lShift(by:number):T;
	/** Rotate bits left by `by`, bring the outgoing bits in on the right & return results */
	lRot(by:number):T;
	/** Arithmetic shift bits right by `by` places & return results */
	rShift(by:number):T;
	/** Rotate bits right by `by`, bring the outgoing bits in on the left & return results */
	rRot(by:number):T;
}
/** This is basically internal to make sure the I/U* numbers have the same features @hidden */
export interface IShiftEqOps<T> {
	/** Shift internal bits left by `by` places & return self */
	lShiftEq(by:number):T;
	/** Rotate internal bits left by `by`, bring the outgoing bits in on the right & return self */
	lRotEq(by:number):T;
	/** Arithmetically internally shift bits right by `by` places & return self */
	rShiftEq(by:number):T;
	/** Rotate internal bits right by `by`, bring the outgoing bits in on the left  & return self */
	rRotEq(by:number):T;
}
/** This is basically internal to make sure the I/U* numbers have the same features @hidden */
export interface ILogicOps<T> {
	/** Return `this` ⊕ `o` */
	xor(o:T):T;
	/** Return `this` ∨ `u64` */
	or(o:T):T;
	/** Return `this` ∧ `u64`*/
	and(o:T):T;
	/** Return ¬ `this` */
	not():T;
}
/** This is basically internal to make sure the I/U* numbers have the same features @hidden */
export interface ILogicEqOps<T> {
	/** `this` ⊕= `o`, return self */
	xorEq(o:T):T;
	/** `this` ∨= `o`, return self */
	orEq(o:T):T;
	/**  `this` ∧= `o`,return self */
	andEq(o:T):T;
	/** ¬ `this`, return self */
	notEq():T;
}
/** This is basically internal to make sure the I/U* numbers have the same features @hidden */
export interface IArithOps<T> {
	/** Return `this` + `o`*/
	add(o:T):T;
	/** Return `this` - `o`*/
	sub(o:T):T;
	/** Return `this` * `o` */
	mul(o:T):T;
}
/** This is basically internal to make sure the I* numbers have the same features @hidden */
export interface IArithSignOps<T> extends IArithOps<T> {
	/** Whether this value is negative */
	get negative():boolean;
	/** Return absolute value */
	abs():T;
}
/** This is basically internal to make sure the I/U* numbers have the same features @hidden */
export interface IArithEqOps<T> {
	/** `this` += `o`, return self */
	addEq(o:T):T;
	/** `this` -= `o`, return self */
	subEq(o:T):T;
	/** `this` *= `o`, return self */
	mulEq(o:T):T;
}
/** This is basically internal to make sure the I* numbers have the same features @hidden */
export interface IArithEqSignOps<T> extends IArithEqOps<T> {
	/** Whether this value is negative */
	get negative():boolean;
	/** Return absolute value */
	absEq():T;
}
/** This is basically internal to make sure the I* numbers have the same features @hidden */
export interface IComparable<T> {
	/** Whether `this` == `o` */
	eq(o:T):boolean;
	/** Whether `this` > `o` */
	gt(o:T):boolean;
	/** Whether `this` >= `o` */
	gte(o:T):boolean;
	/** Whether `this` < `o` */
	lt(o:T):boolean;
	/** Whether `this` <= `o` */
	lte(o:T):boolean;
}
/** This is basically internal to make sure the I* numbers have the same features @hidden */
export interface ICtComparable<T> {
	ctEq(n:T):boolean;
	ctGt(n:T):boolean;
	ctGte(n:T):boolean;
	ctLt(n:T):boolean;
	ctLte(n:T):boolean;
}
/** This is basically internal to make sure the I* numbers have the same features @hidden */
export interface ICtSelect<T> {
	ctSwitch(n:T,yes:boolean):T;
	ctSelect(a:T,b:T,first:boolean):T;
}
/** This is basically internal to make sure the I* numbers have the same features @hidden */
export interface INum<T> extends
	IShiftOps<T>,ILogicOps<T>,IArithOps<T>,IComparable<T>{
	/** Create a copy of this value */
	clone():T;
	/** Export a copy of the Uint32Array within */
	clone32():Uint32Array;
	//(opt) mut():INumMut<T>
	toBytesBE():Uint8Array;
	// toMinBytesBE(): Uint8Array;
	// toBytesLE():Uint8Array;
	// toMinBytesLE(): Uint8Array;
	toString():string;
	/** Get the least significant byte */
	getByte(idx:number):number;
	//BUILDS
	// 	static fromInt(n:number):T;
	// 	static fromI32s(...ns:number[]):T;
	// 	static fromBytesBE(b:Uint8Array,pos=0):T;
	// 	static mount(b:Uint32Array,pos:number):T;//repl: fromArray|fromBuffer
	//
	// x static get max():T;
	// x static fromBytesBE(src:Uint8Array,pos=0):T;
	// x static fromBytesLE(src:Uint8Array,pos=0):T;
}
export interface INumMut<T> extends
	INum<T>,ILogicEqOps<T>,IShiftEqOps<T>,IArithEqOps<T> {}