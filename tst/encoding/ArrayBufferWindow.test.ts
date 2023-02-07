import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import { ArrayBufferWindow } from '../../src/encoding/ArrayBufferWindow';
import { Uint64 } from '../../src/primitive/Uint64';
import { Int64 } from '../../src/primitive/Int64';

const tsts = suite('ArrayBufferWindow');
//Let's make the test code a bit more readable
const LE = true;
const BE = false;

const write_1_2_4set = [
	//All these can be signed or unsigned
	//ui1, ui2, ui4, be, le
	[0x01, 0x0204, 0x08102040, '01020408102040', '01040240201008'],
	[0x40, 0x2010, 0x08040201, '40201008040201', '40102001020408'],
	[3, 5, 7, '03000500000007', '03050007000000'],
	[0x7f, 0x7fff, 0x7fffffff, '7F7FFF7FFFFFFF', '7FFF7FFFFFFF7F'],
];

for (const test of write_1_2_4set) {
	const i1 = test[0] as number;
	const i2 = test[1] as number;
	const i4 = test[2] as number;
	const be = test[3] as string;
	const le = test[4] as string;
	const len = be.length / 2;

	const buff = ArrayBufferWindow.ofCapacity(len);
	tsts('i1-i2-i4 LE', () => {
		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeInt1(i1);
		writer.writeInt2(i2);
		writer.writeInt4(i4);
		//Used up all the buffer space
		assert.is(writer.space, 0, 'All write space is taken');
		//Check the reads
		assert.is(reader.readInt1(), i1);
		assert.is(reader.readInt2(), i2);
		assert.is(reader.readInt4(), i4);
		//Used up all the reading space
		assert.is(reader.space, 0);

		const binReader = buff.getReader(LE);
		assert.is(binReader.space, len);
		assert.is(le, hex.fromBytes(binReader.readUint1Array(len)));
	});

	tsts('i1-i2-i4 BE', () => {
		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);
		writer.writeInt1(i1);
		writer.writeInt2(i2);
		writer.writeInt4(i4);
		//Used up all the buffer space
		assert.is(writer.space === 0, true);
		//Check the reads
		assert.is(reader.readInt1(), i1);
		assert.is(reader.readInt2(), i2);
		assert.is(reader.readInt4(), i4);
		//Used up all the reading space
		assert.is(reader.space === 0, true);

		const binReader = buff.getReader(LE);
		assert.is(binReader.space, len);
		assert.is(be, hex.fromBytes(binReader.readUint1Array(len)));
	});

	tsts('u1-u2-u4 LE', () => {
		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeUint1(i1);
		writer.writeUint2(i2);
		writer.writeUint4(i4);
		//Used up all the buffer space
		assert.is(writer.space, 0, 'All write space is taken');
		//Check the reads
		assert.is(reader.readUint1(), i1);
		assert.is(reader.readUint2(), i2);
		assert.is(reader.readUint4(), i4);
		//Used up all the reading space
		assert.is(reader.space, 0);

		const binReader = buff.getReader(LE);
		assert.is(binReader.space, len);
		assert.is(le, hex.fromBytes(binReader.readUint1Array(len)));
	});

	tsts('u1-u2-u4 BE', () => {
		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);
		writer.writeUint1(i1);
		writer.writeUint2(i2);
		writer.writeUint4(i4);
		//Used up all the buffer space
		assert.is(writer.space === 0, true);
		//Check the reads
		assert.is(reader.readUint1(), i1);
		assert.is(reader.readUint2(), i2);
		assert.is(reader.readUint4(), i4);
		//Used up all the reading space
		assert.is(reader.space === 0, true);

		const binReader = buff.getReader(LE);
		assert.is(binReader.space, len);
		assert.is(be, hex.fromBytes(binReader.readUint1Array(len)));
	});
}

const decodeFloat4NaN = [
	//Listed by https://en.wikipedia.org/wiki/Single-precision_floating-point_format
	['FFC00001', '0100C0FF'],
	['FF800001', '010080FF'],
	['7FC00000', '0000C07F'], //JS form
	//Other valid forms (sign isn't relevant)
	['7FC00001', '0100C07F'],
	['7F800001', '0100807F'],
	['7F801000', '0010807F'],
];
for (const test of decodeFloat4NaN) {
	const be = test[0];
	const le = test[1];
	const beBytes = hex.toBytes(be);

	const buff = ArrayBufferWindow.ofCapacity(beBytes.length);
	tsts(`float4 decode BE ${be}`, () => {
		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);
		writer.writeUint1Array(beBytes);
		assert.is(writer.space, 0);

		const val = reader.readFloat4();
		assert.equal(isNaN(val), true);
	});
	tsts(`float4 decode LE ${le}`, () => {
		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeUint1Array(hex.toBytes(le));
		assert.is(writer.space, 0);

		const val = reader.readFloat4();
		assert.equal(isNaN(val), true);
	});
}

