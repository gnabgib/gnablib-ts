/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

export * as xtBit from './xtBit.js'
export * as xtString from './xtString.js';
export * as xtUint8Array from './xtUint8Array.js';
export { BinResult, FromBinResult } from './FromBinResult.js';
export { Lazy } from './Lazy.js';
export { MatchSuccess, MatchFail } from './MatchResult.js';
export * from './ReadonlyTypedArray.js';
export { StringBuilder } from './StringBuilder.js';
export {
	ReadonlyTyped,
	FixedTyped,
	ScalingTyped,
	ReadonlyUint8Array,
	ReadonlyUint16Array,
	ReadonlyUint32Array,
	ReadonlyInt8Array,
	ReadonlyInt16Array,
	ReadonlyInt32Array,
	ReadonlyFloat32Array,
	ReadonlyFloat64Array,
	ReadonlyUint8ClampedArray,
	FixedUint8Array,
	FixedUint16Array,
	FixedUint32Array,
	FixedInt8Array,
	FixedInt16Array,
	FixedInt32Array,
	FixedFloat32Array,
	FixedFloat64Array,
	FixedUint8ClampedArray,
	ScalingUint8Array,
	ScalingUint16Array,
	ScalingUint32Array,
	ScalingInt8Array,
	ScalingInt16Array,
	ScalingInt32Array,
	ScalingFloat32Array,
	ScalingFloat64Array,
	ScalingUint8ClampedArray,
} from './TypedArrayExt.js';
export { Uint64 } from './Uint64.js';
export { Urn } from './Uri.js';
export { utf } from './Utf.js';
export { WindowStr, type WindowOrString } from './WindowStr.js';
export { nameValue } from './nameValue.js';
export { BitReader } from './BitReader.js';
export { BitWriter } from './BitWriter.js';
//These are dupes of package.json-exports, and no one will want to import them this way
// but typedoc doesn't pick them up otherwise
/**
 * # Number
 * 
 * ## Small ranges
 *
 * - {@link primitive.number.Sexagesimal Sexagesimal} Range 0 - 59
 * - {@link primitive.number.Milli Milli} Range 0 - 999
 * - {@link primitive.number.Micro Micro} Range 0 - 999999
 * - {@link primitive.number.Nano Nano} Range 0 - 999999999
 * 
 * ## Signed integers
 * 
 * - {@link primitive.number.I64 | I64}, 
 * {@link primitive.number.I64Mut | I64Mut} Range -9223372036854775808 - 9223372036854775807
 * 
 * ## Unsigned integers
 * 
 * - {@link primitive.number.U16 U16} Range 0 - 65535
 * - {@link primitive.number.U32 | U32}, 
 * {@link primitive.number.U32Mut | U32Mut} Range 0 - 4294967295
 * - {@link primitive.number.U64 U64}, 
 * {@link primitive.number.U64Mut | U64Mut} Range 0 - 18446744073709551615
 * - {@link primitive.number.U128 | U128}, 
 * {@link primitive.number.U128Mut | U128Mut} Range 0 - 340282366920938463463374607431768211455
 * - {@link primitive.number.U256 | U256} Range 0 - 115792089237316195423570985008687907853269984665640564039457584007913129639935
 * - {@link primitive.number.U512 | U512} Range 0 - 13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031858186486050853753882811946569946433649006084095
 * 
 * ## Unsigned integer arrays
 * 
 * - {@link primitive.number.U32MutArray U32MutArray} Array of U32 elements
 * - {@link primitive.number.U64MutArray U64MutArray} Array of U64 elements
 */
export * as number from './number/index.js';
/**
 * # Net 
 * 
 * - {@link primitive.net.Cidr Cidr} Classless Inter-Domain Routing
 * - {@link primitive.net.IpV4 IpV4} 
 * - {@link primitive.net.IpTree IpTree}
 */
export * as net from './net/index.js';
//Interfaces: see src/interfaces/index.ts