import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { sLen } from '../../src/safe/safe';
import { ILengther } from '../../src/primitive/interfaces/ILengther';

const tsts = suite('safe.sLen');

const atLeast5Set: [ILengther, boolean][] = [
	//Anything that gives us a length element
	[new Uint8Array(0), false],
	[new Uint8Array(1), false],
	[new Uint8Array(4), false],
	[new Uint8Array(5), true],
	[new Uint8Array(6), true],
	['', false],
	['abba', false],
	['alpha', true],
	['alphabet', true],
];
for (const [test, expect] of atLeast5Set) {
	tsts(`(${test}).atLeast(5)`, () => {
		assert.is(sLen('$noun', test).atLeast(5).is(), expect);
	});

	tsts(`(${test}).atLeast(5).throwNot()`, () => {
		if (expect) {
			assert.not.throws(() => sLen('$noun', test).atLeast(5).throwNot());
		} else {
			assert.throws(() => sLen('$noun', test).atLeast(5).throwNot());
		}
	});
}

const exactly5Set: [ILengther, boolean][] = [
	[new Uint8Array(0), false],
	[new Uint8Array(1), false],
	[new Uint8Array(4), false],
	[new Uint8Array(5), true],
	[new Uint8Array(6), false],
	['', false],
	['abba', false],
	['alpha', true],
	['alphabet', false],
];
for (const [test, expect] of exactly5Set) {
	tsts(`(${test}).exactly(5)`, () => {
		assert.is(sLen('$noun', test).exactly(5).is(), expect);
	});
}

const atMost5Set: [ILengther, boolean][] = [
	[new Uint8Array(0), true],
	[new Uint8Array(1), true],
	[new Uint8Array(4), true],
	[new Uint8Array(5), true],
	[new Uint8Array(6), false],
	['', true],
	['abba', true],
	['alpha', true],
	['alphabet', false],
];
for (const [test, expect] of atMost5Set) {
	tsts(`(${test}).atMost(5)`, () => {
		assert.is(sLen('$noun', test).atMost(5).is(), expect);
	});
}

tsts(`compound`, () => {
	//So the first failing test will prevent further from running, but.. let's confirm
	const test = new Uint8Array(1);

	// 3<=n<=5
	assert.is(sLen('$noun', test).atLeast(2).atLeast(3).is(), false);
	assert.is(sLen('$noun', test).atLeast(2).atMost(5).is(), false);
	assert.is(sLen('$noun', test).atLeast(2).exactly(4).is(), false);
});

tsts.run();