const decodeFloat8NaN = [
	//Listed by https://en.wikipedia.org/wiki/Double-precision_floating-point_format
	['7FF0000000000001', '010000000000F07F'], //sNaN x86, ARM
	['7FF8000000000001', '010000000000F87F'], //qNaN x86, ARM
	['7FFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFF7F'], //alt encoding
	//Other valid forms (sign isn't relevant)
	['7FF8000000000000', '000000000000F87F'], //JS FORM
	['7FF0000001000000', '000000010000F07F'],
];
for (const test of decodeFloat8NaN) {
	const be = test[0];
	const le = test[1];
	const beBytes = hex.toBytes(be);
	const buff = ArrayBufferWindow.ofCapacity(beBytes.length);

	tsts(`float8 decode BE ${be}`, () => {
		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);
		writer.writeUint1Array(beBytes);
		assert.is(writer.space, 0);

		const val = reader.readFloat8();
		assert.equal(isNaN(val), true);
	});
	tsts(`float8 decode LE ${le}`, () => {
		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeUint1Array(hex.toBytes(le));
		assert.is(writer.space, 0);

		const val = reader.readFloat8();
		assert.equal(isNaN(val), true);
	});
}

const write1ByteSet = [
	[[0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x7f], '010204081020407F'],
	[[0x7f, 0x3f, 0x1f, 0x0f, 0x07, 0x03, 0x01, 0x00], '7F3F1F0F07030100'],
];

for (const test of write1ByteSet) {
	const byteSize = 1;
	const hexStr = test[1] as string;
	const len = hexStr.length / 2;
	//Note cap is in bytes, while len is in bytes*size (1x)
	const cap = 10;
	const buff = ArrayBufferWindow.ofCapacity(cap);
	tsts(`int${byteSize} ${hexStr}`, () => {
		const i8 = Int8Array.from(test[0] as number[]);

		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeInt1Array(i8);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');
		//Check the reads
		const read = reader.readInt1Array(len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');

		assert.is(hex.fromBytes(read), hexStr);
	});
	tsts(`uint${byteSize} ${hexStr}`, () => {
		const u8 = Uint8Array.from(test[0] as number[]);

		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeUint1Array(u8);
		//Used up all the buffer space
		assert.is(writer.space, cap - len, 'writer space consumed');
		//Check the reads
		const read = reader.readUint1Array(len);
		assert.is(reader.space, cap - len, 'reader space consumed');

		assert.is(hex.fromBytes(read), hexStr);
	});
}

const write2ByteSet = [
	//arr, BE, LE
	[[0x0102, 0x0408, 0x1020, 0x407f], '010204081020407F', '0201080420107F40'],
	[[0x7f3f, 0x1f0f, 0x0703, 0x0100], '7F3F1F0F07030100', '3F7F0F1F03070001'],
	[[0x7f3f, 0x1f0f, 0x0703], '7F3F1F0F0703', '3F7F0F1F0307'],
];

for (const test of write2ByteSet) {
	const byteSize = 2;
	const i16 = Int16Array.from(test[0] as number[]);
	const u16 = Uint16Array.from(test[0] as number[]);
	const be = test[1] as string;
	const le = test[2] as string;
	const len = i16.length;
	//Note cap is in bytes, while len is in bytes*size (2x)
	const cap = 5 * byteSize;
	const buff = ArrayBufferWindow.ofCapacity(cap);

	tsts(`int${byteSize}-le ${le}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeInt2Array(i16);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readInt2Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, i16, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), le, 'le encoded');
	});
	tsts(`int${byteSize}-be ${be}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);
		writer.writeInt2Array(i16);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readInt2Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, i16, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), be, 'be encoded');
	});
	tsts(`uint${byteSize}-le ${le}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeUint2Array(u16);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readUint2Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, u16, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), le, 'le encoded');
	});
	tsts(`uint${byteSize}-be ${be}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);
		writer.writeUint2Array(u16);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readUint2Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, u16, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), be, 'be encoded');
	});
}

const write4ByteSet = [
	//arr, BE, LE
	[[0x01020408, 0x1020407f], '010204081020407F', '080402017F402010'],
	[[0x7f3f1f0f, 0x07030100], '7F3F1F0F07030100', '0F1F3F7F00010307'],
];
for (const test of write4ByteSet) {
	const byteSize = 4;
	const i32 = Int32Array.from(test[0] as number[]);
	const u32 = Uint32Array.from(test[0] as number[]);
	const be = test[1] as string;
	const le = test[2] as string;
	const len = i32.length;
	//Note cap is in bytes, while len is in bytes*size (4x)
	const cap = 3 * byteSize;
	const buff = ArrayBufferWindow.ofCapacity(cap);
	tsts(`int${byteSize}-le ${le}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeInt4Array(i32);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readInt4Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, i32, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), le, 'le encoded');
	});
	tsts(`int${byteSize}-be ${be}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);
		writer.writeInt4Array(i32);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readInt4Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, i32, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), be, 'be encoded');
	});
	tsts(`uint${byteSize}-le ${le}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeUint4Array(u32);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readUint4Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, u32, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), le, 'le encoded');
	});
	tsts(`uint${byteSize}-be ${be}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);
		writer.writeUint4Array(u32);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readUint4Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, u32, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), be, 'be encoded');
	});
}

