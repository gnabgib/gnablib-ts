import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Microsecond } from '../../src/datetime/Microsecond';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';
import { BitReader } from '../../src/primitive/BitReader';

const tsts = suite('Microsecond');

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6, 777);
	const m = Microsecond.fromDate(dt);
	assert.is(m.valueOf(), dt.getMilliseconds() * 1000);
});

tsts(`fromDateUtc`,()=>{
    //2024-01-20 07:13:30
    const dt=new Date(1705734810);
    const h=Microsecond.fromDateUtc(dt);
    assert.is(h.valueOf(),dt.getUTCMilliseconds()*1000);
});

const fromUnixTimeSet: [number, number][] = [
    //2024-01-20 07:13:30
	[1705734810, 0],
    //2024-01-20 07:13:30.534
	[1705734810.534, 534000],
];
for (const [epoch, expect] of fromUnixTimeSet) {
	tsts(`fromUnixTime(${epoch})`, () => {
		const e = Microsecond.fromUnixTime(epoch);
		assert.is(e.valueOf(), expect);
	});
}

const fromUnixTimeMsSet: [number, number][] = [
    //2024-01-20 07:13:30.542
	[1705734810542, 542000],
    //2024-01-20 07:13:30.542789
	[1705734810542.789, 542789],
	[1705734810543,543000]
];
for (const [epoch, expect] of fromUnixTimeMsSet) {
	tsts(`fromUnixTimeMs(${epoch})`, () => {
		const e = Microsecond.fromUnixTimeMs(epoch);
		assert.is(e.valueOf(), expect);
	});
}

tsts(`fromUnixTimeUs`, () => {
	const e = Microsecond.fromUnixTimeUs(1705734810542789);
	assert.is(e.valueOf(), 542789);
});

tsts(`now`, () => {
	const m = Microsecond.now();
	const mNum = +m;
	//Tricky to test this!
	assert.is(mNum >= 0 && mNum <= 999999, true, 'In valid range');
	//console.log(m.toString());
});

const parseSet: [WindowStr, number][] = [
    [WindowStr.new('5678'), 5678],
];
for (const [w, expect] of parseSet) {
	tsts(`parse(${w.debug()})`, () => {
		const m = Microsecond.parse(w);
		assert.instance(m,Microsecond);
		assert.equal(m.valueOf(), expect);
	});
}

const parseLeftSet:[WindowStr,number][]=[
    [WindowStr.new('1'),100000],
    [WindowStr.new('01'),10000],
    [WindowStr.new('001'),1000],
    [WindowStr.new('0001'),100],
    [WindowStr.new('00001'),10],
    [WindowStr.new('000001'),1],
];
for (const [w,expect] of parseLeftSet) {
    tsts(`parse(${w.debug()})-left`,()=>{
        const ms=Microsecond.parse(w,false,true);
        assert.equal(ms.valueOf(),expect);
    });
}

tsts(`parse(now)`, () => {
	const ms = Microsecond.parse(WindowStr.new('now'));
	const mNum = +ms;
	//Tricky to test this!
	assert.is(mNum >= 0 && mNum <= 999999, true, 'In valid range');
});

tsts('[Symbol.toStringTag]', () => {
    const o=Microsecond.now();
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Microsecond') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Microsecond.now();
    const u=util.inspect(o);
    assert.is(u.startsWith('Microsecond('),true);
});

tsts('serialSizeBits',()=>{
    const o=Microsecond.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(Microsecond.storageBytes);
	const stor2=new Uint8Array(Microsecond.storageBytes);

	const o=Microsecond.new(22,stor1);
	assert.instance(o,Microsecond);
	assert.is(o.valueOf(),22);

	const o2=o.cloneTo(stor2);
	assert.instance(o2,Microsecond);
	assert.is(o2.valueOf(),22);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=13;//This corrupts o2 in the 8 msb
    assert.not.equal(o.valueOf(),o2.valueOf());
});

tsts(`deser`,()=>{
	const bytes=Uint8Array.of(0,0,3<<4);//Value in the top 20 bits of 3 bytes
	const br=new BitReader(bytes);
	const m=Microsecond.deserialize(br).validate();
	assert.instance(m,Microsecond);
	assert.is(m.valueOf(),3);
});

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();
