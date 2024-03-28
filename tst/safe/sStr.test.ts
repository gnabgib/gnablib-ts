import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { sStr } from '../../src/safe/safe';

const tsts = suite('safe.sStr');

const isSet: [unknown, boolean][] = [
	//Primitive
	[null, false],
	[undefined, false],

	[true, false],
	[false, false],

	[13, false],
	[1.23, false],

	//BigInt - out of scope for ES6

	['yep', true],
	['', true],

	[Symbol('nope'), false],

	[() => {}, false],
];
let i = 0;
for (const [test, isValid] of isSet) {
	tsts(`is(${i})`, () => {
		assert.is(sStr('$noun', test).is(), isValid);
	});

	tsts(`throwNot(${i})`, () => {
		if (isValid) {
			assert.not.throws(() => sStr('$noun', test).throwNot());
		} else {
			assert.throws(() => sStr('$noun', test).throwNot());
		}
	});

	tsts(`cast(${i})`, () => {
		if (isValid) {
			assert.is(sStr('$noun', test).cast(), test);
		} else {
			assert.throws(() => sStr('$noun', test).cast());
		}
	});
	i++;
}

const coerceSet: [unknown, string][] = [
	[null, ''],
	[undefined, ''],

	[true, 'true'],
	[false, 'false'],

	[0, '0'],
	[13, '13'],
	[1.23, '1.23'],

	['', ''],
	['hello there', 'hello there'],
	['13', '13'],
	['1e2', '1e2'],

	//Not useful
	[{}, '[object Object]'],
	[{ a: 1, b: 'Sea' }, '[object Object]'],
	[[], ''],
	[[1, 2], '1,2'],

	//symbol throws

	//bigint (oos ES6)

	//awkwardly functions are sort of turned into text - so hard to test
	//[() => {}, ''],
];
i = 0;
for (const [test, coerce] of coerceSet) {
	tsts(`coerce(${i++})`, () => {
		assert.is(sStr('$noun', test).coerce().value, coerce);
	});
}

tsts.run();
