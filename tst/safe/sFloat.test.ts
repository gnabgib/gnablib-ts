import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { sFloat } from '../../src/safe/safe';

const tsts = suite('safe.sFloat');

const isSet: [unknown, boolean][] = [
	[0, true],
	[1, true],

	[null, false],
	[undefined, false],

	[true, false],
	[false, false],

	[13, true],
	[1.23, true],

	['hello there', false],
	['13', false],
	['1e2', false],

	[{ a: 1, b: 'Sea' }, false],
	[[1, 2], false],

	[Symbol('nope'), false],

	[() => {}, false],

	[Number.NaN, false],
	[Number.MAX_SAFE_INTEGER, true],
	[Number.MAX_SAFE_INTEGER + 1, true],
	[Number.POSITIVE_INFINITY, true],
	[Number.NEGATIVE_INFINITY, true],
];
let i = 0;
for (const [test, isValid] of isSet) {
	tsts(`is(${i})`, () => {
		assert.is(sFloat('$noun', test).is(), isValid);
	});
	tsts(`cast(${i})`, () => {
		if (isValid) {
			assert.is(sFloat('$noun', test).cast(), test);
		} else {
			assert.throws(() => sFloat('$noun', test).cast());
		}
	});
	i++;
}

const coerceSet: [unknown, number][] = [
	[null, Number.NaN],
	[undefined, Number.NaN],

	[true, 1],
	[false, 0],

	[0, 0],
	[13, 13],
	[1.23, 1.23],

	['', 0],
	['hello there', Number.NaN],
	['13 numberish', Number.NaN],
	['13', 13],
	['1e2', 100],

	[{}, Number.NaN],
	[{ a: 1, b: 'Sea' }, Number.NaN],
	[[], 0],//This is a stupid JS default
	[[1, 2], Number.NaN],

	//symbol (throws)
	//bigint (oos ES6)

	[() => {}, Number.NaN],
];
i = 0;
for (const [test, coerce] of coerceSet) {
	tsts(`coerce(${test})`, () => {
		if (Number.isNaN(coerce)) {
			assert.is(Number.isNaN(sFloat('$noun', test).coerce().value), true);
		} else assert.is(sFloat('$noun', test).coerce().value, coerce);
	});
}

//Range tests are shared with sNum, no need to duplicate

tsts.run();
