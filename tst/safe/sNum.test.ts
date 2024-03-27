import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { sNum } from '../../src/safe/safe';

const tsts = suite('safe.sNum');

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
		assert.is(sNum('$noun', test).is(), isValid);
	});

	tsts(`throwNot(${i})`, () => {
		if (isValid) {
			assert.not.throws(() => sNum('$noun', test).throwNot());
		} else {
			assert.throws(() => sNum('$noun', test).throwNot());
		}
	});

	tsts(`cast(${i})`, () => {
		if (isValid) {
			assert.is(sNum('$noun', test).cast(), test);
		} else {
			assert.throws(() => sNum('$noun', test).cast());
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
	[[1, 2], Number.NaN],

	//symbol (throws)
	//bigint (oos ES6)

	[() => {}, Number.NaN],
];
i = 0;
for (const [test, coerce] of coerceSet) {
	tsts(`coerce(${test})`, () => {
		if (Number.isNaN(coerce)) {
			assert.is(Number.isNaN(sNum('$noun', test).coerce().value), true);
		} else assert.is(sNum('$noun', test).coerce().value, coerce);
	});
}

tsts(`symbol check`, () => {
	assert.is(sNum('symbol', Symbol('nop')).is(), false, 'is');
	assert.throws(() => sNum('symbol', Symbol('nop')).cast(), undefined, 'cast');
	assert.throws(
		() => sNum('symbol', Symbol('nop')).coerce().value,
		undefined,
		'coerce'
	);
});

const atMost5Set: [unknown, boolean][] = [
	[-1, true],
	[0, true],
	[1, true],
	[2, true],
	[4, true],
	[5, true],
	[6, false],

	[1.5, true], //!
];
for (const [test, isValid] of atMost5Set) {
	tsts(`atMost(5).is(${test})`, () => {
		assert.is(sNum('$noun', test).atMost(5).is(), isValid);
	});
}

const lt5Set: [unknown, boolean][] = [
	[-1, true],
	[0, true],
	[1, true],
	[2, true],
	[4, true],
	[5, false],
	[6, false],

	[1.5, true], //!
];
for (const [test, isValid] of lt5Set) {
	tsts(`lt(5).is(${test})`, () => {
		assert.is(sNum('$noun', test).lt(5).is(), isValid);
	});
}

const atLeast1Set: [unknown, boolean][] = [
	[-1, false],
	[0, false],
	[1, true],
	[2, true],
	[4, true],
	[5, true],
	[6, true],

	[1.5, true], //!
	[-1.5, false],
];
for (const [test, isValid] of atLeast1Set) {
	tsts(`atLeast(1).is(${test})`, () => {
		assert.is(sNum('$noun', test).atLeast(1).is(), isValid);
	});
}

const gt1Set: [unknown, boolean][] = [
	[-1, false],
	[0, false],
	[1, false],
	[2, true],
	[4, true],
	[5, true],
	[6, true],

	[1.5, true], //!
	[-1.5, false],
];
for (const [test, isValid] of gt1Set) {
	tsts(`gt(1).is(${test})`, () => {
		assert.is(sNum('$noun', test).gt(1).is(), isValid);
	});
}

const unsignedSet: [unknown, boolean][] = [
	[-1, false],
	[0, true],
	[1, true],
	[2, true],
	[4, true],
	[5, true],
	[6, true],

	[1.5, true], //!
	[-1.5, false],
];
for (const [test, isValid] of unsignedSet) {
	tsts(`unsigned().is(${test})`, () => {
		assert.is(sNum('$noun', test).unsigned().is(), isValid);
	});
}

const naturalSet: [unknown, boolean][] = [
	[-1, false],
	[0, false],
	[1, true],
	[2, true],
	[4, true],
	[5, true],
	[6, true],

	[1.5, true], //!
	[-1.5, false],
];
for (const [test, isValid] of naturalSet) {
	tsts(`natural().is(${test})`, () => {
		assert.is(sNum('$noun', test).natural().is(), isValid);
	});
}

tsts(`compound`, () => {
	//So the first failing test will prevent further from running, but.. let's confirm

	// 3<=n<=5
	assert.is(sNum('$noun', true).atMost(5).atLeast(3).is(), false);
	// 3<n<5
	assert.is(sNum('$noun', true).lt(5).gt(3).is(), false);
	// n>0, >1 (yeah it makes no sense)
	assert.is(sNum('$noun', true).unsigned().natural().is(), false);
});

tsts.run();
