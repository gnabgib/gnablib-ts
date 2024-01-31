import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Millisecond } from '../../../src/primitive/datetime/Millisecond';
import util from 'util';

const tsts = suite('Millisecond');

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6, 777);
	const m = Millisecond.fromDate(dt);
	assert.is(m.valueOf(), dt.getMilliseconds());
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

tsts(`parse(56)`, () => {
	const ms = Millisecond.parse('56');
	assert.equal(ms.valueOf(), 56);
});

tsts(`parse(now)`, () => {
	const stor = new Uint8Array(Millisecond.storageBytes);
	const ms = Millisecond.parse('now', stor);
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

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();
