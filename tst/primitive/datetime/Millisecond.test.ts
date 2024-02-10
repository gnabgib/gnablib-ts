import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Millisecond } from '../../../src/primitive/datetime/Millisecond';
import util from 'util';
import { WindowStr } from '../../../src/primitive/WindowStr';
import { BitReader } from '../../../src/primitive/BitReader';

const tsts = suite('Millisecond');

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6, 777);
	const m = Millisecond.fromDate(dt);
	assert.is(m.valueOf(), dt.getMilliseconds());
});

tsts(`fromDateUtc`,()=>{
    //2024-01-20 07:13:30
    const dt=new Date(1705734810);
    const h=Millisecond.fromDateUtc(dt);
    assert.is(h.valueOf(),dt.getUTCMilliseconds());
});

const fromUnixTimeSet: [number, number][] = [
    //2024-01-20 07:13:30
	[1705734810, 0],
    //2024-01-20 07:13:30.534
	[1705734810.534, 534],
];
for (const [epoch, expect] of fromUnixTimeSet) {
	tsts(`fromUnixTime(${epoch})`, () => {
		const e = Millisecond.fromUnixTime(epoch);
		assert.is(e.valueOf(), expect);
	});
}

const fromUnixTimeMsSet: [number, number][] = [
    //2024-01-20 07:13:30.534
	[1705734810543, 543],
    //2024-01-20 07:13:30.534789
	[1705734810543.789, 543],
];
for (const [epoch, expect] of fromUnixTimeMsSet) {
	tsts(`fromUnixTimeMs(${epoch})`, () => {
		const e = Millisecond.fromUnixTimeMs(epoch);
		assert.is(e.valueOf(), expect);
	});
}

tsts(`now`, () => {
	const m = Millisecond.now();
	const mNum = +m;
	//Tricky to test this!
	assert.is(mNum >= 0 && mNum <= 999, true, 'In valid range');
	//console.log(m.toString());
});

const parseSet: [WindowStr, number][] = [
    [WindowStr.new('56'), 56],
];
for (const [w, expect] of parseSet) {
	tsts(`parse(${w.debug()})`, () => {
		const m = Millisecond.parse(w);
		assert.instance(m,Millisecond);
		assert.equal(m.valueOf(), expect);
	});
}

tsts(`parse(now)`, () => {
	const ms = Millisecond.parse(WindowStr.new('now'));
	const mNum = +ms;
	//Tricky to test this!
	assert.is(mNum >= 0 && mNum <= 999, true, 'In valid range');
});

tsts('[Symbol.toStringTag]', () => {
    const dt=Millisecond.now();
	const str = Object.prototype.toString.call(dt);
	assert.is(str.indexOf('Millisecond') > 0, true);
});

tsts('util.inspect',()=>{
    const dt=Millisecond.now();
    const u=util.inspect(dt);
    assert.is(u.startsWith('Millisecond('),true);
});

tsts('serialSizeBits',()=>{
    const o=Millisecond.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(Millisecond.storageBytes);
	const stor2=new Uint8Array(Millisecond.storageBytes);

	const o=Millisecond.new(22,stor1);
	assert.instance(o,Millisecond);
	assert.is(o.valueOf(),22);

	const o2=o.cloneTo(stor2);
	assert.instance(o2,Millisecond);
	assert.is(o2.valueOf(),22);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=13;//This corrupts o2 in the 8 msb
    assert.not.equal(o.valueOf(),o2.valueOf());
});

tsts(`deser`,()=>{
	const bytes=Uint8Array.of(3,0);//Value in the top 10 bits of 2 bytes
	const br=new BitReader(bytes);
	const m=Millisecond.deserialize(br).validate();
	assert.instance(m,Millisecond);
	assert.is(m.valueOf(),3<<2);
});

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();
