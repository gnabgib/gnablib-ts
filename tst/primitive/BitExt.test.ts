import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as bitExt from '../../src/primitive/BitExt';

const tsts = suite('BitExt');

const countOnes = [
	[0, 0],
	[1, 1],
	[2, 1],
	[3, 2],
	[4, 1],
	[5, 2],
	[6, 2],
	[7, 3],
	[0xf, 4],
	[0xff, 8],
	[0xfff, 12],
	[0xffff, 16],
	[1 << 16, 1],
];
for (const pairs of countOnes) {
	tsts('Count 1s in:' + pairs[0], () => {
		assert.is(bitExt.count1Bits(pairs[0]), pairs[1]);
	});
}

const buildLsb = [
	[0, 0],
	[1, 1],
	[2, 3],
	[3, 7],
	[4, 0xf],
	[5, 0x1f],
	[6, 0x3f],
	[7, 0x7f],
	[8, 0xff],
	[16, 0xffff],
	[32, 0xffffffff],
];
for (const pairs of buildLsb) {
	tsts('Build LSB of size:' + pairs[0], () => {
		assert.is(bitExt.lsbs(pairs[0]), pairs[1]);
	});
}

const reverseTests:[number,number][]=[
	[0,0],
	[1,128],
];
for (const [start,expect] of reverseTests) {
	tsts(`reverse(${start})`, () => {
		assert.is(bitExt.reverse(start),expect);
	});
}

tsts('Code coverage',()=>{
	const c=new bitExt.Carrier(1,2);
	assert.is(c.size,0);
	assert.is(c.empty,true);
});


tsts.run();
