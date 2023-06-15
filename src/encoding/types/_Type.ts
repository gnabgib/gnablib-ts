/*! Copyright 2023 gnabgib MPL-2.0 */

/*
    Common: Null, Int, Utf8, Bool, DateTime, Float, 
    Ext: Bin, ?Decimal(Money)

    Primitive (in most lang): null, int(1,2,4,8), uint(1,2,4,8), float(4,8), boolean, Utf8/string

    type=[0][1][2][3] [4][567]
        - 567 are the modifier for most types (except null)
    

    [4=i][000]
      0=Var
      1=Byte
      2=2Byte
      3=4Byte
      4=8Byte
      5-7 ?
    [3=u][000]
      0=Var
      1=Byte
      2=2Byte
      3=4Byte
      4=8Byte
      5-7=?
    [2=f][000]
      0=4Byte
      1=8Byte


    Types are numbered for BYTE length (not bit), because this is an encoding format and most
    things are at least byte if not 4*, 8* aligned
 */
import { Int64 } from '../../primitive/Int64.js';
import { Uint64 } from '../../primitive/Uint64.js';
import { fpb16 } from '../ieee754-fpb.js';
import { fpb32 } from '../ieee754-fpb32.js';
import { fpb64 } from '../ieee754-fpb64.js';
import { utf8 } from '../Utf8.js';
import { DateTime } from '../../primitive/DateTime.js';
import { BinResult, FromBinResult } from '../../primitive/FromBinResult.js';
import type {
	/*ReadonlyBigInt64Array,*/ ReadonlyInt16Array,
	ReadonlyInt32Array,
	ReadonlyInt8Array,
} from '../../primitive/ReadonlyTypedArray.js';
import { safety } from '../../primitive/Safety.js';

export enum Type {
	Null, //0Bytes #LITERAL
	Zero, //0B 0 Integer(0) #LITERAL
	// Unsigned integers
	UInt_Var, //1-8B 0 - 72057594037927935 (2^56 - 1) 72 peta
	UInt_1, //1B 0 - 255 (2^8 - 1) aka Byte
	UInt_2, //2B 0 - 65535 (2^16 - 1) 65 kilo, 65 thousand
	UInt_4, //4B 0 - 4294967295 (2^32 - 1) 4 mega, 4 billion
	UInt_8, //8B 0 - 18446744073709551615 (2^64 - 1) 18 exa, 18 sextillion
	UInt_16, //16B 0 - 340282366920938463463374607431768211455 (2^128 - 1) 340 tera-yotta, 340 undecillion, useful for (G|U)UID
	// Integers (all can go 1 lower than range.. so -128 - 127 for 1byte)
	Int_Var, //1-8B, ±36028797018963967 (2^55 - 1)
	Int_1, //1B ±127 (2^7 - 1)
	Int_2, //2B ±32767 (2^15 - 1)
	Int_4, //4B ±2147483647 (2^31 - 1)
	Int_8, //8B ±9223372036854775807 (2^63 - 1)
	Int_16, //16B ±170141183460469231731687303715884105727 (2^127 - 1)
	//Booleans take no more storage than type
	True, //0B = Boolean(true) #LITERAL
	False, //0B = Boolean(false) #LITERAL
	//DateTime with microsecond accuracy
	DateTime, //8B -4713-01-01T00:00:00.000000 - 294276-12-31T23:59:60.999999 (note leap second support)
	//Utf8.. or string, but encoding can only be one type (NOTE ASCII is a subset of Utf8)
	Utf8_0, //0B A zero length string (note all utf8_* types support 0, this is the most compact) #LITERAL
	Utf8_1, //1B+NB, where first 1 byte is a UInt_1 (N is 0-255)
	Utf8_2, //2B+NB, where first 2 bytes are UInt_2 (N is 0-65535) 65 kilo
	Utf8_3, //3B+NB, where first 3 bytes are UInt_3 (N is 0-16777215) 16 mega
	Utf8_4, //4B+NB, where first 4 bytes are UInt_4 (N is 0-4294967295) 4 giga
	//Floats
	//Float_1, //There's no spec and it's hard to usably divide 7 bits into exponent and fraction
	Float_2, //2B ieee754 16bit floating point, aka binary16, safe integers ±2048 (2^11) - used in ML, graphics
	Float_4, //4B ieee754 32bit floating point, aka binary32, safe integers ±16777216 (2^24)
	Float_8, //8B ieee754 64bit floating point, aka binary64, safe integers ±9007199254740992 (2^53)
	Float_16, //16B ieee754 128bit floating point, aka binary128 - can represent any position in the visible universe with micrometer precision
	//Binary storage
	Bin_0, //0B Zero length binary (note all bin_* types support 0, this is the most compact) #LITERAL
	Bin_1, //1B+NB, where first 1 byte is a UInt_1 (N is 0-255 / 2^8-1)
	Bin_2, //2B+NB, where first 2 bytes are UInt_2 (N is 0-65535 / 2^16-1) 65k
	Bin_3, //3B+NB, where first 3 bytes are UInt_3 (N is 0-16777215 / 2^24-1) 16M
	Bin_4, //4B+NB, where first 4 bytes are UInt_4 (N is 0-4294967295 / 2^32-1) 4G
	//Decimals
	Decimal_4, //4B ieee754-2008 32bit decimal number ± 7dig x10 -95 +96
	Decimal_8, //8B ieee754-2008 64bit decimal number ± 16dig x10 -383 +384
	Decimal_16, //16B ieee754-2008 128bit decimal number ± 32dig x10 -6143 +6144
	//max=32

