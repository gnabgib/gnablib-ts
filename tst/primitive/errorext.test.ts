import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	Grievous,
	NegativeError,
	NotEnoughDataError,
	NotEnoughSpaceError,
	NotSupportedError,
	NullError,
	OutOfRangeError,
	ZeroError,
} from '../../src/primitive';

const tsts = suite('ErrorExt');

//Note sure how useful this is, not useless tests, but.. code coverage
const oorTests: [number, number, number?][] = [
	[2, 1], //No high
	[2, 1, 1], //High===low
	[2, 1, 3], //Why are you throwing this, it's valid?? But: full range
];
let count = 0;
for (const [value, low, highInc] of oorTests) {
	tsts(`OutOfRangeError[${count++}]`, () => {
		const e = new OutOfRangeError('irrelevant', value, low, highInc);
		assert.instance(e, Error);
	});
}

tsts('NegativeError', () => {
	const e = new NegativeError('irrelevant', 11);
	assert.instance(e, Error);
});

tsts('ZeroError', () => {
	const e = new ZeroError('irrelevant');
	assert.instance(e, Error);
});

tsts('NotEnoughSpaceError', () => {
	const e = new NotEnoughSpaceError('irrelevant', 1, 3);
	assert.instance(e, Error);
});

tsts('NotEnoughDataError', () => {
	const e = new NotEnoughDataError('irrelevant', 'hefferlumps', 2, 1);
	assert.instance(e, Error);
});

const neTests: [string | undefined][] = [['irrelevant'], [undefined]];
count = 0;
for (const [reason] of neTests) {
	tsts(`NullError[${count++}]`, () => {
		const e = new NullError(reason);
		assert.instance(e, Error);
	});
}

const nsTests: [string | undefined][] = [['irrelevant'], [undefined]];
count = 0;
for (const [reason] of nsTests) {
	tsts(`NotSupportedError[${count++}]`, () => {
		const e = new NotSupportedError(reason);
		assert.instance(e, Error);
	});
}

tsts('Grievous', () => {
	const e = new Grievous('irrelevant');
	assert.instance(e, Error);
});

tsts.run();
