import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Millisecond } from '../../../src/primitive/datetime/Millisecond';

const tsts = suite('Millisecond');

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6, 777);
	const m = Millisecond.fromDate(dt);
	assert.is(m.valueOf(), dt.getMilliseconds());
});

const secondsEpochSet: [number, number][] = [
    //2024-01-20 07:13:30
	[1705734810, 0],
    //2024-01-20 07:13:30.534
	[1705734810.534, 534],
];
for (const [epoch, expect] of secondsEpochSet) {
	tsts(`fromSecondsSinceEpoch(${epoch})`, () => {
		const e = Millisecond.fromSecondsSinceEpoch(epoch);
		assert.is(e.valueOf(), expect);
	});
}

const millisEpochSet: [number, number][] = [
    //2024-01-20 07:13:30.534
	[1705734810543, 543],
    //2024-01-20 07:13:30.534789
	[1705734810543.789, 543],
];
for (const [epoch, expect] of millisEpochSet) {
	tsts(`fromMillisecondsSinceEpoch(${epoch})`, () => {
		const e = Millisecond.fromMillisecondsSinceEpoch(epoch);
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
	const stor = new Uint8Array(3);
	const ms = Millisecond.parse('now', stor);
	const mNum = +ms;
	//Tricky to test this!
	assert.is(mNum >= 0 && mNum <= 999, true, 'In valid range');
});

tsts.run();