	//repeated
	//map<Type,Type>
	//struct
}

function encodeUint(value: Uint64): Uint8Array {
	if (value.equals(Uint64.zero)) return new Uint8Array([Type.Zero]);
	const min = value.toMinBytes();
	const ret = new Uint8Array(9);
	switch (min.length) {
		case 1:
			return new Uint8Array([Type.UInt_1, min[0]]);
		case 2:
			ret[0] = Type.UInt_2;
			ret.set(min, 1);
			return ret.slice(0, 3);
		case 4:
			ret[0] = Type.UInt_4;
			ret.set(min, 1);
			return ret.slice(0, 5);
		case 8:
			ret[0] = Type.UInt_8;
			ret.set(min, 1);
			return ret;
		default:
			ret[0] = Type.UInt_Var;
			ret.set(min, 1);
			return ret.slice(0, min.length + 1);
	}
}

function encodeInt(value: Int64): Uint8Array {
	if (value.equals(new Int64(0, 0))) return new Uint8Array([Type.Zero]);
	const min = value.toMinBytes();
	const ret = new Uint8Array(9);
	switch (min.length) {
		case 1:
			return new Uint8Array([Type.Int_1, min[0]]);
		case 2:
			ret[0] = Type.Int_2;
			ret.set(min, 1);
			return ret.slice(0, 3);
		case 4:
			ret[0] = Type.Int_4;
			ret.set(min, 1);
			return ret.slice(0, 5);
		case 8:
			ret[0] = Type.Int_8;
			ret.set(min, 1);
			return ret;
		default:
			ret[0] = Type.Int_Var;
			ret.set(min, 1);
			return ret.slice(0, min.length + 1);
	}
}

function encodeFp(value: number): Uint8Array {
	//Todo: FP2, FP4, FP16, FP32.. but how to detect?
	const fp = fpb64.toBytes(value);
	const ret = new Uint8Array(9);
	ret[0] = Type.Float_8;
	ret.set(fp, 1);
	return ret;
}

