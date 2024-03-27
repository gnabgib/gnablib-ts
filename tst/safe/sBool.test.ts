import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { sBool } from '../../src/safe/safe';

const tsts = suite('safe.sBool');

const isSet: [unknown, boolean][] = [
	//Primitive
	[null, false],
	[undefined, false],

	[true, true],
	[false, true],

	[13, false],
	[1.23, false],

	//BigInt - out of scope for ES6

	['yep', false],
	['', false],

	[Symbol('nope'), false],

	[() => {}, false],
];
let i = 0;
for (const [test, isValid] of isSet) {
	tsts(`is(${i})`, () => {
		assert.is(sBool('$noun', test).is(), isValid);
	});

	tsts(`throwNot(${i})`, () => {
		if (isValid) {
			assert.not.throws(() => sBool('$noun', test).throwNot());
		} else {
			assert.throws(() => sBool('$noun', test).throwNot());
		}
	});

	tsts(`cast(${i})`, () => {
		if (isValid) {
			assert.is(sBool('$noun', test).cast(), test);
		} else {
			assert.throws(() => sBool('$noun', test).cast());
		}
	});
	i++;
}

const coerceSet: [unknown, boolean][] = [
	[null, false],
	[undefined, false],

	[true, true],
	[false, false],

	[0, false],
	[13, true],
	[1.23, true],

	['', false],
	['hello there', true],
	['13', true],
	['1e2', true],

	[{}, true],
	[{ a: 1, b: 'Sea' }, true],
	[[1, 2], true],

	[Symbol('nope'), true],

	//bigint (oos ES6)

	[() => {}, true],
];
i = 0;
for (const [test, coerce] of coerceSet) {
	tsts(`coerce(${i++})`, () => {
		assert.is(sBool('$noun', test).coerce().value, coerce);
	});
}

tsts.run();
