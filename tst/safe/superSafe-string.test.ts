import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { superSafe } from '../../src/safe';

const tsts = suite('superSafe.string');

const isSet: [unknown, boolean][] = [
	[undefined, false],
	[null, false],
	//[Symbol('nope'),false],
	[true, false],
	[0, false],
	[1.1, false],

	['yep', true],
	['', true],
];
for (const [test, isValid] of isSet) {
	tsts(`is(${test})`, () => {
		if (isValid) {
			assert.not.throws(() => superSafe.string.is(test));
		} else {
			assert.throws(() => superSafe.string.is(test));
		}
	});
}

const nullEmpty: [unknown, string | undefined][] = [
	[undefined, undefined],
	[null, undefined], //null -> undefined
	['', undefined], //empty string -> undefined
	[4, '4'], //Number coerced to string
	['hello', 'hello'],
];
for (const [test, expect] of nullEmpty) {
	tsts(`nullEmpty(${test})`, () => {
		assert.is(superSafe.string.nullEmpty(test), expect);
	});
}

tsts.run();