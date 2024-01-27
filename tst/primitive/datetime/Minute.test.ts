import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Minute } from '../../../src/primitive/datetime/Minute';

const tsts = suite('Minute');

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6);
	const m = Minute.fromDate(dt);
	assert.is(m.valueOf(), dt.getMinutes());
});

tsts(`fromSecondsSinceEpoch`,()=>{
    const m = Minute.fromSecondsSinceEpoch(1705734810);
    assert.is(m.valueOf(),13);
});

tsts(`fromMillisecondsSinceEpoch`,()=>{
    const m = Minute.fromMillisecondsSinceEpoch(1705734810543);
    assert.is(m.valueOf(),13);
});

tsts(`now`, () => {
	const m = Minute.now();
	//Near the end of a minute, this test can fail, (but passes otherwise)
	// so we've replaced with a more generic form (not super useful)
	//const dt = new Date();
	//assert.is(m.valueOf(), dt.getMinutes());
	
	const mNum=m.valueOf();
	assert.is(mNum >= 0 && mNum <= 59, true, 'In valid range');
});

tsts(`nowUtc`, () => {
	const dt = new Date();
	const m = Minute.nowUtc();
	//This isn't a great test, but let's use a date object to compare
	//(tiny chance of this test failing near midnight UTC)
	assert.is(m.valueOf(), dt.getUTCMinutes());
});

const parseSet: [string, number][] = [
    ['01', 1],
	['13', 13],
	//Note: This could fail at the end of the year :|
	['now', new Date().getMinutes()],
];
for (const [str, expect] of parseSet) {
	tsts(`parse(${str})`, () => {
		const stor = new Uint8Array(1);
		const d = Minute.parse(str, stor);
		assert.equal(d.valueOf(), expect);
	});
}

tsts(`parse(now)`, () => {
	//Turns out setup of unit tests on the full suite is >second so this can't be part of a set
	//Note: This could fail at the end of the year :|
	const m = Minute.parse('now');
	const mNum=m.valueOf();
	assert.is(mNum >= 0 && mNum <= 59, true, 'In valid range');
});

tsts.run();
