
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { safe } from '../../src/safe';

const tsts = suite('safe.uint');

const isSet: [unknown, boolean][] = [
	//no checks in somewhatSafe
	[0, true],
	[1, true],
	[-1, false],

	[true, false],	
	[1.1, true],//!
	['1.1', false],
];
for (const [test, isValid] of isSet) {
	tsts(`is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => safe.uint.is('$noun',test));
		} else {
			assert.throws(() => safe.uint.is('$noun',test));
		}
	});
}

const atMost5Set: [number, boolean][] = [
	//no checks in somewhatSafe
	[-1,false],
	[0,true],
	[1,true],
    [1.5,true],//!
	[5,true],
	[6,false],
	[10,false],
];
for (const [test, isValid] of atMost5Set) {
	tsts(`atMost(${test},5)`, () => {
		if (isValid) {
			assert.not.throws(() => safe.uint.atMost('$noun',test,5));
		} else {
			assert.throws(() => safe.uint.atMost('$noun',test,5));
		}
	});
}

const oneTo5Set: [number, boolean][] = [
	[-1,false],
	[0,false],
	[1,true],
    [1.5,true],//!
	[5,true],
	[6,false],
	[10,false],
];
for (const [test, isValid] of oneTo5Set) {
	tsts(`oneTo(${test},5)`, () => {
		if (isValid) {
			assert.not.throws(() => safe.uint.oneTo('$noun',test,5));
		} else {
			assert.throws(() => safe.uint.oneTo('$noun',test,5));
		}
	});
}

tsts.run();