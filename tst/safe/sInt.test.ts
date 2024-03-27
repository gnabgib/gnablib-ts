import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { sInt } from '../../src/safe/safe';

const tsts = suite('safe.sInt');

const isSet: [unknown, boolean][] = [
	[0, true],
	[1, true],

	[null, false],
	[undefined, false],

	[true, false],
	[false, false],

	[13, true],
	[1.23, false],

	['hello there', false],
	['13', false],
	['1e2', false],

	[{ a: 1, b: 'Sea' }, false],
	[[1, 2], false],

	[Symbol('nope'), false],

	[() => {}, false],

	[Number.NaN, false],
	[Number.MAX_SAFE_INTEGER, true],
	[Number.MAX_SAFE_INTEGER + 1, false],
	[Number.POSITIVE_INFINITY, false],
	[Number.NEGATIVE_INFINITY, false],
	[4294967295, true],
	[-2147483648, true],
];
let i = 0;
for (const [test, isValid] of isSet) {
	tsts(`is(${i})`, () => {
		assert.is(sInt('$noun', test).is(), isValid);
	});
	tsts(`cast(${i})`, () => {
		if (isValid) {
			assert.is(sInt('$noun', test).cast(), test);
		} else {
			assert.throws(() => sInt('$noun', test).cast());
		}
	});
	i++;
}

const coerceSet: [unknown, number][] = [
	[null, 0],
	[undefined, 0],

	[true, 1],
	[false, 0],

	[0, 0],
	[13, 13],
	[1.23, 1],
	//All truncate (rather than round)
	[5.4, 5],
	[5.5, 5],
	[5.6, 5],
	[-5.4, -5],
	[-5.5, -5],
	[-5.6, -5],

	['', 0],
	['hello there', Number.NaN],
	['13', 13],
	['1e2', 100],

	[{}, Number.NaN],
	[{ a: 1, b: 'Sea' }, Number.NaN],
	[[1, 2], Number.NaN],

	//symbol throws

	//bigint (oos es6)

	[() => {}, Number.NaN],
];
i = 0;
for (const [test, coerce] of coerceSet) {
	tsts(`coerce(${test})`, () => {
		if (Number.isNaN(coerce)) {
			assert.is(Number.isNaN(sInt('$noun', test).coerce().value), true);
		} else assert.is(sInt('$noun', test).coerce().value, coerce);
	});
}

//Range tests are shared with sNum, no need to duplicate

tsts.run();
