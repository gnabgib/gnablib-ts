/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

export * as interfaces from './interfaces/index.js';

export { bitExt, Carrier } from './BitExt.js';
export { DateTime } from './DateTime.js';
export { Duration } from './Duration.js';
export * from './ErrorExt.js';
export { BinResult, FromBinResult } from './FromBinResult.js';
//export { Int64 } from './Int64_es2020.js';
export { Int64 } from './Int64.js';
export { intExt } from './IntExt.js';
export { Lazy } from './Lazy.js';
export { MatchSuccess, MatchFail } from './MatchResult.js';
//export * from './ReadonlyTypedArray_es2020.js';
export * from './ReadonlyTypedArray.js';
export { safety } from './Safety.js';
export { StringBuilder } from './StringBuilder.js';
export { stringExt } from './StringExt.js';
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
export { UInt, UIntMut } from './UInt.js';
export { uint8ArrayExt } from './UInt8ArrayExt.js';
//export { Uint64 } from './Uint64_es2020.js';
export { Uint64, type Uint64ish } from './Uint64.js';
export { Urn } from './Uri.js';
export { utf } from './Utf.js';
export { WindowStr, type WindowStrish } from './WindowStr.js';
export { nameValue } from './nameValue.js';
export { BitReader } from './BitReader.js';
export { BitWriter } from './BitWriter.js';
//These are dupes of package.json-exports, and no one will want to import them this way
// but typedoc doesn't pick them up otherwise
/**
 * # Error
 *
 * - {@link primitive.error.ContentError ContentError} Invalid content (eg for parsing or setting value)
 * - {@link primitive.error.LengthError LengthError} Invalid length (strings, arrays, etc)
 * - {@link primitive.error.InclusiveRangeError InclusiveRangeError} Value not in range
 */
export * as error from './error/index.js';
/**
 * # Date and time
 *
 * A series of classes to hold date and time information.  Partitioned from {@link primitive}
 * because some of these units can be redefined (with different range constraints)
 *
 * ## Date
 *
 * - {@link primitive.datetime.Year Year} Range -10000 - +22767
 * - {@link primitive.datetime.Month Month} Range 1 - 12
 * - {@link primitive.datetime.Day Day} Range 1 - 31
 *
 * ## Time
 *
 * - {@link primitive.datetime.Hour Hour} Range 0 -23
 * - {@link primitive.datetime.Minute Minute} Range 0 - 59
 * - {@link primitive.datetime.Second Second} Range 0 - 59 (no leap seconds)
 * - {@link primitive.datetime.Millisecond Millisecond} Range 0 - 999
 * - {@link primitive.datetime.Microsecond Microsecond} Range 0 - 999999
 * - {@link primitive.datetime.UtcOrNot UtcOrNot}
 */
export * as datetime from './datetime/index.js';
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