function encodeStr(value: string): Uint8Array {
	const b = utf8.toBytes(value);
	if (b.length === 0) {
		return new Uint8Array([Type.Utf8_0]);
	}
	if (b.length <= 0xff) {
		const ret = new Uint8Array(b.length + 2);
		ret[0] = Type.Utf8_1;
		ret[1] = b.length;
		ret.set(b, 2);
		return ret;
	}
	if (b.length <= 0xffff) {
		const ret = new Uint8Array(b.length + 3);
		ret[0] = Type.Utf8_2;
		ret[1] = b.length >> 8;
		ret[2] = b.length;
		ret.set(b, 3);
		return ret;
	}
	if (b.length <= 0xffffff) {
		const ret = new Uint8Array(b.length + 4);
		ret[0] = Type.Utf8_3;
		ret[1] = b.length >> 16;
		ret[2] = b.length >> 8;
		ret[3] = b.length;
		ret.set(b, 4);
		return ret;
	}
	const ret = new Uint8Array(b.length + 5);
	ret[0] = Type.Utf8_4;
	ret[1] = b.length >> 24;
	ret[2] = b.length >> 16;
	ret[3] = b.length >> 8;
	ret[4] = b.length;
	ret.set(b, 5);
	return ret;
}

function encodeBin(value: Uint8Array): Uint8Array {
	if (value.length === 0) {
		return new Uint8Array([Type.Bin_0]);
	}
	if (value.length <= 0xff) {
		const ret = new Uint8Array(value.length + 2);
		ret[0] = Type.Bin_1;
		ret[1] = value.length;
		ret.set(value, 2);
		return ret;
	}
	if (value.length <= 0xffff) {
		const ret = new Uint8Array(value.length + 3);
		ret[0] = Type.Bin_2;
		ret[1] = value.length >> 8;
		ret[2] = value.length;
		ret.set(value, 3);
		return ret;
	}
	if (value.length <= 0xffffff) {
		const ret = new Uint8Array(value.length + 4);
		ret[0] = Type.Bin_3;
		ret[1] = value.length >> 16;
		ret[2] = value.length >> 8;
		ret[3] = value.length;
		ret.set(value, 4);
		return ret;
	}
	const ret = new Uint8Array(value.length + 5);
	ret[0] = Type.Bin_4;
	ret[1] = value.length >> 24;
	ret[2] = value.length >> 16;
	ret[3] = value.length >> 8;
	ret[4] = value.length;
	ret.set(value, 5);
	return ret;
}

const minBuffLen = 4;
//JS constrains array buffer to MAX_SAFE_INTEGER
const maxBuffSize = Number.MAX_SAFE_INTEGER;

interface BufferInteractive {
	hasSpace(pos: number, byteSize: number): boolean;
}

// DataStream
//  construct: buffer (byteOffset) endianness
//  byteLength:number
//  _realloc
// These attach TypedArrays to the ArrayBuffer (but that has mutation issues)
//  map(Int|Uint)(32|16)Array(len,endian):TypedArray
//  map(Int|Uint)8Array(len):(Int|Uint)8Array
//  mapFloat(64|31)Array(len,endian):Float(64|32)Array
// These copy internal data into a new TypedArray
//  read(Int|Uint)(32,16)Array(len,endian): TypedArray
//  read(Int|Uint)8Array(len): (Int|Uint)8Array
//  readFloat(64|32)Array(len,endian): Float(64|32)Array
// These copy TypedArray data into the internal store
//  write(Int|Uint)(32|16)Array(arr,endian)
//  write(Int|Uint)8Array(arr)
//  writeFloat(64|32)Array(arr,endian)
// Read a single element of type
//  read(Int|Uint)(32|16)(endian)
//  read(Int|Uint)8()
//  readFloat(32|64)(endian)
// Write a single element of type
//  write(Int|Uint)(32|16)(value,endian)
//  write(Int|Uint)8(value)
//  writeFloat(32|64)(value,endian)
// IGNORE:
//  !_trimAlloc
//  !seek(pos)
//  !isEof:boolean
//  !save(filename)
//  !dynamicSize:boolean
//  !buffer:ArrayBuffer
//  !byteOffset:number
//  !dataView:DataView
// String, Struct, Type (more of a Ser thing)

// ISO/IEC 2382-1:1993 defines a byte as 2^8 bits, unsigned 0-255

const size8 = 1;
const size16 = 2;
const size32 = 4;
const size64 = 8;

