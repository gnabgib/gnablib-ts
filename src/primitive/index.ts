/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

export * as xtBit from './xtBit.js'
export { intExt as xtInt } from './xtInt.js';
export * as xtString from './xtString.js';
export { uint8ArrayExt as xtUint8Array } from './xtUInt8Array.js';
export { BinResult, FromBinResult } from './FromBinResult.js';
export { Int64 } from './Int64.js';
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
 * - {@link primitive.number.Micro Micro} Range 0 - 999999
 * - {@link primitive.number.Milli Milli} Range 0 - 999
 * - {@link primitive.number.Nano Nano} Range 0 - 999999999
 * - {@link primitive.number.Sexagesimal Sexagesimal} Range 0 - 59
 * - {@link primitive.number.U16 U16} Range 0 - 65535
 * - {@link primitive.number.U32 U32}, {@link primitive.number.U32Mut U32Mut} Range 0 - 4294967295
 * - {@link primitive.number.U32MutArray U32MutArray} Array of U32 elements
 * - {@link primitive.number.U64 U64}, {@link primitive.number.U64Mut U64Mut} Range 0 - 18446744073709551615
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