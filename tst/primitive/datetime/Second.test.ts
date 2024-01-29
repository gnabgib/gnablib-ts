import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Second } from '../../../src/primitive/datetime/Second';

const tsts = suite('Second');

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6);
	const m = Second.fromDate(dt);
	assert.is(m.valueOf(), dt.getSeconds());
});

tsts(`fromSecondsSinceEpoch`, () => {
	const m = Second.fromSecondsSinceEpoch(1705734810);
	assert.is(m.valueOf(), 30);
});

tsts(`fromMillisecondsSinceEpoch`, () => {
	const m = Second.fromMillisecondsSinceEpoch(1705734810543);
	assert.is(m.valueOf(), 30);
});

tsts(`now`, () => {
	const s = Second.now();
	//Near the end of a second, this test can fail, (but passes otherwise)
	// so we've replaced with a more generic form (not super useful)
	//const dt = new Date();
	//assert.is(s.valueOf(), dt.getSeconds());

	const sNum=s.valueOf();
	assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
});
tsts(`parse(now)`, () => {
	const s = Second.parse('now');
	const sNum=s.valueOf();
	assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
});

tsts(`parse(1)`, () => {
	const s = Second.parse('1');
	assert.equal(s.valueOf(), 1);
});


tsts.run();