class ArrayBufferWindowReader {
	private readonly _view: DataView;
	private readonly _isLittleEndian: boolean;
	private _pos = 0;

	public constructor(view: DataView, isLittleEndian: boolean) {
		this._view = view;
		this._isLittleEndian = isLittleEndian;
	}

	get position(): number {
		return this._pos;
	}
	private get space(): number {
		return this._view.byteLength - this._pos;
	}

	//Read-one
	readInt1(): number {
		// DataView.get* will throw a RangeError if there's not enough space
		const ret = this._view.getInt8(this._pos);
		this._pos += 1;
		return ret;
	}
	readInt2(): number {
		// DataView.get* will throw a RangeError if there's not enough space
		const ret = this._view.getInt16(this._pos, this._isLittleEndian);
		this._pos += 2;
		return ret;
	}
	readInt4(): number {
		// DataView.get* will throw a RangeError if there's not enough space
		const ret = this._view.getInt32(this._pos, this._isLittleEndian);
		this._pos += 4;
		return ret;
	}
	// readInt8():Int64 {
	//     // DataView.get* will throw a RangeError if there's not enough space
	//     const bi=this._view.getBigInt64(this._pos,this._isLittleEndian);
	//     this._pos+=8;
	//     return Int64.fromBigInt(bi);
	// }
	readUint1(): number {
		// DataView.get* will throw a RangeError if there's not enough space
		const ret = this._view.getUint8(this._pos);
		this._pos += 1;
		return ret;
	}
	readUint2(): number {
		// DataView.get* will throw a RangeError if there's not enough space
		const ret = this._view.getUint16(this._pos, this._isLittleEndian);
		this._pos += 2;
		return ret;
	}
	readUint4(): number {
		// DataView.get* will throw a RangeError if there's not enough space
		const ret = this._view.getUint32(this._pos, this._isLittleEndian);
		this._pos += 4;
		return ret;
	}
	// readUint8():Uint64 {
	//     // DataView.get* will throw a RangeError if there's not enough space
	//     const bi=this._view.getBigUint64(this._pos,this._isLittleEndian);
	//     this._pos+=8;
	//     return Uint64.fromBigInt(bi);
	// }
	readFloat4(): number {
		const ret = this._view.getFloat32(this._pos, this._isLittleEndian);
		this._pos += 4;
		return ret;
	}
	readFloat8(): number {
		const ret = this._view.getFloat64(this._pos, this._isLittleEndian);
		this._pos += 8;
		return ret;
	}

