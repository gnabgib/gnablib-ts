import { suite } from 'uvu';
import * as assert from 'uvu/assert';
//import { uint8ArrayExt } from '../../src/primitive';
import { hex } from '../../src/codec';
import { Assert } from '../../src/test';
import { uint8ArrayExt } from '../../src/primitive/XtUInt8Array';


const tsts = suite('xtUuint8Array');

const toSizedBytesTest: [Uint8Array, number, number | undefined, Uint8Array][] =
	[
		[new Uint8Array(0), 0, undefined, Uint8Array.of(0)],
		[Uint8Array.of(1, 2), 0, 0, Uint8Array.of(0)],
		[Uint8Array.of(1, 2), 0, 1, Uint8Array.of(1, 1)],
		[Uint8Array.of(1, 2), 1, 1, Uint8Array.of(1, 2)],
		[Uint8Array.of(1, 2), 0, undefined, Uint8Array.of(2, 1, 2)],
	];
let i = 0;
for (const [input, start, end, expect] of toSizedBytesTest) {
	tsts(`toSizedBytes[${i++}]`, () => {
		assert.equal(uint8ArrayExt.toSizedBytes(input, start, end), expect);
	});
}

const eqTest: string[] = ['00', 'ffffffff', 'ff00ff00ff00ff00', 'aabbcc'];
for (const aHex of eqTest) {
	const a = hex.toBytes(aHex);
	const b = hex.toBytes(aHex);
	tsts(`${aHex} ==.ct ${aHex}`, () => {
		assert.equal(uint8ArrayExt.ctEq(a, b), true);
	});
}
const neqTest: [string, string][] = [
	['10', '01'],
	['1020', 'ff'],
	['ff00ff00ff00ff00', 'ff00ff00ff00ff01'],
	['fe00ff00ff00ff00', 'ff00ff00ff00ff00'],
];
for (const [aHex, bHex] of neqTest) {
	const a = hex.toBytes(aHex);
	const b = hex.toBytes(bHex);
	tsts(`!${aHex} ==.ct ${bHex}`, () => {
		assert.equal(uint8ArrayExt.ctEq(a, b), false);
	});
}

const selTest: [string, string][] = [
	['01', '10'],
	['ff', '10'],
	['1020', 'beef'],
	['ff00ff00ff00ff00', 'ff00ff00ff00ff01'],
	['fe00ff00ff00ff00', 'ff00ff00ff00ff00'],
];
for (const [aHex, bHex] of selTest) {
	const a = hex.toBytes(aHex);
	const b = hex.toBytes(bHex);
	tsts(`select(${aHex},${bHex},true)`, () => {
		assert.equal(uint8ArrayExt.ctSelect(a, b, true), a);
	});
	tsts(`select(${aHex},${bHex},false)`, () => {
		assert.equal(uint8ArrayExt.ctSelect(a, b, false), b);
	});
}

tsts(`ctSelect(a,b) with diff lengths throws`, () => {
	const a = new Uint8Array(0);
	const b = Uint8Array.of(1, 2);
	assert.throws(() => uint8ArrayExt.ctSelect(a, b, true));
	assert.throws(() => uint8ArrayExt.ctSelect(b, a, true));
});

tsts(`pushInt`, () => {
	const a = new Uint8Array(2);
	let bitPos = 0;
	bitPos = uint8ArrayExt.pushInt(1, 1, a, bitPos);
	assert.equal(bitPos, 1);
	assert.equal(a[0], 0b10000000, 'push 1');
	bitPos = uint8ArrayExt.pushInt(1, 2, a, bitPos);
	assert.equal(bitPos, 3);
	assert.equal(a[0], 0b10100000, 'push 2');
	bitPos = uint8ArrayExt.pushInt(1, 3, a, bitPos);
	assert.equal(bitPos, 6);
	assert.equal(a[0], 0b10100100, 'push 3');
	bitPos = uint8ArrayExt.pushInt(1, 4, a, bitPos);
	assert.equal(bitPos, 10);
	assert.equal(a[0], 0b10100100, 'push 4a');
	assert.equal(a[1], 0b01000000, 'push 4b');

    //nop
    bitPos = uint8ArrayExt.pushInt(1, 0, a, bitPos);
    assert.equal(bitPos, 10);

	//Trying to push too much data will throw
	assert.throws(() => uint8ArrayExt.pushInt(1, 16, a, bitPos));
});

const incrTests:[string,string][]=[
	['01','02'],
	['FE','FF'],
	['FF','00'],//Wrap around
	['00','01'],
	['00FF','0100'],
	['FF00','FF01'],
	['FFFF','0000'],//Wrap around
	['FFFFFFFFFF','0000000000']
];
for(const [start,end] of incrTests) {
	tsts(`incr(${start})`,()=>{
		const found=hex.toBytes(start);
		uint8ArrayExt.incrBE(found);
		Assert.bytesMatchHex(found,end);	
	});
	//assert.is(hex.fromBytes(found),end);
}

const lShiftTests:[string,number,string][]=[
	['01',1,'02'],
	['01',2,'04'],
	['01',3,'08'],
	['01',4,'10'],
	['0001',8,'0100'],
	['000001',11,'000800'],
	['000001',13,'002000'],
	['000001',15,'008000'],
	['000001',16,'010000'],
	//10100101 10100101 10100101
	['A5A5A5',1,'4B4B4A'],
	['A5A5A5',2,'969694'],
	['A5A5A5',3,'2D2D28'],
	['A5A5A5',4,'5A5A50'],
	['A5A5A5',7,'D2D280'],
	['A5A5A5',8,'A5A500'],
	['A5A5A5',9,'4B4A00'],
	['A5A5A5',15,'D28000'],
	['A5A5A5',16,'A50000'],
	['A5A5A5',23,'800000'],
	['A5A5A5',24,'000000'],
	['A5A5A5',420,'000000'],
];
for(const [start,by,end] of lShiftTests) {
	tsts(`incr(${start})`,()=>{
		const found=hex.toBytes(start);
		uint8ArrayExt.lShiftEq(found,by);
		Assert.bytesMatchHex(found,end);	
	});
}

const xorTests:[string,string,string][]=[
	['01','','01'],
	['','01',''],
	['02','01','03'],
];
for(const [b,x,expect] of xorTests) {
	tsts(`xorEq(${b},${x})`,()=>{
		const found=hex.toBytes(b);
		uint8ArrayExt.xorEq(found,hex.toBytes(x));
		Assert.bytesMatchHex(found,expect);	
	});

}

tsts.run();