// const write8ByteSet = [
// 	//arr, BE, LE
// 	[[72624976668147839n], '010204081020407F', '7F40201008040201'],
// 	[[9169081515752227072n], '7F3F1F0F07030100', '000103070F1F3F7F'],
// ];
// for (const test of write8ByteSet) {
// 	const byteSize = 8;

// 	const i64 = BigInt64Array.from(test[0] as bigint[]);
// 	const u64 = BigUint64Array.from(test[0] as bigint[]);
// 	const be = test[1] as string;
// 	const le = test[2] as string;
// 	const len = i64.length;
// 	//Note cap is in bytes, while len is in bytes*size (4x)
// 	const cap = 3 * byteSize;
// 	const buff = ArrayBufferWindow.ofCapacity(cap);
// 	tsts(`int${byteSize}-le ${le}`, () => {
// 		assert.is(buff.byteLength, cap);

// 		const writer = buff.getWriter(LE);
// 		const reader = buff.getReader(LE);
// 		writer.writeInt8Array(i64);
// 		//Used up all the buffer space
// 		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

// 		//Read back
// 		const read = reader.readInt8Array(len);
// 		assert.is(read.length, len);
// 		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
// 		assert.equal(read, i64, 'Got the same numbers back');

// 		//Confirm the storage format
// 		const bReader = buff.getReader(false);
// 		const bytes = bReader.readUint1Array(byteSize * len);
// 		assert.is(hex.fromBytes(bytes), le, 'le encoded');
// 	});
// 	tsts(`int${byteSize}-be ${be}`, () => {
// 		assert.is(buff.byteLength, cap);

// 		const writer = buff.getWriter(BE);
// 		const reader = buff.getReader(BE);
// 		writer.writeInt8Array(i64);
// 		//Used up all the buffer space
// 		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

// 		//Read back
// 		const read = reader.readInt8Array(len);
// 		assert.is(read.length, len);
// 		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
// 		assert.equal(read, i64, 'Got the same numbers back');

// 		//Confirm the storage format
// 		const bReader = buff.getReader(false);
// 		const bytes = bReader.readUint1Array(byteSize * len);
// 		assert.is(hex.fromBytes(bytes), be, 'be encoded');
// 	});
// 	tsts(`uint${byteSize}-le ${le}`, () => {
// 		assert.is(buff.byteLength, cap);

// 		const writer = buff.getWriter(LE);
// 		const reader = buff.getReader(LE);
// 		writer.writeUint8Array(u64);
// 		//Used up all the buffer space
// 		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

// 		//Read back
// 		const read = reader.readUint8Array(len);
// 		assert.is(read.length, len);
// 		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
// 		assert.equal(read, u64, 'Got the same numbers back');

// 		//Confirm the storage format
// 		const bReader = buff.getReader(false);
// 		const bytes = bReader.readUint1Array(byteSize * len);
// 		assert.is(hex.fromBytes(bytes), le, 'le encoded');
// 	});
// 	tsts(`uint${byteSize}-be ${be}`, () => {
// 		assert.is(buff.byteLength, cap);

// 		const writer = buff.getWriter(BE);
// 		const reader = buff.getReader(BE);
// 		writer.writeUint8Array(u64);
// 		//Used up all the buffer space
// 		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

// 		//Read back
// 		const read = reader.readUint8Array(len);
// 		assert.is(read.length, len);
// 		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
// 		assert.equal(read, u64, 'Got the same numbers back');

// 		//Confirm the storage format
// 		const bReader = buff.getReader(false);
// 		const bytes = bReader.readUint1Array(byteSize * len);
// 		assert.is(hex.fromBytes(bytes), be, 'be encoded');
// 	});
// }

const write4ByteFloatSet = [
	//arr, BE, LE
	[[12.375], '41460000', '00004641'],
	[[1, 0.25, 0.375], '3F8000003E8000003EC00000', '0000803F0000803E0000C03E'],
	[
		[Infinity, -Infinity, 0, -0, 3.4028234664e38, 0.999999940395355225],
		'7F800000FF800000' + '0000000080000000' + '7F7FFFFF3F7FFFFF',
		'0000807F000080FF' + '0000000000000080' + 'FFFF7F7FFFFF7F3F',
	],
];
for (const test of write4ByteFloatSet) {
	const byteSize = 4;

	const f32 = Float32Array.from(test[0] as number[]);
	const be = test[1] as string;
	const le = test[2] as string;
	const len = f32.length;
	//Note cap is in bytes, while len is in bytes*size (4x)
	const cap = 13 * byteSize;
	const buff = ArrayBufferWindow.ofCapacity(cap);
	tsts(`float${byteSize}array-le ${le}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeFloat4Array(f32);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readFloat4Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, f32, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), le, 'le encoded');
	});
	tsts(`float${byteSize}array-be ${be}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);
		writer.writeFloat4Array(f32);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readFloat4Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, f32, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), be, 'be encoded');
	});
}