	//Read-many
	readInt1Array(count: number): ReadonlyInt8Array {
		const sizeBytes = count * 1;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to read, have ${this._view.byteLength}`
			);
		const start = this._view.byteLength + this._pos;
		//It's okay to share the buffer because we're using the Readonly<Typed> modifier
		return new Int8Array(this._view.buffer, start, start + sizeBytes);
	}
	readInt2Array(count: number): ReadonlyInt16Array {
		const sizeBytes = count * 2;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to read, have ${this._view.byteLength}`
			);
		const start = this._view.byteLength + this._pos;
		//It's okay to share the buffer because we're using the Readonly<Typed> modifier
		return new Int16Array(this._view.buffer, start, start + sizeBytes);
	}
	readInt4Array(count: number): ReadonlyInt32Array {
		const sizeBytes = count * 4;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to read, have ${this._view.byteLength}`
			);
		const start = this._view.byteLength + this._pos;
		//It's okay to share the buffer because we're using the Readonly<Typed> modifier
		return new Int32Array(this._view.buffer, start, start + sizeBytes);
	}
	// readInt8Array(count:number):ReadonlyBigInt64Array {
	//     const sizeBytes=count*4;
	//     if (this._pos+sizeBytes>this._view.byteLength) throw new RangeError(`Need ${sizeBytes} to read, have ${this._view.byteLength}`);
	//     const start=this._view.byteLength+this._pos;
	//     //It's okay to share the buffer because we're using the Readonly<Typed> modifier
	//     return new BigInt64Array(this._view.buffer,start,start+sizeBytes);
	// }
}

/**
 * A view into an existing array buffer (like TypedArray.subarray, Spans in C#, Slices in Golang)
 * This *uses the same memory*
 */
class ArrayBufferWindow {
	private readonly _buffer: ArrayBuffer;
	private readonly _startInc: number;
	//Note we use an exclusive range-end for fast length calcs, this means you should always < the end, not <=
	private readonly _endExc: number;
	private readonly _view: DataView;

	public constructor(
		buffer: ArrayBufferWindow | ArrayBuffer,
		start = 0,
		end = -1
	) {
		safety.intInRangeInc(start, 0, buffer.byteLength - 1, 'start');
		if (end === -1) {
			end = buffer.byteLength;
		} else {
			//Note when end===start (allowed) the window has 0 length
			safety.intInRangeInc(end, start, buffer.byteLength, 'end');
		}
		if (buffer instanceof ArrayBufferWindow) {
			this._buffer = buffer._buffer;
			this._startInc = start + buffer._startInc;
			this._endExc = end + buffer._endExc;
		} else {
			//ArrayBuffer
			this._buffer = buffer;
			this._startInc = start;
			this._endExc = end;
		}
		this._view = new DataView(
			this._buffer,
			this._startInc,
			this._endExc - this._startInc
		);
	}

	get byteLength(): number {
		return this._endExc - this._startInc;
	}

	getReader(isLittleEndian: boolean): ArrayBufferWindowReader {
		return new ArrayBufferWindowReader(this._view, isLittleEndian);
	}

	// /**
	//  * !DANGER this data view allows mutation of the internal buffer content
	//  * @returns
	//  */
	// newDataView():DataView {
	//     return new DataView(this._buffer,this._startInc,this._endExc-this._startInc);
	// }

	subWindow(start: number, end: number): ArrayBufferWindow {
		return new ArrayBufferWindow(this, start, end);
	}

	static ofCapacity(capacity: number): ArrayBufferWindow {
		return new ArrayBufferWindow(new ArrayBuffer(capacity));
	}
}

// class ScalingBuffer implements BufferInteractive {
//     private _buffer:ArrayBufferWindow;
//     private readonly _isLittleEndian:boolean;
//     private _reader:Lazy<ArrayBufferWindowReader>;
//     private _pos=0;

//     /**
//      *
//      * @param bufferOrCapacity
//      * @param isLittleEndian Note endianness is fixed for the whole buffer
//      */
//     public constructor(bufferOrCapacity:ArrayBufferWindow,isLittleEndian=true) {
//         this._buffer=bufferOrCapacity;
//         this._isLittleEndian=isLittleEndian;
// 		this._reader=new Lazy<ArrayBufferWindowReader>(()=>this._buffer.getReader(this._isLittleEndian));
//     }

//     /**
//      * Capacity of the buffer (in bytes, always >= @see position)
//      */
//     get capacity():number {
//         //Perhaps confusingly the buffer length is the capacity, while our internal position covers
//         // the externally visible length (which changes with writes)
//         return this._buffer.byteLength;
//     }

//     /**
//      * Size of the buffer (in bytes)
//      */
//     get position():number {
//         return this._pos;
//     }

//     private get space():number {
//         return this._buffer.byteLength-this._pos;
//     }

//     get spaceFor8Bits():boolean {
//         return this._pos+size8 <= this._buffer.byteLength;
//     }

//     get spaceFor16Bits():boolean {
//         return this._pos+size16 <= this._buffer.byteLength;
//     }

//     get spaceFor32Bits():boolean {
//         return this._pos+size32 <= this._buffer.byteLength;
//     }

//     get spaceFor64Bits():boolean {
//         return this._pos+size64 <= this._buffer.byteLength;
//     }

//     /**
//      * Whether there's space internally for the given number of bytes
//      * NOTE: This will resize the buffer if it needs to accommodate the length
//      * @param pos Starting position in the byte array
//      * @param byteLen Number of bytes of space needed
//      * @returns
//      */
//     hasSpace(pos:number,byteLen:number):boolean {
//         const len=pos+byteLen;
//         if (len>this._buffer.byteLength) this.grow(len);
//         //This may seem redundant (always true after resize) BUT there's a small edge case
//         // where the needed size is greater than a buffer can so we cannot hold the data
//         return this._buffer.byteLength>=len;
//     }

//     /**
//      * Increase the size of the buffer to at least allow @see size space, this either
//      * doubles existing size (if that's enough), or grows to @see size size if that's
//      * larger (saves double/triple/* copies when @see size is large)
//      * @param size
//      */
//     private grow(size=0) {
//         //Note newSize could be >maxBuffSize, let's rely on JS to throw one newBuff construct
//         let newSize=this._buffer.byteLength===0?minBuffLen:2*this._buffer.byteLength;
//         if (newSize<size) newSize=size;

//         //Performance tests show uint8array.set is slower than a for loop with [] byte access.. which is really
//         // hard to believe (even with JS<->C++ interop, surely this could use memcpy).
//         // DataView has been boosted to close to TypedArray performance, so let's avoid
//         // extra Uint8Array objects on old/new and use the dataview (we need anyway) for the copy
//         const newBuff=new ArrayBuffer(newSize);
//         const newView=new DataView(newBuff);
//         const reader=this._reader.value;
//         for(let i=0;i<this._buffer.byteLength;i++) {
//             newView.setUint8(i,reader.readUint1(i));
//         }
//         this._buffer=newBuff;
//         this._view=newView;
//     }

// }
// class FixedBuffer implements BufferInteractive {
//     private readonly _buffer:ArrayBuffer;

//     public constructor(buffer?:ArrayBuffer,byteLen=0) {
//         if (buffer) {
//             this._buffer=buffer;
//         } else {
//             inRangeInclusive(byteLen,0,maxBuffSize);
//             this._buffer=new ArrayBuffer(byteLen);
//         }
//     }

//     hasSpace(pos:number,byteSize:number):boolean {
//         return this._buffer.byteLength<=(pos+byteSize);
//     }

//     /**
//      * Build from an existing buffer
//      * @param buffer
//      */
//      static From(buffer:ArrayBuffer):FixedBuffer {
//         return new ScalingBuffer(buffer,0);
//     }

//     /**
//      * Build to the requested size
//      * @param byteLen 1 < MAX_SAFE_INTEGER, if 0 then default size(4) will be used
//      * @throws {@link RangeError} if byteLen<0 > MAX_SAFE_INTEGER
//      */
//     static newLen(byteLen:number):FixedBuffer {
//         if (byteLen<0)
//         return new ScalingBuffer(undefined,byteLen);
//     }
// }

// /**
//  * Extension to UInt8Array and DataView too allow endian-aware writing
//  * of a variety of types AND auto scaling of the underlying storage in the event
//  * the caller doesn't know the size
//  */
// export class ByteStream {
//     //private readonly _buffer:BufferInteractive;
//     private _pos=0;

//     get pos():number {
//         return this._pos;
//     }
// }

export function encode(value: unknown): Uint8Array {
	switch (typeof value) {
		case 'undefined':
			return new Uint8Array([Type.Null]);
		case 'number':
			if (Number.isInteger(value)) return encodeInt(Int64.fromNumber(value));
			return encodeFp(value);
		case 'bigint':
			return encodeInt(Int64.fromBigInt(value));
		case 'boolean':
			return new Uint8Array([value ? Type.True : Type.False]);
		case 'string':
			return encodeStr(value);
		case 'object':
			//The only other type we accept
			break;
		default:
			//symbol, function
			throw new TypeError(`Cannot encoded ${typeof value}`);
	}
	if (value instanceof Uint64) {
		return encodeUint(value);
	}
	if (value instanceof Int64) {
		return encodeInt(value);
	}
	if (value instanceof DateTime) {
		const d = value.toBin();
		const ret = new Uint8Array(d.length + 1);
		ret[0] = Type.DateTime;
		ret.set(d, 1);
		return ret;
	}
	if (value instanceof Uint8Array) {
		return encodeBin(value);
	}
	if (value === null) {
		return new Uint8Array([Type.Null]);
	}
	throw new TypeError(`Cannot encode ${value}`);
}

function eat1LenByte(bin: Uint8Array, pos: number): number | string {
	if (pos + 1 > bin.length) return 'decode unable to find length';

	const l = bin[pos++];
	if (pos + l > bin.length) return 'decode missing data';

	return l;
}
function eat2LenByte(bin: Uint8Array, pos: number): number | string {
	if (pos + 2 > bin.length) return 'decode unable to find length';

	const l = (bin[pos++] << 8) | bin[pos++];
	if (pos + l > bin.length) return 'decode missing data';

	return l;
}
function eat3LenByte(bin: Uint8Array, pos: number): number | string {
	if (pos + 3 > bin.length) return 'decode unable to find length';

	const l = (bin[pos++] << 16) | (bin[pos++] << 8) | bin[pos++];
	if (pos + l > bin.length) return 'decode missing data';

	return l;
}
function eat4LenByte(bin: Uint8Array, pos: number): number | string {
	if (pos + 4 > bin.length) return 'decode unable to find length';

	const l =
		(bin[pos++] << 24) | (bin[pos++] << 16) | (bin[pos++] << 8) | bin[pos++];
	if (pos + l > bin.length) return 'decode missing data';

	return l;
}
export function decode(bin: Uint8Array, pos: number): BinResult | string {
	let ptr = pos;
	if (pos >= bin.length) return 'decode unable to fine type';
	const type = bin[ptr++];
	let len: number | string;
	let need: string | undefined;
	let dFrom: FromBinResult<DateTime>;
	switch (type) {
		// UInt_Var, //1-8B 0 - 72057594037927935 (2^56 - 1) 72 peta
		// UInt_1, //1B 0 - 255 (2^8 - 1) aka Byte
		// UInt_2, //2B 0 - 65535 (2^16 - 1) 65 kilo
		// UInt_4, //4B 0 - 4294967295 (2^32 - 1) 4 mega
		// UInt_8, //8B 0 - 18446744073709551615 (2^64 - 1) 18 exa
		// // Integers
		// Int_Var, //1-8B, -36028797018963968 - 36028797018963967 (2^55 - 1)
		// Int_1, //1B -128 - 127 (2^7 - 1)
		// Int_2, //2B -32768 - 32767 (2^15 - 1)
		// Int_4, //4B -2147483648 - 2147483647 (2^31 - 1)
		// Int_8, //8B -9223372036854775808 - 9223372036854775807 (2^63 - 1)

		case Type.Null:
			return new BinResult(1, undefined);
		case Type.Zero:
			return new BinResult(1, 0);
		case Type.UInt_Var:
			// UInt_1, //1B 0 - 255 (2^8 - 1) aka Byte
			// UInt_2, //2B 0 - 65535 (2^16 - 1) 65 kilo
			// UInt_4, //4B 0 - 4294967295 (2^32 - 1) 4 mega
			// UInt_8, //8B 0 - 18446744073709551615 (2^64 - 1) 18 exa
			return 'Not implemented';
		case Type.Int_Var:
			try {
				Int64.fromMinBytes(bin, pos);
			} catch (e) {
				//Todo: this isn't enough
				console.log('Oh dear');
			}

			if (pos + 1 > bin.length) return 'decode missing data';
			return new BinResult(1 + 1, Int64.fromMinBytes(bin, pos, 1));
		case Type.Int_1:
			if (pos + 1 > bin.length) return 'decode missing data';
			return new BinResult(1 + 1, Int64.fromMinBytes(bin, pos, 1));
		case Type.Int_2:
			if (pos + 2 > bin.length) return 'decode missing data';
			return new BinResult(1 + 2, Int64.fromMinBytes(bin, pos, 2));
		case Type.Int_4:
			if (pos + 4 > bin.length) return 'decode missing data';
			return new BinResult(1 + 4, Int64.fromMinBytes(bin, pos, 4));
		case Type.Int_8:
			if (pos + 8 > bin.length) return 'decode missing data';
			return new BinResult(1 + 8, Int64.fromMinBytes(bin, pos, 8));
		case Type.True:
			return new BinResult(1, true);
		case Type.False:
			return new BinResult(1, false);
		case Type.DateTime:
			if (pos + 8 > bin.length) return 'decode missing data';
			dFrom = DateTime.fromBin(bin, pos);
			if (!dFrom.success) return 'decode failed DateTime ' + dFrom.reason;
			return new BinResult(1 + 8, dFrom.value);
		case Type.Utf8_0:
			return new BinResult(1, '');
		case Type.Utf8_1:
			len = eat1LenByte(bin, pos);
			if (typeof len === 'string') return len;
			pos += 1;
			if (pos + len > bin.length) return 'decode missing data';
			return new BinResult(
				1 + 1 + len,
				utf8.fromBytes(bin.slice(pos, pos + len))
			);
		case Type.Utf8_2:
			len = eat2LenByte(bin, pos);
			if (typeof len === 'string') return len;
			pos += 2;
			if (pos + len > bin.length) return 'decode missing data';
			return new BinResult(
				1 + 2 + len,
				utf8.fromBytes(bin.slice(pos, pos + len))
			);
		case Type.Utf8_3:
			len = eat3LenByte(bin, pos);
			if (typeof len === 'string') return len;
			pos += 3;
			if (pos + len > bin.length) return 'decode missing data';
			return new BinResult(
				1 + 3 + len,
				utf8.fromBytes(bin.slice(pos, pos + len))
			);
		case Type.Utf8_4:
			len = eat4LenByte(bin, pos);
			if (typeof len === 'string') return len;
			pos += 4;
			if (pos + len > bin.length) return 'decode missing data';
			return new BinResult(
				1 + 4 + len,
				utf8.fromBytes(bin.slice(pos, pos + len))
			);
		case Type.Float_2:
			if (pos + 2 > bin.length) return 'decode missing data';
			return new BinResult(1 + 2, fpb16.fromBytes(bin, pos));
		case Type.Float_4:
			if (pos + 4 > bin.length) return 'decode missing data';
			return new BinResult(1 + 4, fpb32.fromBytes(bin, pos));
		case Type.Float_8:
			if (pos + 8 > bin.length) return 'decode missing data';
			return new BinResult(1 + 8, fpb64.fromBytes(bin, pos));
		//case Type.Float_16:
		//case Type.Float_32:
		case Type.Bin_0:
			return new BinResult(1, new Uint8Array(0));
		case Type.Bin_1:
			len = eat1LenByte(bin, pos);
			if (typeof len === 'string') return len;
			pos += 1;
			if (pos + len > bin.length) return 'decode missing data';
			return new BinResult(1 + 1 + len, bin.slice(pos, pos + len));
		case Type.Bin_2:
			len = eat2LenByte(bin, pos);
			if (typeof len === 'string') return len;
			pos += 2;
			if (pos + len > bin.length) return 'decode missing data';
			return new BinResult(1 + 2 + len, bin.slice(pos, pos + len));
		case Type.Bin_3:
			len = eat3LenByte(bin, pos);
			if (typeof len === 'string') return len;
			pos += 3;
			if (pos + len > bin.length) return 'decode missing data';
			return new BinResult(1 + 3 + len, bin.slice(pos, pos + len));
		case Type.Bin_4:
			len = eat4LenByte(bin, pos);
			if (typeof len === 'string') return len;
			pos += 4;
			if (pos + len > bin.length) return 'decode missing data';
			return new BinResult(1 + 4 + len, bin.slice(pos, pos + len));

		//case Type.Decimal_4:
		//case Type.Decimal_8:
		//case Type.Decimal_16:
	}
	return 'Not implemented';
}
/*
LITERALS:
Null
Zero
True
False
Utf8_0
Bin_0
 */
