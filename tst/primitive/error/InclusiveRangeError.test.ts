import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { InclusiveRangeError } from '../../../src/primitive/error/InclusiveRangeError';

const tsts = suite('InclusiveRangeError');
//While these are rigid we need to make sure the error message is reasonable

const argSet: [number,number,number, string][] = [
    [7,1,5,'Should be in range [1,5] got 7'],
];
for (const [value,lowInc,highInc, expect] of argSet) {
	tsts(`InclusiveRangeError(${value},${lowInc},${highInc})`, () => {

		const e = new InclusiveRangeError(value,lowInc,highInc);
		assert.is(e.message, expect, 'message');
		assert.is(e.value, value, 'value');
        assert.is(e.lowInc, lowInc, 'lowInc');
		assert.is(e.highInc, highInc, 'highInc');
	});
}

tsts('name', () => {
    const e=new InclusiveRangeError(7,1,5);
	assert.is(e.name, 'InclusiveRangeError');
});

tsts('[Symbol.toStringTag]', () => {
    const e=new InclusiveRangeError(7,1,5);
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('InclusiveRangeError') > 0, true);
});

tsts.run();