const write8ByteFloatSet = [
	//arr, BE, LE
	[
		[1, 100, 3.141592653589793],
		'3FF00000000000004059000000000000' + '400921FB54442D18',
		'000000000000F03F0000000000005940' + '182D4454FB210940',
	],
	[
		[Infinity, -Infinity, 0, -0, 1 / 3, 3.141592653589793],
		'7FF0000000000000FFF0000000000000' +
			'00000000000000008000000000000000' +
			'3FD5555555555555400921FB54442D18',
		'000000000000F07F000000000000F0FF' +
			'00000000000000000000000000000080' +
			'555555555555D53F182D4454FB210940',
	],
];
for (const test of write8ByteFloatSet) {
	const byteSize = 8;

	const f64 = Float64Array.from(test[0] as number[]);
	const be = test[1] as string;
	const le = test[2] as string;
	const len = f64.length;
	//Note cap is in bytes, while len is in bytes*size (4x)
	const cap = 7 * byteSize;
	const buff = ArrayBufferWindow.ofCapacity(cap);
	tsts(`float${byteSize}array-le ${le}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);
		writer.writeFloat8Array(f64);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readFloat8Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, f64, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), le, 'le encoded');
	});
	tsts(`float${byteSize}array-be ${be}`, () => {
		assert.is(buff.byteLength, cap);

		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);
		writer.writeFloat8Array(f64);
		//Used up all the buffer space
		assert.is(writer.space, cap - len * byteSize, 'writer space consumed');

		//Read back
		const read = reader.readFloat8Array(len);
		assert.is(read.length, len);
		assert.is(reader.space, cap - len * byteSize, 'reader space consumed');
		assert.equal(read, f64, 'Got the same numbers back');

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(byteSize * len);
		assert.is(hex.fromBytes(bytes), be, 'be encoded');
	});
}

const compositeSet = [
	//u1, u2s[2], u4s[3],u1
	[
		0x01,
		[0x0102, 0x0408],
		[0x01020408, 0x1020407f, 0x07030100],
		0x00,
		'0101020408010204081020407F0703010000',
		'0102010804080402017F4020100001030700',
	],
	[
		0x7f,
		[0x3f1f, 0x0f07],
		[0x03017f3f, 0x1f0f0703, 0x017f3f1f],
		0x0f,
		'7F3F1F0F0703017F3F1F0F0703017F3F1F0F',
		'7F1F3F070F3F7F010303070F1F1F3F7F010F',
	],
];
for (const test of compositeSet) {
	const u1a = test[0] as number;
	const u2s = new Uint16Array(test[1] as number[]);
	const u4s = new Uint32Array(test[2] as number[]);
	const u1b = test[3] as number;
	const len = 1 + u2s.length * 2 + u4s.length * 4 + 1;
	const buff = ArrayBufferWindow.ofCapacity(len);
	const be = test[4] as string;
	const le = test[5] as string;

	tsts('compositeSet uint-BE', () => {
		const writer = buff.getWriter(BE);
		const reader = buff.getReader(BE);

		writer.writeUint1(u1a);
		writer.writeUint2Array(u2s);
		writer.writeUint4Array(u4s);
		writer.writeUint1(u1b);
		//Used up all the buffer space
		assert.is(writer.space, 0, 'All write space is taken');

		//Read back
		assert.is(reader.readUint1(), u1a);
		assert.equal(reader.readUint2Array(2), u2s, 'readUint2Array(2)');
		assert.equal(reader.readUint4Array(3), u4s, 'readUint4Array(3)');
		assert.is(reader.readUint1(), u1b);
		//Used up all the reading space
		assert.is(reader.space, 0);

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(len);
		assert.is(hex.fromBytes(bytes), be, 'be encoded');
	});

	tsts('compositeSet uint-LE', () => {
		const writer = buff.getWriter(LE);
		const reader = buff.getReader(LE);

		writer.writeUint1(u1a);
		writer.writeUint2Array(u2s);
		writer.writeUint4Array(u4s);
		writer.writeUint1(u1b);
		//Used up all the buffer space
		assert.is(writer.space, 0, 'All write space is taken');

		//Read back
		assert.is(reader.readUint1(), u1a);
		assert.equal(reader.readUint2Array(2), u2s, 'readUint2Array(2)');
		assert.equal(reader.readUint4Array(3), u4s, 'readUint4Array(3)');
		assert.is(reader.readUint1(), u1b);
		//Used up all the reading space
		assert.is(reader.space, 0);

		//Confirm the storage format
		const bReader = buff.getReader(false);
		const bytes = bReader.readUint1Array(len);
		assert.is(hex.fromBytes(bytes), le, 'le encoded');
	});
}

const subWindowReadSet = [
	[
		//start,pos,
		'0102030405060708090A0B0C0D0E0F1020304050',
		1,
		//read 2*u1
		[0x02, 0x03],
		//read 2*u2 BE, LE
		[0x0203, 0x0405],
		[0x0302, 0x0504],
		//read 2*u4 BE, LE
		[0x02030405, 0x06070809],
		[0x05040302, 0x09080706],
		//read 2*u8 BE, LE
		[0x0203040506070809n, 0x0a0b0c0d0e0f1020n],
		[0x0908070605040302n, 0x20100f0e0d0c0b0an],
		//read u1
		0x02,
		//read u2 BE,LE
		0x0203,
		0x0302,
		//read u4 BE, LE
		0x02030405,
		0x05040302,
		//read u8 BE, LE
		0x0203040506070809n,
		0x0908070605040302n,
	],
	[
		//start,pos,
		'0102030405060708090A0B0C0D0E0F102030405060',
		3,
		//read 2*u1
		[0x04, 0x05],
		//read 2*u2 BE, LE
		[0x0405, 0x0607],
		[0x0504, 0x0706],
		//read 2*u4 BE, LE
		[0x04050607, 0x08090a0b],
		[0x07060504, 0x0b0a0908],
		//read 2*u8 BE, LE
		[0x0405060708090a0bn, 0x0c0d0e0f10203040n],
		[0x0b0a090807060504n, 0x403020100f0e0d0cn],
		//read u1
		0x04,
		//read u2 BE,LE
		0x0405,
		0x0504,
		//read u4 BE,LE
		0x04050607,
		0x07060504,
		//read u8 BE, LE
		0x0405060708090a0bn,
		0x0b0a090807060504n,
	],
];
for (const test of subWindowReadSet) {
	const hexStr = test[0] as string;
	const pos = test[1] as number;

	const cap = hexStr.length / 2;
	const buff1 = ArrayBufferWindow.ofCapacity(cap);
	const buff2 = buff1.subWindow(pos);
	//Write the data.. note this is after buff2 is created because it shares the same
	// memory that doesn't matter
	buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));
	//We need to create a reader each time, so the pointer is at the start (=pos)

	//UInts
	tsts('read uint1array', () => {
		const reader = buff2.getReader(BE); //BE/LE Doesn't matter on uint1
		assert.equal(reader.readUint1Array(2), new Uint8Array(test[2] as number[]));
	});

	tsts('read uint2array BE', () => {
		const reader = buff2.getReader(BE);
		assert.equal(
			reader.readUint2Array(2),
			new Uint16Array(test[3] as number[])
		);
	});
	tsts('read uint2array LE', () => {
		const reader = buff2.getReader(LE);
		assert.equal(
			reader.readUint2Array(2),
			new Uint16Array(test[4] as number[])
		);
	});

	tsts('read uint4array BE', () => {
		const reader = buff2.getReader(BE);
		assert.equal(
			reader.readUint4Array(2),
			new Uint32Array(test[5] as number[])
		);
	});
	tsts('read uint4array LE', () => {
		const reader = buff2.getReader(LE);
		assert.equal(
			reader.readUint4Array(2),
			new Uint32Array(test[6] as number[])
		);
	});

	// tsts('read uint8array BE', () => {
	// 	const reader = buff2.getReader(BE);
	// 	assert.equal(
	// 		reader.readUint8Array(2),
	// 		new BigUint64Array(test[7] as bigint[])
	// 	);
	// });
	// tsts('read uint8array LE', () => {
	// 	const reader = buff2.getReader(LE);
	// 	assert.equal(
	// 		reader.readUint8Array(2),
	// 		new BigUint64Array(test[8] as bigint[])
	// 	);
	// });

	//Ints
	tsts('read int1array', () => {
		const reader = buff2.getReader(BE); //BE/LE Doesn't matter on uint1
		assert.equal(reader.readInt1Array(2), new Int8Array(test[2] as number[]));
	});

	tsts('read int2array BE', () => {
		const reader = buff2.getReader(BE);
		assert.equal(reader.readInt2Array(2), new Int16Array(test[3] as number[]));
	});
	tsts('read int2array LE', () => {
		const reader = buff2.getReader(LE);
		assert.equal(reader.readInt2Array(2), new Int16Array(test[4] as number[]));
	});

	tsts('read int4array BE', () => {
		const reader = buff2.getReader(BE);
		assert.equal(reader.readInt4Array(2), new Int32Array(test[5] as number[]));
	});
	tsts('read int4array LE', () => {
		const reader = buff2.getReader(LE);
		assert.equal(reader.readInt4Array(2), new Int32Array(test[6] as number[]));
	});

	// tsts('read int8array BE', () => {
	// 	const reader = buff2.getReader(BE);
	// 	assert.equal(
	// 		reader.readInt8Array(2),
	// 		new BigInt64Array(test[7] as bigint[])
	// 	);
	// });
	// tsts('read int8array LE', () => {
	// 	const reader = buff2.getReader(LE);
	// 	assert.equal(
	// 		reader.readInt8Array(2),
	// 		new BigInt64Array(test[8] as bigint[])
	// 	);
	// });

	//UInt
	tsts('read uint1', () => {
		const reader = buff2.getReader(BE); //BE/LE Doesn't matter on uint1
		assert.equal(reader.readUint1(), test[9] as number);
	});

	tsts('read uint2 BE', () => {
		const reader = buff2.getReader(BE);
		assert.equal(reader.readUint2(), test[10] as number);
	});
	tsts('read uint2 LE', () => {
		const reader = buff2.getReader(LE);
		assert.equal(reader.readUint2(), test[11] as number);
	});

	tsts('read uint4 BE', () => {
		const reader = buff2.getReader(BE);
		assert.equal(reader.readUint4(), test[12] as number);
	});
	tsts('read uint4 LE', () => {
		const reader = buff2.getReader(LE);
		assert.equal(reader.readUint4(), test[13] as number);
	});

	// tsts('read uint8 BE', () => {
	// 	const reader = buff2.getReader(BE);
	// 	assert.equal(reader.readUint8(), Uint64.fromBigInt(test[14] as bigint));
	// });
	// tsts('read uint8 LE', () => {
	// 	const reader = buff2.getReader(LE);
	// 	assert.equal(reader.readUint8(), Uint64.fromBigInt(test[15] as bigint));
	// });

	//Int
	tsts('read int1', () => {
		const reader = buff2.getReader(BE); //BE/LE Doesn't matter on uint1
		assert.equal(reader.readInt1(), test[9] as number);
	});

	tsts('read int2 BE', () => {
		const reader = buff2.getReader(BE);
		assert.equal(reader.readInt2(), test[10] as number);
	});
	tsts('read int2 LE', () => {
		const reader = buff2.getReader(LE);
		assert.equal(reader.readInt2(), test[11] as number);
	});

	tsts('read int4 BE', () => {
		const reader = buff2.getReader(BE);
		assert.equal(reader.readInt4(), test[12] as number);
	});
	tsts('read int4 LE', () => {
		const reader = buff2.getReader(LE);
		assert.equal(reader.readInt4(), test[13] as number);
	});

	// tsts('read int8 BE', () => {
	// 	const reader = buff2.getReader(BE);
	// 	assert.equal(reader.readInt8(), Int64.fromBigInt(test[14] as bigint));
	// });
	// tsts('read int8 LE', () => {
	// 	const reader = buff2.getReader(LE);
	// 	assert.equal(reader.readInt8(), Int64.fromBigInt(test[15] as bigint));
	// });
}

const subWindowWriteSet = [
	//start,pos,
	[
		'0102030405060708090A0B0C0D0E0F1020',
		1,
		//write 2*u1
		'01FEDC0405060708090A0B0C0D0E0F1020',
		//write 2*u2 BE, LE
		'01FE00DC00060708090A0B0C0D0E0F1020',
		'0100FE00DC060708090A0B0C0D0E0F1020',
		//write 2*u4 BE, LE
		'01FE000000DC0000000A0B0C0D0E0F1020',
		'01000000FE000000DC0A0B0C0D0E0F1020',
		//write 2*u8 BE, LE
		'01FE00000000000000DC00000000000000',
		'0100000000000000FE00000000000000DC',
		//write u1
		'01FE030405060708090A0B0C0D0E0F1020',
		//write u2 BE,LE
		'01FEDC0405060708090A0B0C0D0E0F1020',
		'01DCFE0405060708090A0B0C0D0E0F1020',
		//write u4 BE,LE
		'01FEDCBA98060708090A0B0C0D0E0F1020',
		'0198BADCFE060708090A0B0C0D0E0F1020',
		//write u8 BE,LE
		'01FEDCBA98765432100A0B0C0D0E0F1020',
		'011032547698BADCFE0A0B0C0D0E0F1020',
		//write 2*f4s BE,LE
		'01414600003F8000000A0B0C0D0E0F1020',
		'01000046410000803F0A0B0C0D0E0F1020',
		//write 2*f8s BE,LE
		'01400921FB54442D183FEFFFFFFFFFFFFF',
		'01182D4454FB210940FFFFFFFFFFFFEF3F',
		//write f4 BE,LE
		'0141460000060708090A0B0C0D0E0F1020',
		'0100004641060708090A0B0C0D0E0F1020',
		//write f8 BE,LE
		'013FD55555555555550A0B0C0D0E0F1020',
		'01555555555555D53F0A0B0C0D0E0F1020',
	],
	[
		'0102030405060708090A0B0C0D0E0F102030405060',
		3,
		//write 2*u1=0 at 1
		'010203FEDC060708090A0B0C0D0E0F102030405060',
		//write 2*u2 BE, LE
		'010203FE00DC0008090A0B0C0D0E0F102030405060',
		'01020300FE00DC08090A0B0C0D0E0F102030405060',
		//write 2*u4 BE, LE
		'010203FE000000DC0000000C0D0E0F102030405060',
		'010203000000FE000000DC0C0D0E0F102030405060',
		//write 2*u8 BE, LE
		'010203FE00000000000000DC000000000000005060',
		'01020300000000000000FE00000000000000DC5060',
		//write u1
		'010203FE05060708090A0B0C0D0E0F102030405060',
		//write u2 BE,LE
		'010203FEDC060708090A0B0C0D0E0F102030405060',
		'010203DCFE060708090A0B0C0D0E0F102030405060',
		//write u4 BE,LE
		'010203FEDCBA9808090A0B0C0D0E0F102030405060',
		'01020398BADCFE08090A0B0C0D0E0F102030405060',
		//write u8 BE,LE
		'010203FEDCBA98765432100C0D0E0F102030405060',
		'0102031032547698BADCFE0C0D0E0F102030405060',
		//write 2*f4s BE, LE
		'010203414600003F8000000C0D0E0F102030405060',
		'010203000046410000803F0C0D0E0F102030405060',
		//write 2*f8s BE, LE
		'010203400921FB54442D183FEFFFFFFFFFFFFF5060',
		'010203182D4454FB210940FFFFFFFFFFFFEF3F5060',
		//write f4 BE, LE
		'0102034146000008090A0B0C0D0E0F102030405060',
		'0102030000464108090A0B0C0D0E0F102030405060',
		//write f8 BE,LE
		'0102033FD55555555555550C0D0E0F102030405060',
		'010203555555555555D53F0C0D0E0F102030405060',
	],
];
for (const test of subWindowWriteSet) {
	const hexStr = test[0] as string;
	const pos = test[1] as number;

	//Note we size cap for exactly the right size
	const cap = hexStr.length / 2;
	const buff1 = ArrayBufferWindow.ofCapacity(cap);
	const buff2 = buff1.subWindow(pos);
	//Note cap2 is one smaller than cap (because it was exact size)
	const cap2 = cap - 1;

	//UInts
	tsts('write uint1array', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeUint1Array(new Uint8Array([0xfe, 0xdc]));
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[2]);
	});

	tsts('write uint2array BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeUint2Array(new Uint16Array([0xfe00, 0xdc00]));
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[3]);
	});
	tsts('write uint2array LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeUint2Array(new Uint16Array([0xfe00, 0xdc00]));
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[4]);
	});

	tsts('write uint4array BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeUint4Array(new Uint32Array([0xfe000000, 0xdc000000]));
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[5]);
	});
	tsts('write uint4array LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeUint4Array(new Uint32Array([0xfe000000, 0xdc000000]));
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[6]);
	});

	// tsts('write uint8array BE', () => {
	// 	buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

	// 	const writer = buff2.getWriter(BE);
	// 	writer.writeUint8Array(
	// 		new BigUint64Array([0xfe00000000000000n, 0xdc00000000000000n])
	// 	);
	// 	const reader = buff1.getReader(BE);
	// 	assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[7]);
	// });
	// tsts('write uint8array LE', () => {
	// 	buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

	// 	const writer = buff2.getWriter(LE);
	// 	writer.writeUint8Array(
	// 		new BigUint64Array([0xfe00000000000000n, 0xdc00000000000000n])
	// 	);
	// 	const reader = buff1.getReader(BE);
	// 	assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[8]);
	// });

	//Ints
	tsts('write int1array', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeInt1Array(new Int8Array([0xfe, 0xdc]));
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[2]);
	});

	tsts('write int2array BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeInt2Array(new Int16Array([0xfe00, 0xdc00]));
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[3]);
	});
	tsts('write int2array LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeInt2Array(new Int16Array([0xfe00, 0xdc00]));
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[4]);
	});

	tsts('write int4array BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeInt4Array(new Int32Array([0xfe000000, 0xdc000000]));
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[5]);
	});
	tsts('write int4array LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeInt4Array(new Int32Array([0xfe000000, 0xdc000000]));
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[6]);
	});

	// tsts('write int8array BE', () => {
	// 	buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

	// 	const writer = buff2.getWriter(BE);
	// 	writer.writeInt8Array(
	// 		new BigInt64Array([0xfe00000000000000n, 0xdc00000000000000n])
	// 	);
	// 	const reader = buff1.getReader(BE);
	// 	assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[7]);
	// });
	// tsts('write int8array LE', () => {
	// 	buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

	// 	const writer = buff2.getWriter(LE);
	// 	writer.writeInt8Array(
	// 		new BigInt64Array([0xfe00000000000000n, 0xdc00000000000000n])
	// 	);
	// 	const reader = buff1.getReader(BE);
	// 	assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[8]);
	// });

	//Uint
	tsts('write uint1', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeUint1(0xfe);
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[9]);
	});

	tsts('write uint2 BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeUint2(0xfedc);
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[10]);
	});
	tsts('write uint2 LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeUint2(0xfedc);
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[11]);
	});

	tsts('write uint4 BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeUint4(0xfedcba98);
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[12]);
	});
	tsts('write uint4 LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeUint4(0xfedcba98);
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[13]);
	});

	// tsts('write uint8 BE', () => {
	// 	buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

	// 	const writer = buff2.getWriter(BE);
	// 	writer.writeUint8(new Uint64(0x76543210, 0xfedcba98));
	// 	const reader = buff1.getReader(BE);
	// 	assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[14]);
	// });
	// tsts('write uint8 LE', () => {
	// 	buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

	// 	const writer = buff2.getWriter(LE);
	// 	writer.writeUint8(new Uint64(0x76543210, 0xfedcba98));
	// 	const reader = buff1.getReader(BE);
	// 	assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[15]);
	// });

	//Int
	tsts('write int1', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeInt1(0xfe);
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[9]);
	});

	tsts('write int2 BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeInt2(0xfedc);
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[10]);
	});
	tsts('write int2 LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeInt2(0xfedc);
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[11]);
	});

	tsts('write int4 BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeInt4(0xfedcba98);
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[12]);
	});
	tsts('write int4 LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeInt4(0xfedcba98);
		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[13]);
	});

	// tsts('write int8 BE', () => {
	// 	buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

	// 	const writer = buff2.getWriter(BE);
	// 	writer.writeInt8(new Int64(0x76543210, 0xfedcba98));
	// 	const reader = buff1.getReader(BE);
	// 	assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[14]);
	// });
	// tsts('write int8 LE', () => {
	// 	buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

	// 	const writer = buff2.getWriter(LE);
	// 	writer.writeInt8(new Int64(0x76543210, 0xfedcba98));
	// 	const reader = buff1.getReader(BE);
	// 	assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[15]);
	// });

	//Floats
	const f4s = Float32Array.of(12.375, 1);
	tsts('write F4s BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeFloat4Array(f4s);

		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[16]);
	});
	tsts('write F4s LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeFloat4Array(f4s);

		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[17]);
	});

	const f8s = Float64Array.of(3.141592653589793, 0.9999999999999999);
	//400921FB54442D18 3FEFFFFFFFFFFFFF
	//182D4454FB210940 FFFFFFFFFFFFEF3F
	tsts('write F8s BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeFloat8Array(f8s);

		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[18]);
	});
	tsts('write F8s LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeFloat8Array(f8s);

		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[19]);
	});

	//Float
	const f4 = 12.375;
	tsts('write F4 BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeFloat4(f4);

		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[20]);
	});
	tsts('write F4 LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeFloat4(f4);

		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[21]);
	});

	const f8 = 1 / 3; //Note FP makes this approx
	tsts('write F8 BE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(BE);
		writer.writeFloat8(f8);

		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[22]);
	});
	tsts('write F8 LE', () => {
		buff1.getWriter(BE).writeUint1Array(hex.toBytes(hexStr));

		const writer = buff2.getWriter(LE);
		writer.writeFloat8(f8);

		const reader = buff1.getReader(BE);
		assert.equal(hex.fromBytes(reader.readUint1Array(cap)), test[23]);
	});
}

//Because certain binary encodings are not valid floats, we need to specially build the setup

//Float4 subWindowRead
{
	const pos = 1;
	const buff1 = ArrayBufferWindow.ofCapacity(64);
	const buff2 = buff1.subWindow(pos);
	const writer = buff1.getWriter(BE);
	writer.writeInt1(1);
	writer.writeFloat4(12.375);
	writer.writeInt4(0x00004641); //This is 12.375 in LE F4
	writer.writeFloat4(1);
	writer.writeInt4(0x0000803f); //This is 1 in LE F4
	//buff 1 should be: 0141460000000046413F8000000000803F
	// notice in BE       \------/        \------/
	//           LE               \------/        \------/
	tsts('read float4 BE', () => {
		const reader = buff2.getReader(BE);
		assert.equal(reader.readFloat4(), 12.375, 'single');
		//Of the next 3 F4 we only care about the second, because first and last are LE
		const arr = reader.readFloat4Array(3);
		assert.equal(arr[1], 1, 'array');
	});
	tsts('read float4 LE', () => {
		const reader = buff2.getReader(LE);
		//Of the next 3 F4 we only care about the second, because first and last are BE
		const arr = reader.readFloat4Array(3);
		assert.equal(arr[1], 12.375, 'array');
		assert.equal(reader.readFloat4(), 1, 'single');
	});
}

//Float8 subWindowRead
{
	const pos = 1;
	const buff1 = ArrayBufferWindow.ofCapacity(64);
	const buff2 = buff1.subWindow(pos);
	const writer = buff1.getWriter(BE);
	const pi_ish = 3.141592653589793;
	writer.writeInt1(1);
	writer.writeFloat8(100); //4059000000000000
	writer.writeUint8(new Uint64(0x00005940, 0)); //100 in LE F8
	writer.writeFloat8(pi_ish); //400921FB54442D18
	writer.writeUint8(new Uint64(0xfb210940, 0x182d4454)); //PI in LE F8
	//buff 1 should be: 01 4059000000000000 0000000000005940 400921FB54442D18 182D4454FB210940

	tsts('read float8 BE', () => {
		const reader = buff2.getReader(BE);
		assert.equal(reader.readFloat8(), 100, 'single');
		//Of the next 3F we only care about the second, because first and last are LE
		const arr = reader.readFloat8Array(3);
		assert.equal(arr[1], pi_ish, 'array');
	});
	tsts('read float8 LE', () => {
		const reader = buff2.getReader(LE);
		//Of the next 3F we only care about the second, because first and last are BE
		const arr = reader.readFloat8Array(3);
		assert.equal(arr[1], 100, 'array');
		assert.equal(reader.readFloat8(), pi_ish, 'single');
	});
}

tsts.run();
