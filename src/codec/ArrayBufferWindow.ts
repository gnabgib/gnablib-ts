/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import type { Int64 } from '../primitive/Int64.js';
import type { Uint64 } from '../primitive/Uint64.js';
import type {
	// ReadonlyBigInt64Array,
	// ReadonlyBigUint64Array,
	ReadonlyFloat32Array,
	ReadonlyFloat64Array,
	ReadonlyInt16Array,
	ReadonlyInt32Array,
	ReadonlyInt8Array,
	ReadonlyUint16Array,
	ReadonlyUint32Array,
	ReadonlyUint8Array,
} from '../primitive/ReadonlyTypedArray.js';
import { isLE } from '../endian/platform.js';
import { safety } from '../primitive/Safety.js';

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

	/**
	 * How much space is in the writer (cap-pos)
	 */
	get space(): number {
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
	// readInt8(): Int64 {
	// 	// DataView.get* will throw a RangeError if there's not enough space
	// 	const bi = this._view.getBigInt64(this._pos, this._isLittleEndian);
	// 	this._pos += 8;
	// 	return Int64.fromBigInt(bi);
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
	// readUint8(): Uint64 {
	// 	// DataView.get* will throw a RangeError if there's not enough space
	// 	const bi = this._view.getBigUint64(this._pos, this._isLittleEndian);
	// 	this._pos += 8;
	// 	return Uint64.fromBigInt(bi);
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
		//We can share the buffer and build with offset,length here (no alignment requirement).. but all
		// the other forms copy the data so let's be consistent
		const start = this._pos + this._view.byteOffset;
		const ret = new Int8Array(
			this._view.buffer.slice(start, start + sizeBytes)
		);
		this._pos += sizeBytes;
		return ret;
	}
	readInt2Array(count: number): ReadonlyInt16Array {
		const sizeBytes = count * 2;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to read, have ${this._view.byteLength}`
			);

		//!Byte alignment issue - if start isn't a multiple of byteSize(2) we cannot build
		//!Endian issue - if platform is different from preferred, viewing straight into the data is bad (mkay)
		let ret: Int16Array;
		if (this._isLittleEndian === isLE) {
			const start = this._pos + this._view.byteOffset;
			ret = new Int16Array(this._view.buffer.slice(start, start + sizeBytes));
			this._pos += sizeBytes;
		} else {
			ret = new Int16Array(count);
			for (let i = 0; i < count; i++) {
				ret[i] = this._view.getInt16(this._pos, this._isLittleEndian);
				this._pos += 2;
			}
		}
		return ret;
	}
	readInt4Array(count: number): ReadonlyInt32Array {
		const sizeBytes = count * 4;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to read, have ${this._view.byteLength}`
			);

		//!Byte alignment issue - if start isn't a multiple of byteSize(2) we cannot build
		//!Endian issue - if platform is different from preferred, viewing straight into the data is bad (mkay)
		let ret: Int32Array;
		if (this._isLittleEndian === isLE) {
			const start = this._pos + this._view.byteOffset;
			ret = new Int32Array(this._view.buffer.slice(start, start + sizeBytes));
			this._pos += sizeBytes;
		} else {
			ret = new Int32Array(count);
			for (let i = 0; i < count; i++) {
				ret[i] = this._view.getInt32(this._pos, this._isLittleEndian);
				this._pos += 4;
			}
		}
		return ret;
	}
	// readInt8Array(count: number): ReadonlyBigInt64Array {
	// 	const sizeBytes = count * 8;
	// 	if (this._pos + sizeBytes > this._view.byteLength)
	// 		throw new RangeError(`Need ${sizeBytes} to read, have ${this._view.byteLength}`);

	// 	//!Byte alignment issue - if start isn't a multiple of byteSize(2) we cannot build
	// 	//!Endian issue - if platform is different from preferred, viewing straight into the data is bad (mkay)
	// 	let ret: BigInt64Array;
	// 	if (this._isLittleEndian === platformIsLE) {
	// 		const start = this._pos + this._view.byteOffset;
	// 		ret = new BigInt64Array(this._view.buffer.slice(start, start + sizeBytes));
	// 		this._pos += sizeBytes;
	// 	} else {
	// 		ret = new BigInt64Array(count);
	// 		for (let i = 0; i < count; i++) {
	// 			ret[i] = this._view.getBigInt64(this._pos, this._isLittleEndian);
	// 			this._pos += 8;
	// 		}
	// 	}
	// 	return ret;
	// }
	readUint1Array(count: number): ReadonlyUint8Array {
		const sizeBytes = count * 1;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to read, have ${this._view.byteLength}`
			);
		//We can share the buffer and build with offset,length here (no alignment requirement).. but all
		// the other forms copy the data so let's be consistent
		const start = this._pos + this._view.byteOffset;
		const ret = new Uint8Array(
			this._view.buffer.slice(start, start + sizeBytes)
		);
		this._pos += sizeBytes;
		return ret;
	}
	readUint2Array(count: number): ReadonlyUint16Array {
		const sizeBytes = count * 2;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to read, have ${this._view.byteLength}`
			);

		//!Byte alignment issue - if start isn't a multiple of byteSize(2) we cannot build
		//!Endian issue - if platform is different from preferred, viewing straight into the data is bad (mkay)
		let ret: Uint16Array;
		if (this._isLittleEndian === isLE) {
			const start = this._pos + this._view.byteOffset;
			ret = new Uint16Array(this._view.buffer.slice(start, start + sizeBytes));
			this._pos += sizeBytes;
		} else {
			ret = new Uint16Array(count);
			for (let i = 0; i < count; i++) {
				ret[i] = this._view.getUint16(this._pos, this._isLittleEndian);
				this._pos += 2;
			}
		}
		return ret;
	}
	readUint4Array(count: number): ReadonlyUint32Array {
		const sizeBytes = count * 4;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to read, have ${this._view.byteLength}`
			);

		//!Byte alignment issue - if start isn't a multiple of byteSize(2) we cannot build
		//!Endian issue - if platform is different from preferred, viewing straight into the data is bad (mkay)
		let ret: Uint32Array;
		if (this._isLittleEndian === isLE) {
			const start = this._pos + this._view.byteOffset;
			ret = new Uint32Array(this._view.buffer.slice(start, start + sizeBytes));
			this._pos += sizeBytes;
		} else {
			ret = new Uint32Array(count);
			for (let i = 0; i < count; i++) {
				ret[i] = this._view.getUint32(this._pos, this._isLittleEndian);
				this._pos += 4;
			}
		}
		return ret;
	}
	// readUint8Array(count: number): ReadonlyBigUint64Array {
	// 	const sizeBytes = count * 8;
	// 	if (this._pos + sizeBytes > this._view.byteLength)
	// 		throw new RangeError(`Need ${sizeBytes} to read, have ${this._view.byteLength}`);

	// 	//!Byte alignment issue - if start isn't a multiple of byteSize(2) we cannot build
	// 	//!Endian issue - if platform is different from preferred, viewing straight into the data is bad (mkay)
	// 	let ret: BigUint64Array;
	// 	if (this._isLittleEndian === platformIsLE) {
	// 		const start = this._pos + this._view.byteOffset;
	// 		ret = new BigUint64Array(this._view.buffer.slice(start, start + sizeBytes));
	// 		this._pos += sizeBytes;
	// 	} else {
	// 		ret = new BigUint64Array(count);
	// 		for (let i = 0; i < count; i++) {
	// 			ret[i] = this._view.getBigUint64(this._pos, this._isLittleEndian);
	// 			this._pos += 8;
	// 		}
	// 	}
	// 	return ret;
	// }
	readFloat4Array(count: number): ReadonlyFloat32Array {
		const sizeBytes = count * 4;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to read, have ${this._view.byteLength}`
			);

		//!Byte alignment issue - if start isn't a multiple of byteSize(2) we cannot build
		//!Endian issue - if platform is different from preferred, viewing straight into the data is bad (mkay)
		let ret: Float32Array;
		if (this._isLittleEndian === isLE) {
			const start = this._pos + this._view.byteOffset;
			ret = new Float32Array(this._view.buffer.slice(start, start + sizeBytes));
			this._pos += sizeBytes;
		} else {
			ret = new Float32Array(count);
			for (let i = 0; i < count; i++) {
				ret[i] = this._view.getFloat32(this._pos, this._isLittleEndian);
				this._pos += 4;
			}
		}
		return ret;
	}
	readFloat8Array(count: number): ReadonlyFloat64Array {
		const sizeBytes = count * 8;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to read, have ${this._view.byteLength}`
			);

		//!Byte alignment issue - if start isn't a multiple of byteSize(2) we cannot build
		//!Endian issue - if platform is different from preferred, viewing straight into the data is bad (mkay)
		let ret: Float64Array;
		if (this._isLittleEndian === isLE) {
			const start = this._pos + this._view.byteOffset;
			ret = new Float64Array(this._view.buffer.slice(start, start + sizeBytes));
			this._pos += sizeBytes;
		} else {
			ret = new Float64Array(count);
			for (let i = 0; i < count; i++) {
				ret[i] = this._view.getFloat64(this._pos, this._isLittleEndian);
				this._pos += 8;
			}
		}
		return ret;

		// const start = this._view.byteOffset + this._pos;
		// //It's okay to share the buffer because we're using the Readonly<Typed> modifier
		// const ret = new Float64Array(this._view.buffer, start, count);
		// this._pos += sizeBytes;
		// return ret;
	}
}

class ArrayBufferWindowWriter {
	protected readonly _view: DataView;
	protected readonly _isLittleEndian: boolean;
	protected _pos = 0;

	public constructor(view: DataView, isLittleEndian: boolean) {
		this._view = view;
		this._isLittleEndian = isLittleEndian;
	}

	get position(): number {
		return this._pos;
	}

	/**
	 * How much space is in the writer (cap-pos) in bytes
	 */
	get space(): number {
		return this._view.byteLength - this._pos;
	}

	//Write-one
	writeInt1(value: number) {
		// DataView.set* will throw a RangeError if there's not enough space
		this._view.setInt8(this._pos, value);
		this._pos += 1;
	}
	writeInt2(value: number) {
		// DataView.set* will throw a RangeError if there's not enough space
		this._view.setInt16(this._pos, value, this._isLittleEndian);
		this._pos += 2;
	}
	writeInt4(value: number) {
		// DataView.set* will throw a RangeError if there's not enough space
		this._view.setInt32(this._pos, value, this._isLittleEndian);
		this._pos += 4;
	}
	writeInt8(value: Int64) {
		// DataView.set* will throw a RangeError if there's not enough space
		this._view.setUint32(this._pos, value.highU32, this._isLittleEndian);
		this._view.setUint32(this._pos + 4, value.lowU32, this._isLittleEndian);
		//this._view.setBigInt64(this._pos, value.toBigInt(), this._isLittleEndian);
		this._pos += 8;
	}
	writeUint1(value: number) {
		// DataView.set* will throw a RangeError if there's not enough space
		this._view.setUint8(this._pos, value);
		this._pos += 1;
	}
	writeUint2(value: number) {
		// DataView.set* will throw a RangeError if there's not enough space
		this._view.setUint16(this._pos, value, this._isLittleEndian);
		this._pos += 2;
	}
	writeUint4(value: number) {
		// DataView.set* will throw a RangeError if there's not enough space
		this._view.setUint32(this._pos, value, this._isLittleEndian);
		this._pos += 4;
	}
	writeUint8(value: Uint64) {
		// DataView.set* will throw a RangeError if there's not enough space
		this._view.setUint32(this._pos, value.highU32, this._isLittleEndian);
		this._view.setUint32(this._pos + 4, value.lowU32, this._isLittleEndian);
		//this._view.setBigUint64(this._pos, value.toBigInt(), this._isLittleEndian);
		this._pos += 8;
	}
	writeFloat4(value: number) {
		// DataView.set* will throw a RangeError if there's not enough space
		this._view.setFloat32(this._pos, value, this._isLittleEndian);
		this._pos += 4;
	}
	writeFloat8(value: number) {
		// DataView.set* will throw a RangeError if there's not enough space
		this._view.setFloat64(this._pos, value, this._isLittleEndian);
		this._pos += 8;
	}

	//Write-many
	writeInt1Array(value: ReadonlyInt8Array) {
		const sizeBytes = value.byteLength;
		//Does this maybe need byteOffset?
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to write, have ${this._view.byteLength}`
			);
		let pos = this._pos;
		for (let i = 0; i < value.length; i++) {
			this._view.setInt8(pos, value[i]);
			pos += 1;
		}
		this._pos += sizeBytes;
	}
	writeInt2Array(value: ReadonlyInt16Array) {
		const sizeBytes = value.byteLength;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to write, have ${this._view.byteLength}`
			);
		let pos = this._pos;
		for (let i = 0; i < value.length; i++) {
			this._view.setInt16(pos, value[i], this._isLittleEndian);
			pos += 2;
		}
		this._pos += sizeBytes;
	}
	writeInt4Array(value: ReadonlyInt32Array) {
		const sizeBytes = value.byteLength;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to write, have ${this._view.byteLength}`
			);
		let pos = this._pos;
		for (let i = 0; i < value.length; i++) {
			this._view.setInt32(pos, value[i], this._isLittleEndian);
			pos += 4;
		}
		this._pos += sizeBytes;
	}
	// writeInt8Array(value: ReadonlyBigInt64Array) {
	// 	const sizeBytes = value.byteLength;
	// 	if (this._pos + sizeBytes > this._view.byteLength)
	// 		throw new RangeError(`Need ${sizeBytes} to write, have ${this._view.byteLength}`);
	// 	let pos = this._pos;
	// 	for (let i = 0; i < value.length; i++) {
	// 		this._view.setBigInt64(pos, value[i], this._isLittleEndian);
	// 		pos += 8;
	// 	}
	// 	this._pos += sizeBytes;
	// }
	writeUint1Array(value: ReadonlyUint8Array) {
		const sizeBytes = value.byteLength;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to write, have ${this._view.byteLength}`
			);
		let pos = this._pos;
		for (let i = 0; i < value.length; i++) {
			this._view.setUint8(pos, value[i]);
			pos += 1;
		}
		this._pos += sizeBytes;
	}
	writeUint2Array(value: ReadonlyUint16Array) {
		const sizeBytes = value.byteLength;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to write, have ${this._view.byteLength}`
			);
		let pos = this._pos;
		for (let i = 0; i < value.length; i++) {
			this._view.setUint16(pos, value[i], this._isLittleEndian);
			pos += 2;
		}
		this._pos += sizeBytes;
	}
	writeUint4Array(value: ReadonlyUint32Array) {
		const sizeBytes = value.byteLength;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to write, have ${this._view.byteLength}`
			);
		let pos = this._pos;
		for (let i = 0; i < value.length; i++) {
			this._view.setUint32(pos, value[i], this._isLittleEndian);
			pos += 4;
		}
		this._pos += sizeBytes;
	}
	// writeUint8Array(value: ReadonlyBigUint64Array) {
	// 	const sizeBytes = value.byteLength;
	// 	if (this._pos + sizeBytes > this._view.byteLength)
	// 		throw new RangeError(`Need ${sizeBytes} to write, have ${this._view.byteLength}`);
	// 	let pos = this._pos;
	// 	for (let i = 0; i < value.length; i++) {
	// 		this._view.setBigUint64(pos, value[i], this._isLittleEndian);
	// 		pos += 8;
	// 	}
	// 	this._pos += sizeBytes;
	// }
	writeFloat4Array(value: ReadonlyFloat32Array) {
		const sizeBytes = value.byteLength;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to write, have ${this._view.byteLength}`
			);
		let pos = this._pos;
		for (let i = 0; i < value.length; i++) {
			this._view.setFloat32(pos, value[i], this._isLittleEndian);
			pos += 4;
		}
		this._pos += sizeBytes;
	}
	writeFloat8Array(value: ReadonlyFloat64Array) {
		const sizeBytes = value.byteLength;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to write, have ${this._view.byteLength}`
			);
		let pos = this._pos;
		for (let i = 0; i < value.length; i++) {
			this._view.setFloat64(pos, value[i], this._isLittleEndian);
			pos += 8;
		}
		this._pos += sizeBytes;
	}
}

/**
 * A view into an existing array buffer (like TypedArray.subarray, Spans in C#, Slices in Golang)
 * This *uses the same memory* as the provided buffer
 */
export class ArrayBufferWindow {
	private readonly _buffer: ArrayBuffer;
	private readonly _startInc: number;
	//Note we use an exclusive range-end for fast length calcs, this means you should always < the end, not <=
	private readonly _endExc: number;
	protected readonly _view: DataView;

	public constructor(
		buffer: ArrayBufferWindow | ArrayBuffer,
		start = 0,
		end = -1
	) {
		safety.intInRangeIncExc(start, 0, buffer.byteLength, 'start');
		if (end === -1) {
			end = buffer.byteLength;
		} else {
			//Note when end===start (allowed) the window has 0 length
			safety.intInRangeInc(end, start, buffer.byteLength, 'end');
		}
		if (buffer instanceof ArrayBufferWindow) {
			this._buffer = buffer._buffer;
			this._startInc = start + buffer._startInc;
			this._endExc = end;
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

	getWriter(isLittleEndian: boolean): ArrayBufferWindowWriter {
		return new ArrayBufferWindowWriter(this._view, isLittleEndian);
	}

	// /**
	//  * !DANGER this data view allows mutation of the internal buffer content
	//  * @returns
	//  */
	// newDataView():DataView {
	//     return new DataView(this._buffer,this._startInc,this._endExc-this._startInc);
	// }

	subWindow(start: number, end = -1): ArrayBufferWindow {
		return new ArrayBufferWindow(this, start, end);
	}

	static ofCapacity(capacity: number): ArrayBufferWindow {
		return new ArrayBufferWindow(new ArrayBuffer(capacity));
	}
}

// ES 2021 features
// -Because we rely on the internal ArrayBufferWindowWriter/Reader classes, we need to
// include the 2021 features in this file (which is a little messy, but exposing the classes
// is worse)

class ArrayBufferWindowReader_es2021 extends ArrayBufferWindowReader {}

class ArrayBufferWindowWriter_es2021 extends ArrayBufferWindowWriter {
	// @ts-expect-error: es2016 doesn't support BigUint64Array
	writeUint8Array(value: ReadonlyBigUint64Array) {
		const sizeBytes = value.byteLength;
		if (this._pos + sizeBytes > this._view.byteLength)
			throw new RangeError(
				`Need ${sizeBytes} to write, have ${this._view.byteLength}`
			);
		let pos = this._pos;
		for (let i = 0; i < value.length; i++) {
			// @ ts-expect-error: es2016 DataView doesn't support setBigUint64
			this._view.setBigUint64(pos, value[i], this._isLittleEndian);
			pos += 8;
		}
		this._pos += sizeBytes;
	}
}

/**
 * A view into an existing array buffer (like TypedArray.subarray, Spans in C#, Slices in Golang)
 * This *uses the same memory* as the provided buffer
 */
export class ArrayBufferWindow_es2021 extends ArrayBufferWindow {
	getReader(isLittleEndian: boolean): ArrayBufferWindowReader {
		return new ArrayBufferWindowReader_es2021(this._view, isLittleEndian);
	}

	getWriter(isLittleEndian: boolean): ArrayBufferWindowWriter {
		return new ArrayBufferWindowWriter_es2021(this._view, isLittleEndian);
	}
}
