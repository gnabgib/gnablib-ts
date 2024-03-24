
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { superSafe } from '../../src/safe';

const tsts = suite('superSafe.uint');

const isSet: [unknown, boolean][] = [
	[0, true],
	[1, true],
	[-1, false],

	[true, false],	
	[1.1, false],
	['1.1', false],
];
for (const [test, isValid] of isSet) {
	tsts(`is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => superSafe.uint.is('$noun',test));
		} else {
			assert.throws(() => superSafe.uint.is('$noun',test));
		}
	});
}

const atMost5Set: [number, boolean][] = [
	[-1,false],
	[0,true],
	[1,true],
    [1.5,false],//Not an int
	[5,true],
	[6,false],
	[10,false],
];
for (const [test, isValid] of atMost5Set) {
	tsts(`atMost(${test},5)`, () => {
		if (isValid) {
			assert.not.throws(() => superSafe.uint.atMost('$noun',test,5));
		} else {
			assert.throws(() => superSafe.uint.atMost('$noun',test,5));
		}
	});
}

const oneTo5Set: [number, boolean][] = [
	[-1,false],
	[0,false],
	[1,true],
    [1.5,false],
	[5,true],
	[6,false],
	[10,false],
];
for (const [test, isValid] of oneTo5Set) {
	tsts(`oneTo(${test},5)`, () => {
		if (isValid) {
			assert.not.throws(() => superSafe.uint.oneTo('$noun',test,5));
		} else {
			assert.throws(() => superSafe.uint.oneTo('$noun',test,5));
		}
	});
}

tsts.run();