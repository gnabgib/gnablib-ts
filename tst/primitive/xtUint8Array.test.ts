import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/codec';
import { Assert } from '../../src/test';
import { ctEq, ctSelect, incrBE, lShiftEq, toGlBytes, xorEq } from '../../src/primitive/xtUint8Array';


const tsts = suite('xtUint8Array');

const toGlBytes_tests:[string,string][]=[
	['','00'],
	['00','0100'],
	['01','0101'],
	['0102','020102'],
];
for(const [input,expect] of toGlBytes_tests) {
	tsts(`toGlBytes(${input})`,()=>{
		const b=hex.toBytes(input);
		assert.equal(hex.fromBytes(toGlBytes(b)),expect);
	});
}

const eqTest: string[] = ['00', 'ffffffff', 'ff00ff00ff00ff00', 'aabbcc'];
for (const aHex of eqTest) {
	const a = hex.toBytes(aHex);
	const b = hex.toBytes(aHex);
	tsts(`${aHex} ==.ct ${aHex}`, () => {
		assert.equal(ctEq(a, b), true);
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
		assert.equal(ctEq(a, b), false);
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
		assert.equal(ctSelect(a, b, true), a);
	});
	tsts(`select(${aHex},${bHex},false)`, () => {
		assert.equal(ctSelect(a, b, false), b);
	});
}

tsts(`ctSelect(a,b) with diff lengths throws`, () => {
	const a = new Uint8Array(0);
	const b = Uint8Array.of(1, 2);
	assert.throws(() => ctSelect(a, b, true));
	assert.throws(() => ctSelect(b, a, true));
});


const incrBE_tests:[string,string][]=[
	['01','02'],
	['FE','FF'],
	['FF','00'],//Wrap around
	['00','01'],
	['00FF','0100'],
	['FF00','FF01'],
	['FFFF','0000'],//Wrap around
	['FFFFFFFFFF','0000000000']
];
for(const [start,end] of incrBE_tests) {
	tsts(`incrBE(${start})`,()=>{
		const found=hex.toBytes(start);
		incrBE(found);
		Assert.bytesMatchHex(found,end);	
	});
	//assert.is(hex.fromBytes(found),end);
}

const lShiftEq_tests:[string,number,string][]=[
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
for(const [start,by,end] of lShiftEq_tests) {
	tsts(`incr(${start})`,()=>{
		const found=hex.toBytes(start);
		lShiftEq(found,by);
		Assert.bytesMatchHex(found,end);	
	});
}

const xorEq_tests:[string,string,string][]=[
	['01','','01'],
	['','01',''],
	['02','01','03'],
];
for(const [b,x,expect] of xorEq_tests) {
	tsts(`xorEq(${b},${x})`,()=>{
		const found=hex.toBytes(b);
		xorEq(found,hex.toBytes(x));
		Assert.bytesMatchHex(found,expect);	
	});

}

tsts.run();
