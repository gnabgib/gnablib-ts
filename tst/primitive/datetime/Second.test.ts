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
	const dt = new Date();
	const m = Second.now();
	//This isn't a great test, but let's use a date object to compare
	//(tiny chance of this test failing near midnight)
	assert.is(m.valueOf(), dt.getSeconds());
});

tsts(`parse(1)`, () => {
	const s = Second.parse('1');
	assert.equal(s.valueOf(), 1);
});

tsts(`parse(now)`, () => {
	//Turns out setup of unit tests on the full suite is >second so this can't be part of a set
	//Note: This could fail at the end of the year :|
	const n = new Date();
	const s = Second.parse('now');
	assert.equal(s.valueOf(), n.getSeconds());
});

tsts.run();
