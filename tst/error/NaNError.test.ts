import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { NaNError } from '../../src/error/NaNError';

const tsts = suite('NaNError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new NaNError('$noun');
	assert.is(e.name, 'NaNError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('NaNError') > 0, true);

	assert.is(e.message.startsWith('$noun should be a number, got NaN'),true, 'message');
});

tsts.run();
