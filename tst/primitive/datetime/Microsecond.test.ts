import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Microsecond } from '../../../src/primitive/datetime/Microsecond';
import util from 'util';

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

const microAsMilli:[number,number][]=[
	[0,0],
	[542000,542],
	[542789,542.789]
];
for(const [micro,milli] of microAsMilli) {
	tsts(`toMillisecond(${micro})`,()=>{
		const e=Microsecond.new(micro);
		console.log(e);
		assert.is(e.toMillisecond(),milli);
	})
}

tsts(`now`, () => {
	const m = Microsecond.now();
	const mNum = +m;
	//Tricky to test this!
	assert.is(mNum >= 0 && mNum <= 999999, true, 'In valid range');
	//console.log(m.toString());
});

tsts(`parse(5678)`, () => {
	const ms = Microsecond.parse('5678');
	assert.equal(ms.valueOf(), 5678);
});

tsts(`parse(now)`, () => {
	const stor = new Uint8Array(3);
	const ms = Microsecond.parse('now', stor);
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

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();
